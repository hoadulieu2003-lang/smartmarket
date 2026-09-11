import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles } from '../../middlewares/auth.middleware';
import { assertMarketInScope, marketFilter } from '../../shared/scope';
import { badRequest, conflict, notFound } from '../../shared/errors';
import { buildBulkCodes, enrichStalls } from './stalls.service';

export const zonesAdminRouter = Router(); // mount tại /admin (đường dẫn zone lồng theo market)
export const stallsAdminRouter = Router(); // mount tại /admin/stalls

const idParam = z.object({ id: z.string().uuid() });
const imageArr = z.array(z.object({ url: z.string().url() }));
const CAN_EDIT = ['super_admin', 'market_manager'] as const;

/** Ngành hàng gán cho khu/sạp phải là category CẤP 1 (parent_id = null), không phải loại mặt hàng con. */
async function assertTopLevelCategory(categoryId: string | null | undefined) {
  if (!categoryId) return;
  const cat = await prisma.categories.findUnique({
    where: { id: categoryId },
    select: { parent_id: true },
  });
  if (!cat) throw badRequest('Ngành hàng không tồn tại');
  if (cat.parent_id) throw badRequest('Phải chọn ngành hàng chính (cấp 1), không phải loại mặt hàng');
}

async function zoneInScope(req: any, zoneId: string) {
  const zone = await prisma.zones.findUnique({ where: { id: zoneId } });
  if (!zone) throw notFound('Không tìm thấy khu');
  await assertMarketInScope(req.scope, zone.market_id);
  return zone;
}

async function stallInScope(req: any, stallId: string) {
  const stall = await prisma.stalls.findUnique({ where: { id: stallId } });
  if (!stall) throw notFound('Không tìm thấy sạp');
  await assertMarketInScope(req.scope, stall.market_id);
  return stall;
}

// ===== ZONES =====

zonesAdminRouter.get(
  '/markets/:id/zones',
  validate({ params: idParam }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      const zones = await prisma.zones.findMany({
        where: { market_id: req.params.id },
        orderBy: { display_order: 'asc' },
        include: { categories: { select: { id: true, name: true } } },
      });
      const counts = await prisma.stalls.groupBy({
        by: ['zone_id', 'status'],
        where: { market_id: req.params.id },
        _count: { _all: true },
      });
      const byZone = new Map<string, any>();
      for (const z of zones)
        byZone.set(z.id, { stall_count: 0, occupied_count: 0, vacant_count: 0 });
      for (const c of counts) {
        const s = byZone.get(c.zone_id);
        if (!s) continue;
        s.stall_count += c._count._all;
        if (c.status === 'occupied') s.occupied_count = c._count._all;
        if (c.status === 'vacant') s.vacant_count = c._count._all;
      }
      ok(res, zones.map((z) => ({ ...z, ...byZone.get(z.id) })));
    } catch (e) {
      next(e);
    }
  },
);

const zoneBody = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(255),
  categoryId: z.string().uuid().nullish(),
  description: z.string().max(2000).nullish(),
  displayOrder: z.number().int().min(0).optional(),
  gridColumns: z.number().int().min(1).max(24).nullish(),
  isActive: z.boolean().optional(),
});

zonesAdminRouter.post(
  '/markets/:id/zones',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam, body: zoneBody }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      const b = req.body;
      await assertTopLevelCategory(b.categoryId);
      const maxOrder = await prisma.zones.aggregate({
        where: { market_id: req.params.id },
        _max: { display_order: true },
      });
      try {
        const zone = await prisma.zones.create({
          data: {
            market_id: req.params.id,
            code: b.code,
            name: b.name,
            category_id: b.categoryId ?? null,
            description: b.description ?? null,
            display_order: b.displayOrder ?? (maxOrder._max.display_order ?? 0) + 1,
            grid_columns: b.gridColumns ?? null,
            is_active: b.isActive ?? true,
          },
        });
        ok(res, zone, 201);
      } catch (e: any) {
        if (e?.code === 'P2002')
          throw conflict('DUPLICATE_CODE', `Mã khu "${b.code}" đã tồn tại trong chợ này`);
        throw e;
      }
    } catch (e) {
      next(e);
    }
  },
);

zonesAdminRouter.put(
  '/zones/:id',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam, body: zoneBody.partial() }),
  async (req, res, next) => {
    try {
      await zoneInScope(req, req.params.id);
      const b = req.body;
      await assertTopLevelCategory(b.categoryId);
      try {
        const zone = await prisma.zones.update({
          where: { id: req.params.id },
          data: {
            code: b.code,
            name: b.name,
            category_id: b.categoryId,
            description: b.description,
            display_order: b.displayOrder,
            grid_columns: b.gridColumns,
            is_active: b.isActive,
          },
        });
        ok(res, zone);
      } catch (e: any) {
        if (e?.code === 'P2002')
          throw conflict('DUPLICATE_CODE', `Mã khu "${b.code}" đã tồn tại trong chợ này`);
        throw e;
      }
    } catch (e) {
      next(e);
    }
  },
);

// R8: không xóa khu còn sạp
zonesAdminRouter.delete(
  '/zones/:id',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam }),
  async (req, res, next) => {
    try {
      await zoneInScope(req, req.params.id);
      const stallCount = await prisma.stalls.count({ where: { zone_id: req.params.id } });
      if (stallCount > 0)
        throw conflict('STATE_INVALID', 'Không thể xóa khu vì trong khu vẫn còn sạp');
      await prisma.zones.delete({ where: { id: req.params.id } });
      ok(res, { message: 'Đã xóa khu' });
    } catch (e) {
      next(e);
    }
  },
);

// Tạo 1 sạp trong khu
const stallBody = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().max(255).nullish(),
  description: z.string().max(2000).nullish(),
  images: imageArr.optional(),
  acreage: z.number().positive().max(999999).nullish(),
  phone: z.string().max(20).nullish(),
  openHours: z.string().max(100).nullish(),
  categoryId: z.string().uuid().nullish(),
  status: z.enum(['vacant', 'maintenance', 'reserved']).default('vacant'),
});

zonesAdminRouter.post(
  '/zones/:id/stalls',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam, body: stallBody }),
  async (req, res, next) => {
    try {
      const zone = await zoneInScope(req, req.params.id);
      const b = req.body;
      await assertTopLevelCategory(b.categoryId);
      const maxOrder = await prisma.stalls.aggregate({
        where: { zone_id: zone.id },
        _max: { display_order: true },
      });
      try {
        const stall = await prisma.stalls.create({
          data: {
            market_id: zone.market_id,
            zone_id: zone.id,
            code: b.code,
            name: b.name ?? null,
            description: b.description ?? null,
            images: b.images ?? [],
            acreage: b.acreage ?? null,
            phone: b.phone ?? null,
            open_hours: b.openHours ?? null,
            category_id: b.categoryId ?? zone.category_id,
            status: b.status,
            display_order: (maxOrder._max.display_order ?? 0) + 1,
          },
        });
        ok(res, stall, 201);
      } catch (e: any) {
        if (e?.code === 'P2002')
          throw conflict('DUPLICATE_CODE', `Mã sạp "${b.code}" đã tồn tại trong chợ này`);
        throw e;
      }
    } catch (e) {
      next(e);
    }
  },
);

// Tạo sạp hàng loạt
zonesAdminRouter.post(
  '/zones/:id/stalls/bulk',
  requireRoles(...CAN_EDIT),
  validate({
    params: idParam,
    body: z.object({
      prefix: z.string().trim().min(1).max(10),
      startNumber: z.number().int().min(0),
      count: z.number().int().min(1).max(200),
      digits: z.number().int().min(1).max(4).default(2),
      separator: z.string().max(3).default('-'),
      defaults: z
        .object({
          acreage: z.number().positive().nullish(),
          categoryId: z.string().uuid().nullish(),
          status: z.enum(['vacant', 'maintenance', 'reserved']).default('vacant'),
        })
        .default({}),
    }),
  }),
  async (req, res, next) => {
    try {
      const zone = await zoneInScope(req, req.params.id);
      const b = req.body;
      await assertTopLevelCategory(b.defaults.categoryId);
      const codes = buildBulkCodes(b);
      if (codes.some((c) => c.length > 20))
        throw badRequest('Mã sạp sinh ra vượt quá 20 ký tự, hãy rút gọn tiền tố');
      const existing = await prisma.stalls.findMany({
        where: { market_id: zone.market_id, code: { in: codes } },
        select: { code: true },
      });
      if (existing.length > 0)
        throw conflict('DUPLICATE_CODE', 'Một số mã sạp đã tồn tại trong chợ này', {
          existingCodes: existing.map((e) => e.code),
        });
      const maxOrder = await prisma.stalls.aggregate({
        where: { zone_id: zone.id },
        _max: { display_order: true },
      });
      const base = (maxOrder._max.display_order ?? 0) + 1;
      const created = await prisma.$transaction(async (tx) => {
        await tx.stalls.createMany({
          data: codes.map((code, i) => ({
            market_id: zone.market_id,
            zone_id: zone.id,
            code,
            category_id: b.defaults.categoryId ?? zone.category_id,
            acreage: b.defaults.acreage ?? null,
            status: b.defaults.status,
            display_order: base + i,
            images: [],
          })),
        });
        return tx.stalls.findMany({
          where: { market_id: zone.market_id, code: { in: codes } },
          orderBy: { display_order: 'asc' },
        });
      });
      ok(res, { count: created.length, stalls: created }, 201);
    } catch (e) {
      next(e);
    }
  },
);

// Sắp xếp thứ tự sạp trong khu
zonesAdminRouter.put(
  '/zones/:id/stalls/reorder',
  requireRoles(...CAN_EDIT),
  validate({
    params: idParam,
    body: z.object({ orderedStallIds: z.array(z.string().uuid()).min(1).max(500) }),
  }),
  async (req, res, next) => {
    try {
      const zone = await zoneInScope(req, req.params.id);
      const ids: string[] = req.body.orderedStallIds;
      const stalls = await prisma.stalls.findMany({ where: { id: { in: ids }, zone_id: zone.id } });
      if (stalls.length !== ids.length)
        throw badRequest('Danh sách sạp không hợp lệ (có sạp không thuộc khu này)');
      await prisma.$transaction(
        ids.map((id, idx) =>
          prisma.stalls.update({ where: { id }, data: { display_order: idx + 1 } }),
        ),
      );
      ok(res, { message: 'Đã cập nhật thứ tự hiển thị' });
    } catch (e) {
      next(e);
    }
  },
);

// ===== STALLS =====

stallsAdminRouter.get(
  '/',
  validate({
    query: pageQuery.extend({
      marketId: z.string().uuid().optional(),
      zoneId: z.string().uuid().optional(),
      status: z.enum(['vacant', 'occupied', 'maintenance', 'reserved']).optional(),
      displayStatus: z
        .enum(['vacant', 'occupied', 'maintenance', 'reserved', 'expiring_soon', 'has_complaint'])
        .optional(),
      search: z.string().trim().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const scopeWhere = await marketFilter(req.scope!, q.marketId);
      const where: Prisma.stallsWhereInput = {
        ...scopeWhere,
        zone_id: q.zoneId,
        status: q.status,
        ...(q.search
          ? { OR: [{ code: { contains: q.search, mode: 'insensitive' } }, { name: { contains: q.search, mode: 'insensitive' } }] }
          : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.stalls.count({ where }),
        prisma.stalls.findMany({
          where,
          orderBy: [{ market_id: 'asc' }, { display_order: 'asc' }],
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            zones: { select: { id: true, code: true, name: true } },
            markets: { select: { id: true, name: true } },
            categories: { select: { id: true, name: true } },
          },
        }),
      ]);
      let enriched = await enrichStalls(rows);
      if (q.displayStatus) enriched = enriched.filter((s) => s.display_status === q.displayStatus);
      paginated(res, enriched, { page: q.page, limit: q.limit, total });
    } catch (e) {
      next(e);
    }
  },
);

// Drawer chi tiết sạp
stallsAdminRouter.get('/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    const stall = await prisma.stalls.findUnique({
      where: { id: req.params.id },
      include: {
        zones: { select: { id: true, code: true, name: true } },
        markets: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } },
      },
    });
    if (!stall) throw notFound('Không tìm thấy sạp');
    await assertMarketInScope(req.scope!, stall.market_id);
    const [enriched] = await enrichStalls([stall]);
    const since = dayjs().subtract(30, 'day').toDate();
    const [history, openComplaints, revenue, productCount] = await Promise.all([
      prisma.contracts.findMany({
        where: { stall_id: stall.id },
        orderBy: { created_at: 'desc' },
        include: { users_contracts_merchant_idTousers: { select: { id: true, full_name: true, phone: true } } },
      }),
      prisma.complaints.findMany({
        where: { stall_id: stall.id, status: { in: ['new', 'processing', 'escalated'] } },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      prisma.orders.aggregate({
        where: { stall_id: stall.id, status: 'completed', completed_at: { gte: since } },
        _sum: { total_amount: true },
      }),
      prisma.products.count({ where: { stall_id: stall.id, deleted_at: null } }),
    ]);
    ok(res, {
      ...enriched,
      contract_history: history.map(({ users_contracts_merchant_idTousers, ...c }) => ({
        ...c,
        merchant: users_contracts_merchant_idTousers,
      })),
      open_complaints: openComplaints,
      revenue_30d: revenue._sum.total_amount ?? 0,
      product_count: productCount,
    });
  } catch (e) {
    next(e);
  }
});

stallsAdminRouter.put(
  '/:id',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam, body: stallBody.omit({ status: true, code: true }).partial() }),
  async (req, res, next) => {
    try {
      await stallInScope(req, req.params.id);
      const b = req.body;
      await assertTopLevelCategory(b.categoryId);
      const stall = await prisma.stalls.update({
        where: { id: req.params.id },
        data: {
          name: b.name,
          description: b.description,
          images: b.images,
          acreage: b.acreage,
          phone: b.phone,
          open_hours: b.openHours,
          category_id: b.categoryId,
        },
      });
      ok(res, stall);
    } catch (e) {
      next(e);
    }
  },
);

// Đổi trạng thái thủ công (không set occupied tay — do hợp đồng quyết định)
stallsAdminRouter.patch(
  '/:id/status',
  requireRoles(...CAN_EDIT),
  validate({
    params: idParam,
    body: z.object({ status: z.enum(['vacant', 'maintenance', 'reserved']) }),
  }),
  async (req, res, next) => {
    try {
      const stall = await stallInScope(req, req.params.id);
      if (stall.status === 'occupied')
        throw conflict('STATE_INVALID', 'Sạp đang có tiểu thương thuê — hãy kết thúc thuê trước');
      ok(res, await prisma.stalls.update({ where: { id: stall.id }, data: { status: req.body.status } }));
    } catch (e) {
      next(e);
    }
  },
);

// R7: chỉ xóa sạp chưa từng có dữ liệu
stallsAdminRouter.delete(
  '/:id',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam }),
  async (req, res, next) => {
    try {
      const stall = await stallInScope(req, req.params.id);
      const [contracts, orders, products] = await Promise.all([
        prisma.contracts.count({ where: { stall_id: stall.id } }),
        prisma.orders.count({ where: { stall_id: stall.id } }),
        prisma.products.count({ where: { stall_id: stall.id } }),
      ]);
      if (contracts || orders || products)
        throw conflict('STATE_INVALID', 'Không thể xóa sạp đã có hợp đồng/đơn hàng/sản phẩm');
      await prisma.stalls.delete({ where: { id: stall.id } });
      ok(res, { message: 'Đã xóa sạp' });
    } catch (e) {
      next(e);
    }
  },
);
