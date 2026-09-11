import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles, invalidateUserCache } from '../../middlewares/auth.middleware';
import { badRequest, conflict, forbidden, notFound } from '../../shared/errors';

export const usersAdminRouter = Router(); // mount tại /admin/users

const idParam = z.object({ id: z.string().uuid() });
const phoneRegex = /^0\d{9}$/;

// GET /admin/users — SA tất cả; PA tìm user để cấp quyền và xem MM trong tỉnh mình
usersAdminRouter.get(
  '/',
  requireRoles('super_admin', 'province_admin'),
  validate({
    query: pageQuery.extend({
      role: z.enum(['super_admin', 'province_admin', 'market_manager', 'user']).optional(),
      search: z.string().trim().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const me = req.user!;
      let where: Prisma.usersWhereInput = {
        role: q.role ?? { in: ['super_admin', 'province_admin', 'market_manager'] },
        ...(q.search
          ? {
              OR: [
                { full_name: { contains: q.search, mode: 'insensitive' } },
                { username: { contains: q.search, mode: 'insensitive' } },
                { email: { contains: q.search, mode: 'insensitive' } },
                { phone: { contains: q.search } },
              ],
            }
          : {}),
      };
      if (me.role === 'province_admin') {
        if (q.role === 'user') {
          if (!q.search || q.search.length < 2)
            return paginated(res, [], { page: q.page, limit: q.limit, total: 0 });
          where = { ...where, role: 'user' };
        } else {
          where = {
            ...where,
            role: 'market_manager',
            market_managers: { some: { markets: { province_id: me.province_id! } } },
          };
        }
      }
      const [total, rows] = await Promise.all([
        prisma.users.count({ where }),
        prisma.users.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          select: {
            id: true,
            username: true,
            full_name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            merchant_status: true,
            province_id: true,
            created_at: true,
            provinces: { select: { id: true, name: true } },
            market_managers: { include: { markets: { select: { id: true, name: true } } } },
          },
        }),
      ]);
      paginated(
        res,
        rows.map(({ market_managers, provinces, ...u }) => ({
          ...u,
          province: provinces,
          managed_markets: market_managers.map((m) => m.markets),
        })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);

const createBody = z
  .object({
    role: z.enum(['province_admin', 'market_manager']),
    fullName: z.string().trim().min(1).max(255),
    username: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9._-]{2,49}$/, 'Username 3–50 ký tự, chỉ dùng chữ thường, số, ., _ hoặc -').optional(),
    email: z.string().email().max(255).optional(),
    phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ').optional(),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    provinceId: z.string().uuid().optional(),
    marketIds: z.array(z.string().uuid()).default([]),
  })
  .refine((b) => !!b.phone, { message: 'Số điện thoại là bắt buộc (dùng để đăng nhập)' })
  .refine((b) => b.role !== 'province_admin' || !!b.provinceId, {
    message: 'Tài khoản cấp tỉnh phải gán provinceId',
  });

// POST /admin/users (SA)
usersAdminRouter.post(
  '/',
  requireRoles('super_admin'),
  validate({ body: createBody }),
  async (req, res, next) => {
    try {
      const b = req.body;
      if (b.role === 'market_manager' && b.marketIds.length) {
        const count = await prisma.markets.count({ where: { id: { in: b.marketIds } } });
        if (count !== b.marketIds.length) throw badRequest('Danh sách chợ được gán không hợp lệ');
      }
      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.users.create({
          data: {
            role: b.role,
            username: b.username || null,
            full_name: b.fullName,
            email: b.email?.toLowerCase() ?? null,
            phone: b.phone ?? null,
            password_hash: await bcrypt.hash(b.password, 10),
            status: 'active',
            province_id: b.role === 'province_admin' ? b.provinceId : null,
          },
        });
        if (b.role === 'market_manager' && b.marketIds.length)
          await tx.market_managers.createMany({
            data: b.marketIds.map((market_id: string) => ({ user_id: created.id, market_id })),
          });
        return created;
      });
      ok(res, { id: user.id, username: user.username, full_name: user.full_name, email: user.email, role: user.role }, 201);
    } catch (e) {
      next(e);
    }
  },
);

// PUT /admin/users/:id (SA)
usersAdminRouter.put(
  '/:id',
  requireRoles('super_admin'),
  validate({
    params: idParam,
    body: z.object({
      fullName: z.string().trim().min(1).max(255).optional(),
      username: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9._-]{2,49}$/, 'Username 3–50 ký tự, chỉ dùng chữ thường, số, ., _ hoặc -').nullish(),
      email: z.string().email().max(255).optional(),
      phone: z.string().regex(phoneRegex).optional(),
      provinceId: z.string().uuid().nullish(),
      marketIds: z.array(z.string().uuid()).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const target = await prisma.users.findUnique({ where: { id: req.params.id } });
      if (!target || target.role === 'user') throw notFound('Không tìm thấy tài khoản quản trị');
      const b = req.body;
      const user = await prisma.$transaction(async (tx) => {
        const updated = await tx.users.update({
          where: { id: target.id },
          data: {
            full_name: b.fullName,
            username: b.username === null ? null : b.username,
            email: b.email?.toLowerCase(),
            phone: b.phone,
            ...(target.role === 'province_admin' && b.provinceId !== undefined
              ? { province_id: b.provinceId }
              : {}),
          },
        });
        if (target.role === 'market_manager' && b.marketIds) {
          await tx.market_managers.deleteMany({ where: { user_id: target.id } });
          if (b.marketIds.length)
            await tx.market_managers.createMany({
              data: b.marketIds.map((market_id: string) => ({ user_id: target.id, market_id })),
            });
        }
        return updated;
      });
      invalidateUserCache(target.id);
      ok(res, { id: user.id, full_name: user.full_name, email: user.email, role: user.role });
    } catch (e) {
      next(e);
    }
  },
);

// PATCH /admin/users/:id/status (SA)
usersAdminRouter.patch(
  '/:id/status',
  requireRoles('super_admin'),
  validate({ params: idParam, body: z.object({ status: z.enum(['active', 'inactive']) }) }),
  async (req, res, next) => {
    try {
      const target = await prisma.users.findUnique({ where: { id: req.params.id } });
      if (!target) throw notFound('Không tìm thấy tài khoản');
      if (target.id === req.user!.id) throw forbidden('PERM_DENIED', 'Không thể tự khóa tài khoản của mình');
      if (target.role === 'super_admin' && req.body.status === 'inactive') {
        const activeAdmins = await prisma.users.count({
          where: { role: 'super_admin', status: 'active' },
        });
        if (activeAdmins <= 1)
          throw conflict('STATE_INVALID', 'Không thể khóa super admin cuối cùng của hệ thống');
      }
      const user = await prisma.users.update({
        where: { id: target.id },
        data: { status: req.body.status },
      });
      invalidateUserCache(target.id);
      ok(res, { id: user.id, status: user.status });
    } catch (e) {
      next(e);
    }
  },
);

// POST /admin/users/:id/reset-password (SA)
usersAdminRouter.post(
  '/:id/reset-password',
  requireRoles('super_admin'),
  validate({ params: idParam, body: z.object({ newPassword: z.string().min(8) }) }),
  async (req, res, next) => {
    try {
      const target = await prisma.users.findUnique({ where: { id: req.params.id } });
      if (!target || target.role === 'user') throw notFound('Không tìm thấy tài khoản quản trị');
      await prisma.users.update({
        where: { id: target.id },
        data: { password_hash: await bcrypt.hash(req.body.newPassword, 10) },
      });
      invalidateUserCache(target.id);
      ok(res, { message: 'Đã đặt lại mật khẩu' });
    } catch (e) {
      next(e);
    }
  },
);

// PATCH /admin/users/:id/role — SA toàn hệ thống; PA chỉ quản lý MM thuộc tỉnh mình
usersAdminRouter.patch(
  '/:id/role',
  requireRoles('super_admin', 'province_admin'),
  validate({
    params: idParam,
    body: z.object({
      role: z.enum(['province_admin', 'market_manager', 'user']),
      provinceId: z.string().uuid().nullish(),
      marketIds: z.array(z.string().uuid()).optional(),
      phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ').optional(),
      email: z.string().email().max(255).optional(),
      password: z.string().min(8).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const me = req.user!;
      const target = await prisma.users.findUnique({
        where: { id: req.params.id },
        include: {
          market_managers: {
            include: { markets: { select: { province_id: true } } },
          },
        },
      });
      if (!target) throw notFound('Không tìm thấy người dùng');
      if (target.role === 'super_admin') throw forbidden('PERM_DENIED', 'Không thể đổi quyền của super admin');
      if (target.id === me.id) throw forbidden('PERM_DENIED', 'Không thể tự đổi quyền của mình');
      const b = req.body as {
        role: 'province_admin' | 'market_manager' | 'user';
        provinceId?: string | null;
        marketIds?: string[];
        phone?: string;
        email?: string;
        password?: string;
      };

      if (me.role === 'province_admin') {
        if (!me.province_id)
          throw forbidden('PERM_OUT_OF_SCOPE', 'Tài khoản cấp tỉnh chưa được gán tỉnh');
        if (b.role !== 'market_manager' && b.role !== 'user')
          throw forbidden('PERM_DENIED', 'Cấp tỉnh chỉ có thể cấp hoặc gỡ quyền quản lý chợ');
        if (target.role !== 'user' && target.role !== 'market_manager')
          throw forbidden('PERM_DENIED', 'Cấp tỉnh không thể thay đổi tài khoản quản trị cấp cao hơn');
        const outsideProvince = target.market_managers.some(
          (assignment) => assignment.markets.province_id !== me.province_id,
        );
        if (target.role === 'market_manager' && outsideProvince)
          throw forbidden('PERM_OUT_OF_SCOPE', 'Quản lý chợ này không thuộc phạm vi tỉnh của bạn');
      }

      // Gỡ quyền → về người dùng thường
      if (b.role === 'user') {
        await prisma.$transaction(async (tx) => {
          await tx.market_managers.deleteMany({ where: { user_id: target.id } });
          await tx.users.update({ where: { id: target.id }, data: { role: 'user', province_id: null } });
        });
        invalidateUserCache(target.id);
        return ok(res, { id: target.id, role: 'user' });
      }

      // Nâng quyền quản trị → đăng nhập CMS bằng SĐT nên bắt buộc có số điện thoại + mật khẩu (email tùy chọn)
      const phone = (b.phone ?? target.phone ?? '').trim() || null;
      if (!phone) throw badRequest('Người dùng chưa có số điện thoại — cần nhập SĐT để cấp quyền (dùng để đăng nhập)');
      if (!target.password_hash && !b.password)
        throw badRequest('Người dùng chưa có mật khẩu — cần đặt mật khẩu để cấp quyền quản trị');
      if (b.role === 'province_admin' && !b.provinceId)
        throw badRequest('Cần chọn tỉnh/thành cho tài khoản cấp tỉnh');
      if (b.role === 'market_manager' && (!b.marketIds || b.marketIds.length === 0))
        throw badRequest('Cần chọn ít nhất một chợ cho quản lý chợ');
      if (b.role === 'market_manager') {
        const count = await prisma.markets.count({
          where: {
            id: { in: b.marketIds! },
            ...(me.role === 'province_admin' ? { province_id: me.province_id! } : {}),
          },
        });
        if (count !== b.marketIds!.length) throw badRequest('Danh sách chợ không hợp lệ');
      }
      if (phone !== target.phone) {
        const dup = await prisma.users.findFirst({ where: { phone, id: { not: target.id } } });
        if (dup) throw conflict('PHONE_TAKEN', 'Số điện thoại đã được dùng bởi tài khoản khác');
      }
      const email = b.email ? b.email.toLowerCase() : undefined; // tùy chọn
      const passwordHash = b.password ? await bcrypt.hash(b.password, 10) : undefined;

      await prisma.$transaction(async (tx) => {
        await tx.users.update({
          where: { id: target.id },
          data: {
            role: b.role,
            phone,
            ...(email ? { email } : {}),
            status: 'active',
            ...(passwordHash ? { password_hash: passwordHash } : {}),
            province_id: b.role === 'province_admin' ? b.provinceId! : null,
          },
        });
        await tx.market_managers.deleteMany({ where: { user_id: target.id } });
        if (b.role === 'market_manager')
          await tx.market_managers.createMany({
            data: b.marketIds!.map((market_id) => ({ user_id: target.id, market_id })),
          });
      });
      invalidateUserCache(target.id);
      ok(res, { id: target.id, role: b.role, phone });
    } catch (e) {
      next(e);
    }
  },
);
