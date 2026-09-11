import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

/**
 * Giới hạn pool để mỗi tiến trình không ôm quá nhiều kết nối tới Postgres
 * (nguyên nhân lỗi P2037 "too many clients"). Nếu DATABASE_URL đã tự khai
 * connection_limit / pool_timeout thì tôn trọng giá trị có sẵn.
 */
const connectionLimit = env.DB_CONNECTION_LIMIT ?? (env.NODE_ENV === 'production' ? 10 : 5);

function withPoolParams(rawUrl: string): string {
  const params: string[] = [];
  if (!/[?&]connection_limit=/.test(rawUrl)) params.push(`connection_limit=${connectionLimit}`);
  if (!/[?&]pool_timeout=/.test(rawUrl)) params.push(`pool_timeout=${env.DB_POOL_TIMEOUT}`);
  if (params.length === 0) return rawUrl;
  return rawUrl + (rawUrl.includes('?') ? '&' : '?') + params.join('&');
}

// Singleton: tránh tạo nhiều PrismaClient (nhiều pool) trong cùng một tiến trình.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn', 'error'],
    datasources: { db: { url: withPoolParams(env.DATABASE_URL) } },
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
