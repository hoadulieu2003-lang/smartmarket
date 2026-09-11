import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(10),
  // Giới hạn connection pool của Prisma cho MỖI tiến trình (chống "too many clients").
  // Bỏ trống => mặc định theo NODE_ENV (dev 5, prod 10). pool_timeout tính bằng giây.
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().optional(),
  DB_POOL_TIMEOUT: z.coerce.number().int().nonnegative().default(20),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('30m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  ZALO_APP_ID: z.string().optional().default(''),
  ZALO_APP_SECRET: z.string().optional().default(''),
  ZALO_MOCK: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  MAX_UPLOAD_MB: z.coerce.number().default(5),
  S3_ENDPOINT: z.string().url(),
  S3_BUCKET: z.string().trim().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_REGION: z.string().trim().default('us-east-1'),
  S3_UPLOAD_PREFIX: z.string().trim().default('uploads'),
  S3_PUBLIC_BASE_URL: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().url().optional(),
  ),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  CORS_ORIGINS: z.string().default(''),
  ENABLE_CRON: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast khi thiếu/sai biến môi trường
  console.error('Biến môi trường không hợp lệ:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
