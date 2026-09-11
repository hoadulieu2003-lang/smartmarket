import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

const QUIET_PATHS = new Set(['/healthz', '/readyz']);

function shouldLog(req: Request) {
  return env.NODE_ENV !== 'test' && !QUIET_PATHS.has(req.path) && !req.path.startsWith('/docs');
}

/** Log request tối giản: chỉ một dòng lúc request đi vào, không log response thành công. */
export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  req.requestId = randomUUID().slice(0, 8);
  if (shouldLog(req)) console.info(`→ ${req.method} ${req.originalUrl}`);
  next();
}

/** Log đúng một dòng tóm tắt cho lỗi; stack chỉ dành cho lỗi server ngoài dự kiến. */
export function logRequestError(
  req: Request,
  input: { status: number; code: string; message: string; cause?: unknown },
) {
  if (!shouldLog(req)) return;
  console.error(`✖ ${req.method} ${req.originalUrl} → ${input.status} ${input.code}: ${input.message}`);
  if (input.status >= 500 && input.cause) {
    console.error(input.cause instanceof Error ? input.cause.stack ?? input.cause.message : input.cause);
  }
}
