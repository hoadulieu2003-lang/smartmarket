import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import { auth } from '../../middlewares/auth.middleware';
import { AppError } from '../../shared/errors';
import { ok } from '../../shared/response';
import { putPublicImage, uploadObjectKey } from '../../shared/s3';

export const uploadsRouter = Router();

const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

// Magic bytes cơ bản — không tin Content-Type
function sniffOk(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // jpg
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true; // png
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return true; // webp
  return false;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype))
      return cb(new AppError(415, 'UPLOAD_TYPE_INVALID', 'Chỉ chấp nhận ảnh JPG/PNG/WEBP'));
    cb(null, true);
  },
});

uploadsRouter.post('/', auth, (req, res, next) => {
  upload.array('files', 6)(req, res, (err: any) => {
    if (err) {
      if (err instanceof AppError) return next(err);
      if (err?.code === 'LIMIT_FILE_SIZE')
        return next(new AppError(413, 'UPLOAD_TOO_LARGE', `Ảnh vượt quá ${env.MAX_UPLOAD_MB}MB`));
      return next(new AppError(400, 'VALIDATION_ERROR', 'Upload thất bại'));
    }
    void (async () => {
      const files = (req.files as Express.Multer.File[]) ?? [];
      if (files.length === 0)
        throw new AppError(400, 'VALIDATION_ERROR', 'Chưa chọn file nào (field: files)');
      for (const f of files) {
        if (!sniffOk(f.buffer))
          throw new AppError(415, 'UPLOAD_TYPE_INVALID', 'Nội dung file không phải ảnh hợp lệ');
      }

      const now = new Date();
      const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
      const saved = await Promise.all(
        files.map(async (f) => {
          const key = uploadObjectKey(`${folder}/${randomUUID()}${ALLOWED.get(f.mimetype)}`);
          const url = await putPublicImage({ key, body: f.buffer, contentType: f.mimetype });
          return { url };
        }),
      );
      ok(res, { files: saved }, 201);
    })().catch((e) => {
      if (e instanceof AppError) return next(e);
      next(new AppError(
        502,
        'UPLOAD_STORAGE_ERROR',
        'Không thể lưu ảnh lên kho S3, vui lòng thử lại',
        undefined,
        e,
      ));
    });
  });
});
