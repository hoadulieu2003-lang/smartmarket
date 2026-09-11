import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok } from '../../shared/response';
import { validate } from '../../middlewares/validate.middleware';
import { assertMarketInScope, marketIdsForScope } from '../../shared/scope';
import { getSetting, SETTING_KEYS } from '../../shared/settings';

export const reportsAdminRouter = Router(); // mount tại /admin/reports

const rangeQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  marketId: z.string().uuid().optional(),
});

async function resolveIds(req: any, marketId?: string): Promise<string[] | null> {
  if (marketId) {
    await assertMarketInScope(req.scope, marketId);
    return [marketId];
  }
  return marketIdsForScope(req.scope);
}

// GET /admin/reports/revenue?groupBy=day|month
reportsAdminRouter.get(
  '/revenue',
  validate({ query: rangeQuery.extend({ groupBy: z.enum(['day', 'month']).default('day') }) }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const ids = await resolveIds(req, q.marketId);
      const from = q.from ?? dayjs().subtract(30, 'day').startOf('day').toDate();
      const to = q.to ?? new Date();
      const marketCond = ids ? Prisma.sql`AND market_id = ANY(${ids}::uuid[])` : Prisma.empty;
      const trunc = q.groupBy === 'month' ? Prisma.sql`'month'` : Prisma.sql`'day'`;
      const rows = await prisma.$queryRaw<{ period: Date; revenue: number; order_count: bigint }[]>`
        SELECT date_trunc(${trunc}, completed_at) AS period,
               COALESCE(SUM(total_amount),0)::float AS revenue,
               COUNT(*)::bigint AS order_count
        FROM orders
        WHERE status = 'completed' AND completed_at BETWEEN ${from} AND ${to} ${marketCond}
        GROUP BY 1 ORDER BY 1`;
      ok(res, rows.map((r) => ({
        period: dayjs(r.period).format(q.groupBy === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'),
        revenue: Number(r.revenue),
        order_count: Number(r.order_count),
      })));
    } catch (e) {
      next(e);
    }
  },
);

// GET /admin/reports/stalls — tỷ lệ lấp đầy + sắp hết hạn theo chợ
reportsAdminRouter.get('/stalls', validate({ query: rangeQuery }), async (req, res, next) => {
  try {
    const q = req.query as any;
    const ids = await resolveIds(req, q.marketId);
    const threshold = await getSetting<number>(SETTING_KEYS.expiryWarningDays, 30);
    const marketWhere: Prisma.marketsWhereInput = ids ? { id: { in: ids } } : {};
    const markets = await prisma.markets.findMany({
      where: marketWhere,
      select: { id: true, name: true, code: true },
    });
    const mIds = markets.map((m) => m.id);
    if (mIds.length === 0) return ok(res, []);
    const [groups, expiring] = await Promise.all([
      prisma.stalls.groupBy({
        by: ['market_id', 'status'],
        where: { market_id: { in: mIds } },
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ market_id: string; count: bigint }[]>`
        SELECT s.market_id, COUNT(*)::bigint AS count
        FROM contracts c JOIN stalls s ON s.id = c.stall_id
        WHERE c.ended_at IS NULL AND c.end_date IS NOT NULL
          AND c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ${threshold}::int
          AND s.market_id = ANY(${mIds}::uuid[])
        GROUP BY s.market_id`,
    ]);
    const expMap = new Map(expiring.map((e) => [e.market_id, Number(e.count)]));
    const result = markets.map((m) => {
      const stat = { total: 0, occupied: 0, vacant: 0, maintenance: 0, reserved: 0 };
      for (const g of groups.filter((g) => g.market_id === m.id)) {
        stat.total += g._count._all;
        (stat as any)[g.status] = g._count._all;
      }
      return {
        market: m,
        ...stat,
        occupancy_rate: stat.total ? Math.round((stat.occupied / stat.total) * 1000) / 10 : 0,
        expiring_contract_count: expMap.get(m.id) ?? 0,
      };
    });
    ok(res, result);
  } catch (e) {
    next(e);
  }
});

// GET /admin/reports/traders — top doanh thu + bị phản ánh nhiều
reportsAdminRouter.get('/traders', validate({ query: rangeQuery }), async (req, res, next) => {
  try {
    const q = req.query as any;
    const ids = await resolveIds(req, q.marketId);
    const from = q.from ?? dayjs().subtract(30, 'day').startOf('day').toDate();
    const to = q.to ?? new Date();
    const marketCondOrders = ids ? Prisma.sql`AND o.market_id = ANY(${ids}::uuid[])` : Prisma.empty;
    const marketCondComplaints = ids ? Prisma.sql`AND cp.market_id = ANY(${ids}::uuid[])` : Prisma.empty;

    const [topRevenue, topComplained] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT u.id, u.full_name, s.code AS stall_code, s.name AS stall_name,
               COALESCE(SUM(o.total_amount),0)::float AS revenue, COUNT(o.id)::bigint AS order_count
        FROM orders o
        JOIN stalls s ON s.id = o.stall_id
        JOIN contracts c ON c.stall_id = s.id AND c.ended_at IS NULL
        JOIN users u ON u.id = c.merchant_id
        WHERE o.status = 'completed' AND o.completed_at BETWEEN ${from} AND ${to} ${marketCondOrders}
        GROUP BY u.id, u.full_name, s.code, s.name
        ORDER BY revenue DESC LIMIT 10`,
      prisma.$queryRaw<any[]>`
        SELECT u.id, u.full_name, s.code AS stall_code, COUNT(cp.id)::bigint AS complaint_count
        FROM complaints cp
        JOIN stalls s ON s.id = cp.stall_id
        JOIN contracts c ON c.stall_id = s.id AND c.ended_at IS NULL
        JOIN users u ON u.id = c.merchant_id
        WHERE cp.created_at BETWEEN ${from} AND ${to} ${marketCondComplaints}
        GROUP BY u.id, u.full_name, s.code
        ORDER BY complaint_count DESC LIMIT 10`,
    ]);
    ok(res, {
      top_revenue: topRevenue.map((r) => ({ ...r, revenue: Number(r.revenue), order_count: Number(r.order_count) })),
      top_complained: topComplained.map((r) => ({ ...r, complaint_count: Number(r.complaint_count) })),
    });
  } catch (e) {
    next(e);
  }
});

// GET /admin/reports/complaints — theo loại & trạng thái
reportsAdminRouter.get('/complaints', validate({ query: rangeQuery }), async (req, res, next) => {
  try {
    const q = req.query as any;
    const ids = await resolveIds(req, q.marketId);
    const from = q.from ?? dayjs().subtract(30, 'day').startOf('day').toDate();
    const to = q.to ?? new Date();
    const where: Prisma.complaintsWhereInput = {
      created_at: { gte: from, lte: to },
      ...(ids ? { market_id: { in: ids } } : {}),
    };
    const [byType, byStatus] = await Promise.all([
      prisma.complaints.groupBy({ by: ['type'], where, _count: { _all: true } }),
      prisma.complaints.groupBy({ by: ['status'], where, _count: { _all: true } }),
    ]);
    ok(res, {
      by_type: byType.map((r) => ({ type: r.type, count: r._count._all })),
      by_status: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    });
  } catch (e) {
    next(e);
  }
});

// GET /admin/reports/approvals — hồ sơ theo trạng thái
reportsAdminRouter.get('/approvals', validate({ query: rangeQuery }), async (req, res, next) => {
  try {
    const q = req.query as any;
    const ids = await resolveIds(req, q.marketId);
    const from = q.from ?? dayjs().subtract(90, 'day').startOf('day').toDate();
    const to = q.to ?? new Date();
    const rows = await prisma.merchant_applications.groupBy({
      by: ['status'],
      where: { created_at: { gte: from, lte: to }, ...(ids ? { market_id: { in: ids } } : {}) },
      _count: { _all: true },
    });
    ok(res, rows.map((r) => ({ status: r.status, count: r._count._all })));
  } catch (e) {
    next(e);
  }
});
