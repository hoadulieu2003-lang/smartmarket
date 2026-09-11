export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
    public cause?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new AppError(400, 'VALIDATION_ERROR', msg, details);
export const unauthorized = (code: string, msg: string) => new AppError(401, code, msg);
export const forbidden = (code: string, msg: string) => new AppError(403, code, msg);
export const notFound = (msg = 'Không tìm thấy dữ liệu') => new AppError(404, 'NOT_FOUND', msg);
export const conflict = (code: string, msg: string, details?: unknown) =>
  new AppError(409, code, msg, details);
export const upstreamError = (code: string, msg: string, details?: unknown) =>
  new AppError(502, code, msg, details);
export const serviceUnavailable = (code: string, msg: string) =>
  new AppError(503, code, msg);
