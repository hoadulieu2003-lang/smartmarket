import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../shared/errors';
import { logRequestError } from './request-logger.middleware';

export function notFoundHandler(req: Request, res: Response) {
  logRequestError(req, { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy đường dẫn API' });
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Không tìm thấy đường dẫn API' },
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    logRequestError(req, {
      status: err.status,
      code: err.code,
      message: err.message,
      cause: err.cause,
    });
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  if (err instanceof ZodError) {
    logRequestError(req, {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu gửi lên không hợp lệ',
    });
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu gửi lên không hợp lệ',
        details: err.errors.map((e) => ({ field: e.path.join('.'), issue: e.message })),
      },
    });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      logRequestError(req, {
        status: 409,
        code: 'DUPLICATE_CODE',
        message: 'Dữ liệu bị trùng (mã/số điện thoại/email đã tồn tại)',
      });
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_CODE',
          message: 'Dữ liệu bị trùng (mã/số điện thoại/email đã tồn tại)',
          details: { target: err.meta?.target },
        },
      });
    }
    if (err.code === 'P2003') {
      logRequestError(req, {
        status: 409,
        code: 'STATE_INVALID',
        message: 'Không thể thao tác vì dữ liệu đang được tham chiếu ở nơi khác',
      });
      return res.status(409).json({
        success: false,
        error: {
          code: 'STATE_INVALID',
          message: 'Không thể thao tác vì dữ liệu đang được tham chiếu ở nơi khác',
        },
      });
    }
    if (err.code === 'P2025') {
      logRequestError(req, { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu' });
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu' },
      });
    }
  }
  const requestId = req.requestId;
  logRequestError(req, {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'Có lỗi xảy ra, vui lòng thử lại sau',
    cause: err,
  });
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Có lỗi xảy ra, vui lòng thử lại sau',
      details: requestId ? { requestId } : undefined,
    },
  });
}
