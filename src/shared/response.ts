import type { Response } from 'express';
import { Prisma } from '@prisma/client';

const SENSITIVE_KEYS = new Set(['password_hash', 'passwordHash']);
// Các key mà value bên trong được giữ nguyên (không camelize) — vd app_settings.value
const PRESERVE_KEYS = new Set(['value']);

const camel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

function isDecimal(v: unknown): v is { toNumber(): number } {
  if (v === null || typeof v !== 'object') return false;
  if (Prisma.Decimal.isDecimal(v)) return true;
  // Fallback: cấu trúc decimal.js {s,e,d} có toNumber
  const anyV = v as any;
  return typeof anyV.toNumber === 'function' && Array.isArray(anyV.d) && typeof anyV.e === 'number';
}

/** Deep transform: snake_case→camelCase, Decimal→number, BigInt→number, bỏ field nhạy cảm. */
export function sanitize(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (isDecimal(input)) return input.toNumber();
  if (typeof input === 'bigint') return Number(input);
  if (input instanceof Date) return input;
  if (Array.isArray(input)) return input.map((v) => sanitize(v));
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) continue;
      const key = camel(k);
      out[key] = PRESERVE_KEYS.has(k) ? v : sanitize(v);
    }
    return out;
  }
  return input;
}

export function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data: sanitize(data) });
}

export function paginated(
  res: Response,
  data: unknown[],
  meta: { page: number; limit: number; total: number },
) {
  return res.json({
    success: true,
    data: sanitize(data),
    meta: { ...meta, totalPages: Math.max(1, Math.ceil(meta.total / meta.limit)) },
  });
}
