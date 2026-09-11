import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';
import { auth, requireRoles, verifyRefresh, signTokens } from '../../middlewares/auth.middleware';
import { loginRateLimit, resetLoginBucket } from '../../middlewares/rate-limit.middleware';
import { ok } from '../../shared/response';
import { prisma } from '../../shared/prisma';
import { unauthorized } from '../../shared/errors';
import * as svc from './auth.service';

export const authRouter = Router();
export const usersMeRouter = Router();

const phoneRegex = /^0\d{9}$/;

const webCookieOptions = (path: string) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path,
});

function setWebCookies(res: import('express').Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie('sm_web_access', tokens.accessToken, { ...webCookieOptions('/api/v1'), maxAge: 15 * 60 * 1000 });
  res.cookie('sm_web_refresh', tokens.refreshToken, { ...webCookieOptions('/api/v1/auth/web'), maxAge: 30 * 24 * 60 * 60 * 1000 });
}

function clearWebCookies(res: import('express').Response) {
  res.clearCookie('sm_web_access', webCookieOptions('/api/v1'));
  res.clearCookie('sm_web_refresh', webCookieOptions('/api/v1/auth/web'));
}

authRouter.post(
  '/zalo-login',
  validate({
    body: z.object({
      accessToken: z.string().min(1),
      userInfo: z.object({
        id: z.string().min(1),
        name: z.string().max(255).optional(),
        avatar: z.string().url().optional(),
      }).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const { tokens, me } = await svc.zaloLogin(req.body.accessToken, req.body.userInfo);
      ok(res, { ...tokens, ...me });
    } catch (e) {
      next(e);
    }
  },
);

authRouter.post(
  '/login',
  loginRateLimit,
  validate({
    body: z.object({ identifier: z.string().trim().min(1), password: z.string().min(1) }),
  }),
  async (req, res, next) => {
    try {
      const { tokens, me } = await svc.cmsLogin(req.body.identifier, req.body.password);
      resetLoginBucket(req);
      ok(res, { ...tokens, ...me });
    } catch (e) {
      next(e);
    }
  },
);

authRouter.post(
  '/web/login',
  loginRateLimit,
  validate({ body: z.object({ identifier: z.string().trim().min(1), password: z.string().min(1) }) }),
  async (req, res, next) => {
    try {
      const { tokens, me } = await svc.webLogin(req.body.identifier, req.body.password);
      setWebCookies(res, tokens);
      resetLoginBucket(req);
      ok(res, me);
    } catch (e) {
      next(e);
    }
  },
);

authRouter.post(
  '/web/register',
  validate({
    body: z.object({
      fullName: z.string().trim().min(2).max(100),
      phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ'),
      password: z.string().min(8).max(72).regex(/[A-Za-z]/, 'Mật khẩu phải có chữ cái').regex(/\d/, 'Mật khẩu phải có chữ số'),
    }),
  }),
  async (req, res, next) => {
    try {
      const { tokens, me } = await svc.webRegister(req.body.fullName, req.body.phone, req.body.password);
      setWebCookies(res, tokens);
      ok(res, me, 201);
    } catch (e) {
      next(e);
    }
  },
);

authRouter.post('/web/refresh', async (req, res, next) => {
  try {
    const token = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('sm_web_refresh='))?.slice('sm_web_refresh='.length);
    if (!token) throw unauthorized('AUTH_TOKEN_INVALID', 'Thiếu phiên đăng nhập');
    const userId = verifyRefresh(token);
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'user' || user.status !== 'active') throw unauthorized('AUTH_TOKEN_INVALID', 'Phiên đăng nhập không hợp lệ');
    const tokens = signTokens(user);
    setWebCookies(res, tokens);
    ok(res, { refreshed: true });
  } catch (e) {
    clearWebCookies(res);
    next(e);
  }
});

authRouter.post('/web/logout', (_req, res) => {
  clearWebCookies(res);
  ok(res, { loggedOut: true });
});

authRouter.post(
  '/refresh',
  validate({ body: z.object({ refreshToken: z.string().min(1) }) }),
  async (req, res, next) => {
    try {
      const userId = verifyRefresh(req.body.refreshToken);
      ok(res, await svc.refreshTokens(userId));
    } catch (e) {
      next(e);
    }
  },
);

authRouter.get('/me', auth, async (req, res, next) => {
  try {
    ok(res, await svc.buildMePayload(req.user!));
  } catch (e) {
    next(e);
  }
});

authRouter.put(
  '/change-password',
  auth,
  requireRoles('super_admin', 'province_admin', 'market_manager'),
  validate({
    body: z.object({ oldPassword: z.string().min(1), newPassword: z.string().min(8) }),
  }),
  async (req, res, next) => {
    try {
      await svc.changePassword(req.user!, req.body.oldPassword, req.body.newPassword);
      ok(res, { message: 'Đổi mật khẩu thành công' });
    } catch (e) {
      next(e);
    }
  },
);

usersMeRouter.put(
  '/me',
  auth,
  validate({
    body: z.object({
      fullName: z.string().trim().min(1).max(255).optional(),
      avatar: z.string().url().optional(),
      gender: z.number().int().min(0).max(2).optional(),
      bankName: z.string().max(255).optional(),
      bankCode: z.string().max(50).optional(),
      bankAccountNumber: z.string().max(50).optional(),
      bankAccountHolder: z.string().max(255).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      ok(res, await svc.updateProfile(req.user!, req.body));
    } catch (e) {
      next(e);
    }
  },
);

usersMeRouter.post(
  '/me/zalo-phone',
  auth,
  validate({
    body: z.object({
      phoneToken: z.string().min(1).optional(),
      accessToken: z.string().min(1).optional(),
      mockPhone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ').optional(),
      userInfo: z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1).max(255),
        avatar: z.string().url().optional(),
      }).optional(),
    }).refine(
      (body) => !!body.mockPhone || (!!body.phoneToken && !!body.accessToken && !!body.userInfo),
      { message: 'Cần phoneToken + accessToken + userInfo hoặc mockPhone' },
    ),
  }),
  async (req, res, next) => {
    try {
      ok(res, await svc.updateZaloContact(req.user!, req.body));
    } catch (e) {
      next(e);
    }
  },
);

usersMeRouter.put(
  '/me/selected-market',
  auth,
  validate({ body: z.object({ marketId: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      ok(res, await svc.setSelectedMarket(req.user!, req.body.marketId));
    } catch (e) {
      next(e);
    }
  },
);
