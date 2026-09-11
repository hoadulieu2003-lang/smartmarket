import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { users, user_role } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../shared/prisma';
import { forbidden, unauthorized } from '../shared/errors';

const userCache = new Map<string, { user: users; ts: number }>();
const CACHE_TTL_MS = 30_000;

export function invalidateUserCache(userId?: string) {
  if (userId) userCache.delete(userId);
  else userCache.clear();
}

async function loadUser(id: string): Promise<users | null> {
  const hit = userCache.get(id);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.user;
  const user = await prisma.users.findUnique({ where: { id } });
  if (user) userCache.set(id, { user, ts: Date.now() });
  return user;
}

export function signTokens(user: { id: string; role: string }) {
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign(
    { sub: user.id, tokenType: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL } as jwt.SignOptions,
  );
  return { accessToken, refreshToken };
}

export function verifyRefresh(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
    if (payload.tokenType !== 'refresh' || !payload.sub) throw new Error('bad');
    return payload.sub;
  } catch {
    throw unauthorized('AUTH_TOKEN_INVALID', 'Refresh token không hợp lệ');
  }
}

/** Bắt buộc có JWT hợp lệ; nạp user từ DB (cache 30s) vào req.user. */
export async function auth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : req.headers.cookie
        ?.split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('sm_web_access='))
        ?.slice('sm_web_access='.length) || null;
    if (!token) throw unauthorized('AUTH_TOKEN_INVALID', 'Thiếu access token');
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
    } catch (e: any) {
      throw unauthorized(
        e?.name === 'TokenExpiredError' ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID',
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }
    const user = await loadUser(String(payload.sub));
    if (!user) throw unauthorized('AUTH_TOKEN_INVALID', 'Tài khoản không tồn tại');
    if (user.status !== 'active') throw forbidden('AUTH_ACCOUNT_LOCKED', 'Tài khoản đã bị khóa');
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireRoles(...roles: user_role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized('AUTH_TOKEN_INVALID', 'Chưa đăng nhập'));
    if (!roles.includes(req.user.role))
      return next(forbidden('PERM_DENIED', 'Bạn không có quyền truy cập chức năng này'));
    next();
  };
}

/** Gắn req.scope cho các role CMS. */
export async function attachScope(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    if (user.role === 'super_admin') req.scope = { all: true };
    else if (user.role === 'province_admin') {
      if (!user.province_id)
        throw forbidden('PERM_OUT_OF_SCOPE', 'Tài khoản cấp tỉnh chưa được gán tỉnh');
      req.scope = { provinceId: user.province_id };
    } else if (user.role === 'market_manager') {
      const rows = await prisma.market_managers.findMany({
        where: { user_id: user.id },
        select: { market_id: true },
      });
      req.scope = { marketIds: rows.map((r) => r.market_id) };
    } else {
      throw forbidden('PERM_DENIED', 'Bạn không có quyền truy cập hệ thống quản lý');
    }
    next();
  } catch (e) {
    next(e);
  }
}

/** Guard cho các API /seller/* — yêu cầu tiểu thương active và có sạp được gán. */
export async function requireActiveSeller(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    if (user.role !== 'user' || user.merchant_status !== 'active')
      throw forbidden('SELLER_NOT_ACTIVE', 'Tài khoản của bạn không phải tiểu thương đang hoạt động');
    const contract = await prisma.contracts.findFirst({
      where: { merchant_id: user.id, ended_at: null },
      orderBy: { created_at: 'desc' },
      include: { stalls: true },
    });
    if (!contract) throw forbidden('SELLER_NO_STALL', 'Bạn chưa được gán sạp nào');
    req.seller = {
      stallId: contract.stall_id,
      marketId: contract.stalls.market_id,
      stall: contract.stalls,
      contractId: contract.id,
    };
    next();
  } catch (e) {
    next(e);
  }
}
