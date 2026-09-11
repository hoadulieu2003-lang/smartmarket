/**
 * Chuyển giấy tờ hồ sơ tiểu thương (CCCD, giấy phép) từ kho PUBLIC sang kho RIÊNG TƯ.
 *
 * Vì sao cần: trước đây chỉ có một đường upload duy nhất, đẩy tất cả lên bucket public kèm
 * `CacheControl: public, max-age=31536000`. Ảnh CCCD vì thế mở bằng URL trần là xem được,
 * không cần đăng nhập.
 *
 * Script làm gì: với mỗi `merchant_applications.documents` dạng cũ `{ url }`:
 *   1. suy ngược object key từ URL
 *   2. copy sang kho riêng tư
 *   3. đổi bản ghi DB sang `{ key }`
 *   4. xóa bản public (bỏ qua nếu chạy với --keep-public)
 *
 * Chạy:
 *   npm run migrate:private-docs                 # dry-run
 *   npm run migrate:private-docs -- --apply      # chạy thật
 *   npm run migrate:private-docs -- --apply --keep-public   # chạy thật nhưng giữ bản public
 *
 * ⚠️ Chạy dry-run trước. ⚠️ Cần backup mới trước khi --apply (bước xóa bản public không lùi được).
 * ⚠️ Chạy SAU khi đã deploy backend mới — CMS phải biết đọc `{ key }` qua signed-url,
 *    nếu không màn hình duyệt hồ sơ sẽ không hiện được ảnh.
 */
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/shared/prisma';
import {
  copyPublicToPrivate,
  deletePublicObject,
  objectKeyFromPublicUrl,
  privateObjectKey,
} from '../src/shared/s3';

const APPLY = process.argv.includes('--apply');
const KEEP_PUBLIC = process.argv.includes('--keep-public');
const OUT_DIR = path.resolve(__dirname, '..', 'backfill-manifest');
const UPLOAD_PREFIX = (process.env.S3_UPLOAD_PREFIX ?? 'uploads').replace(/^\/+|\/+$/g, '');

type Item = {
  applicationId: string;
  index: number;
  publicUrl: string;
  sourceKey: string | null;
  targetKey: string | null;
  status: 'migrate' | 'already-private' | 'external-url';
};

async function run() {
  console.info(APPLY ? '=== CHUYỂN GIẤY TỜ: GHI THẬT (--apply) ===' : '=== CHUYỂN GIẤY TỜ: DRY-RUN ===');

  const apps = await prisma.merchant_applications.findMany({
    select: { id: true, documents: true },
  });

  const items: Item[] = [];
  for (const app of apps) {
    const docs = Array.isArray(app.documents) ? app.documents : [];
    docs.forEach((raw, index) => {
      const doc = raw as { key?: string; url?: string } | null;
      if (doc?.key) {
        items.push({
          applicationId: app.id,
          index,
          publicUrl: '',
          sourceKey: doc.key,
          targetKey: doc.key,
          status: 'already-private',
        });
        return;
      }
      if (!doc?.url) return;
      const rawKey = objectKeyFromPublicUrl(doc.url);
      // Chỉ đụng vào object nằm dưới prefix upload của hệ thống. Không có chặn này thì một
      // hồ sơ cố tình khai URL của ảnh sản phẩm sẽ khiến script chuyển & XÓA mất ảnh đó.
      const sourceKey = rawKey && rawKey.startsWith(`${UPLOAD_PREFIX}/`) ? rawKey : null;
      items.push({
        applicationId: app.id,
        index,
        publicUrl: doc.url,
        sourceKey,
        // Giữ nguyên đường dẫn tương đối, chỉ đổi prefix → dễ đối chiếu khi cần lần ngược.
        targetKey: sourceKey ? privateObjectKey(sourceKey) : null,
        // URL không thuộc kho upload của hệ thống (link ngoài, ảnh seed) → bỏ qua.
        status: sourceKey ? 'migrate' : 'external-url',
      });
    });
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(OUT_DIR, `private-docs-${stamp}.csv`);
  fs.writeFileSync(
    file,
    [
      'application_id,doc_index,status,public_url,source_key,target_key',
      ...items.map((i) =>
        [i.applicationId, i.index, i.status, i.publicUrl, i.sourceKey ?? '', i.targetKey ?? ''].join(','),
      ),
    ].join('\n'),
    'utf8',
  );

  const count = (s: Item['status']) => items.filter((i) => i.status === s).length;
  console.info(
    `Tổng ${items.length} tài liệu | cần chuyển ${count('migrate')} | đã riêng tư ${count('already-private')} | link ngoài ${count('external-url')}`,
  );
  console.info(`Manifest: ${file}`);
  if (count('external-url') > 0)
    console.warn('⚠️  Có tài liệu là link ngoài kho hệ thống — script không đụng tới, kiểm tra tay.');

  if (!APPLY) {
    console.info('\nDry-run — chưa chuyển gì. Thêm --apply để chạy thật.');
    return;
  }

  const toMigrate = items.filter((i) => i.status === 'migrate');
  const byApp = new Map<string, Item[]>();
  for (const i of toMigrate) {
    byApp.set(i.applicationId, [...(byApp.get(i.applicationId) ?? []), i]);
  }

  let moved = 0;
  /**
   * Object public đã copy sang kho riêng tư và DB đã trỏ sang `{key}`, nhưng lệnh xóa bản
   * public THẤT BẠI. Chạy lại script sẽ thấy chúng là `already-private` nên không thử xóa
   * nữa — tức là ảnh CCCD vẫn nằm công khai mà không ai biết. Vì vậy phải ghi ra file riêng
   * để dọn tay.
   */
  const orphanPublicKeys: { applicationId: string; key: string; error: string }[] = [];

  for (const [applicationId, list] of byApp) {
    // Copy hết trước, cập nhật DB sau — nếu copy hỏng giữa chừng thì DB chưa đổi, chạy lại được.
    for (const i of list) await copyPublicToPrivate(i.sourceKey!, i.targetKey!);

    const app = await prisma.merchant_applications.findUnique({
      where: { id: applicationId },
      select: { documents: true },
    });
    // Khớp theo NỘI DUNG (url), không theo chỉ số của lần quét trước: nếu người dùng vừa
    // sửa hồ sơ, thứ tự mảng đã đổi và ghi theo chỉ số cũ sẽ đè nhầm / tạo lỗ hổng null.
    const byUrl = new Map(list.map((i) => [i.publicUrl, i.targetKey]));
    const docs = (Array.isArray(app?.documents) ? [...app!.documents] : []) as any[];
    const next = docs.map((d) => {
      const url = (d as { url?: string } | null)?.url;
      const target = url ? byUrl.get(url) : undefined;
      return target ? { key: target } : d;
    });
    await prisma.merchant_applications.update({
      where: { id: applicationId },
      data: { documents: next },
    });

    if (!KEEP_PUBLIC) {
      for (const i of list) {
        try {
          await deletePublicObject(i.sourceKey!);
        } catch (e) {
          // Không dừng cả lượt chạy vì một object xóa lỗi — nhưng phải ghi lại, xem chú thích
          // ở khai báo orphanPublicKeys.
          orphanPublicKeys.push({
            applicationId,
            key: i.sourceKey!,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }
    moved += list.length;
    console.info(`  hồ sơ ${applicationId}: chuyển ${list.length} tài liệu (tổng ${moved})`);
  }

  if (orphanPublicKeys.length) {
    const cleanupFile = path.join(OUT_DIR, `private-docs-cleanup-${stamp}.csv`);
    fs.writeFileSync(
      cleanupFile,
      [
        'application_id,public_key_can_xoa,loi',
        ...orphanPublicKeys.map((o) => [o.applicationId, o.key, JSON.stringify(o.error)].join(',')),
      ].join('\n'),
      'utf8',
    );
    console.error(
      `\n🔴 ${orphanPublicKeys.length} object KHÔNG xóa được khỏi kho public dù DB đã chuyển sang key riêng tư.\n` +
        `   Ảnh vẫn đang truy cập công khai. Danh sách cần xóa tay: ${cleanupFile}\n` +
        '   Chạy lại script sẽ KHÔNG tự xóa chúng (đã là already-private).',
    );
  }

  console.info(
    `✅ Hoàn tất: ${moved} tài liệu.${KEEP_PUBLIC ? ' Bản public được GIỮ LẠI (--keep-public) — nhớ xóa sau khi xác nhận.' : ''}`,
  );
}

run()
  .catch((e) => {
    console.error('Chuyển tài liệu thất bại:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
