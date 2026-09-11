import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Rate limit in-memory đơn giản (đủ cho MVP 1 instance). */
export function rateLimit(opts: { windowMs: number; max: number; keyFn?: (req: Request) => string }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = `${req.path}:${opts.keyFn ? opts.keyFn(req) : req.ip}`;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || b.resetAt < now) {
      b = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > opts.max) {
      return next(new AppError(429, 'RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau'));
    }
    next();
  };
}

export const loginKeyFn = (req: Request) => `${req.ip}:${req.body?.identifier ?? ''}`;

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyFn: loginKeyFn,
});

/** Đăng nhập thành công → xóa bộ đếm (PRD: chỉ giới hạn 5 lần THẤT BẠI/15 phút). */
export function resetLoginBucket(req: Request) {
  buckets.delete(`${req.path}:${loginKeyFn(req)}`);
}
