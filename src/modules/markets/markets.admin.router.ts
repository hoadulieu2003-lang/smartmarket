import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles } from '../../middlewares/auth.middleware';
import { assertMarketInScope, marketIdsForScope } from '../../shared/scope';
import { badRequest, conflict, notFound } from '../../shared/errors';
import { marketStats } from './markets.service';
import { resolveGoogleMapsUrl } from '../../shared/google-maps';

export const marketsAdminRouter = Router();

const idParam = z.object({ id: z.string().uuid() });
const imageArr = z.array(z.object({ url: z.string().url() })).default([]);

const marketBody = z.object({
  provinceId: z.string().uuid(),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(255),
  address: z.string().trim().min(1),
  googleMapsUrl: z.string().url().max(4000).nullish(),
  phone: z.string().max(20).nullish(),
  email: z.string().email().max(255).nullish(),
  description: z.string().max(5000).nullish(),
  images: imageArr,
  openHours: z.string().max(100).nullish(),
  mapLink: z.string().url().max(2000).nullish(),
  managerIds: z.array(z.string().uuid()).default([]),
});

marketsAdminRouter.post(
  '/resolve-google-maps',
  requireRoles('super_admin'),
  validate({ body: z.object({ googleMapsUrl: z.string().url().max(4000) }) }),
  async (req, res, next) => {
    try {
      ok(res, await resolveGoogleMapsUrl(req.body.googleMapsUrl));
    } catch (e) {
      next(e);
    }
  },
);

// GET /admin/markets
marketsAdminRouter.get(
  '/',
  validate({
    query: pageQuery.extend({
      provinceId: z.string().uuid().optional(),
      marketId: z.string().uuid().optional(),
      status: z.enum(['active', 'inactive']).optional(),
      search: z.string().trim().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const scopeIds = await marketIdsForScope(req.scope!);
      if (q.marketId) await assertMarketInScope(req.scope!, q.marketId);
      const where: Prisma.marketsWhereInput = {
        ...(q.marketId ? { id: q.marketId } : scopeIds ? { id: { in: scopeIds } } : {}),
        province_id: q.provinceId,
        status: q.status,
        ...(q.search
          ? { OR: [{ name: { contains: q.search, mode: 'insensitive' } }, { code: { contains: q.search, mode: 'insensitive' } }] }
          : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.markets.count({ where }),
        prisma.markets.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            provinces: { select: { id: true, name: true } },
            market_managers: { include: { users: { select: { id: true, full_name: true } } } },
          },
        }),
      ]);
      const stats = await marketStats(rows.map((m) => m.id));
      paginated(
        res,
        rows.map(({ market_managers, ...m }) => ({
          ...m,
          ...stats.get(m.id),
          managers: market_managers.map((mm) => mm.users),
        })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);

// POST /admin/markets (SA)
marketsAdminRouter.post(
  '/',
  requireRoles('super_admin'),
  validate({ body: marketBody }),
  async (req, res, next) => {
    try {
      const b = req.body;
      const googleMaps = b.googleMapsUrl ? await resolveGoogleMapsUrl(b.googleMapsUrl) : null;
      if (b.managerIds.length) {
        const managers = await prisma.users.findMany({
          where: { id: { in: b.managerIds }, role: 'market_manager' },
        });
        if (managers.length !== b.managerIds.length)
          throw badRequest('Danh sách quản lý chợ không hợp lệ (phải là tài khoản market_manager)');
      }
      const market = await prisma.$transaction(async (tx) => {
        const m = await tx.markets.create({
          data: {
            province_id: b.provinceId,
            code: b.code,
            name: b.name,
            address: b.address,
            latitude: googleMaps?.latitude ?? null,
            longitude: googleMaps?.longitude ?? null,
            google_maps_url: googleMaps?.url ?? null,
            phone: b.phone ?? null,
            email: b.email ?? null,
            description: b.description ?? null,
            images: b.images,
            open_hours: b.openHours ?? null,
            map_link: b.mapLink ?? null,
            status: 'active',
          },
        });
        if (b.managerIds.length)
          await tx.market_managers.createMany({
            data: b.managerIds.map((user_id: string) => ({ user_id, market_id: m.id })),
          });
        return m;
      });
      ok(res, market, 201);
    } catch (e) {
      next(e);
    }
  },
);

// GET /admin/markets/:id
marketsAdminRouter.get('/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    await assertMarketInScope(req.scope!, req.params.id);
    const market = await prisma.markets.findUnique({
      where: { id: req.params.id },
      include: {
        provinces: { select: { id: true, name: true } },
        market_managers: { include: { users: { select: { id: true, full_name: true, email: true, phone: true } } } },
      },
    });
    if (!market) throw notFound('Không tìm thấy chợ');
    const [stats, zoneCount, pendingApps, openComplaints] = await Promise.all([
      marketStats([market.id]),
      prisma.zones.count({ where: { market_id: market.id } }),
      prisma.merchant_applications.count({ where: { market_id: market.id, status: { in: ['pending', 'reviewing'] } } }),
      prisma.complaints.count({ where: { market_id: market.id, status: { in: ['new', 'processing', 'escalated'] } } }),
    ]);
    const { market_managers, ...m } = market;
    ok(res, {
      ...m,
      ...stats.get(market.id),
      zone_count: zoneCount,
      pending_application_count: pendingApps,
      open_complaint_count: openComplaints,
      managers: market_managers.map((mm) => mm.users),
    });
  } catch (e) {
    next(e);
  }
});

// PUT /admin/markets/:id (SA)
marketsAdminRouter.put(
  '/:id',
  requireRoles('super_admin'),
  validate({ params: idParam, body: marketBody.omit({ managerIds: true, provinceId: true }).partial() }),
  async (req, res, next) => {
    try {
      const b = req.body;
      const googleMaps = b.googleMapsUrl ? await resolveGoogleMapsUrl(b.googleMapsUrl) : null;
      const market = await prisma.markets.update({
        where: { id: req.params.id },
        data: {
          code: b.code,
          name: b.name,
          address: b.address,
          ...(googleMaps ? {
            latitude: googleMaps.latitude,
            longitude: googleMaps.longitude,
            google_maps_url: googleMaps.url,
          } : b.googleMapsUrl === null ? { google_maps_url: null } : {}),
          phone: b.phone,
          email: b.email,
          description: b.description,
          images: b.images,
          open_hours: b.openHours,
          map_link: b.mapLink,
        },
      });
      ok(res, market);
    } catch (e) {
      next(e);
    }
  },
);

// PATCH /admin/markets/:id/status (SA)
marketsAdminRouter.patch(
  '/:id/status',
  requireRoles('super_admin'),
  validate({ params: idParam, body: z.object({ status: z.enum(['active', 'inactive']) }) }),
  async (req, res, next) => {
    try {
      ok(res, await prisma.markets.update({ where: { id: req.params.id }, data: { status: req.body.status } }));
    } catch (e) {
      next(e);
    }
  },
);

// DELETE /admin/markets/:id (SA) — chỉ khi chưa có dữ liệu con
marketsAdminRouter.delete(
  '/:id',
  requireRoles('super_admin'),
  validate({ params: idParam }),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const [zones, stalls, orders] = await Promise.all([
        prisma.zones.count({ where: { market_id: id } }),
        prisma.stalls.count({ where: { market_id: id } }),
        prisma.orders.count({ where: { market_id: id } }),
      ]);
      if (zones || stalls || orders)
        throw conflict('STATE_INVALID', 'Không thể xóa chợ đã có khu/sạp/đơn hàng — hãy chuyển trạng thái ngừng hoạt động');
      await prisma.$transaction([
        prisma.market_managers.deleteMany({ where: { market_id: id } }),
        prisma.markets.delete({ where: { id } }),
      ]);
      ok(res, { message: 'Đã xóa chợ' });
    } catch (e) {
      next(e);
    }
  },
);

// Managers
marketsAdminRouter.get(
  '/:id/managers',
  validate({ params: idParam }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      const rows = await prisma.market_managers.findMany({
        where: { market_id: req.params.id },
        include: { users: { select: { id: true, full_name: true, email: true, phone: true, status: true } } },
      });
      ok(res, rows.map((r) => r.users));
    } catch (e) {
      next(e);
    }
  },
);

marketsAdminRouter.post(
  '/:id/managers',
  requireRoles('super_admin'),
  validate({ params: idParam, body: z.object({ userId: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const user = await prisma.users.findUnique({ where: { id: req.body.userId } });
      if (!user || user.role !== 'market_manager')
        throw badRequest('Tài khoản được gán phải có vai trò quản lý chợ');
      await prisma.market_managers.upsert({
        where: { user_id_market_id: { user_id: req.body.userId, market_id: req.params.id } },
        create: { user_id: req.body.userId, market_id: req.params.id },
        update: {},
      });
      ok(res, { message: 'Đã gán quản lý cho chợ' }, 201);
    } catch (e) {
      next(e);
    }
  },
);

marketsAdminRouter.delete(
  '/:id/managers/:userId',
  requireRoles('super_admin'),
  validate({ params: z.object({ id: z.string().uuid(), userId: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      await prisma.market_managers.delete({
        where: { user_id_market_id: { user_id: req.params.userId, market_id: req.params.id } },
      });
      ok(res, { message: 'Đã bỏ gán quản lý' });
    } catch (e) {
      next(e);
    }
  },
);
