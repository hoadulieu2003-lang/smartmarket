import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles } from '../../middlewares/auth.middleware';
import { assertMarketInScope, marketFilter } from '../../shared/scope';
import { notFound } from '../../shared/errors';
import { cancelOrder, merchantOfStall } from './orders.service';

export const ordersAdminRouter = Router(); // mount tại /admin/orders

const idParam = z.object({ id: z.string().uuid() });

ordersAdminRouter.get(
  '/',
  validate({
    query: pageQuery.extend({
      marketId: z.string().uuid().optional(),
      stallId: z.string().uuid().optional(),
      status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']).optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const scopeWhere = await marketFilter(req.scope!, q.marketId);
      const where: Prisma.ordersWhereInput = {
        ...scopeWhere,
        stall_id: q.stallId,
        status: q.status,
        ...(q.from || q.to ? { created_at: { gte: q.from, lte: q.to } } : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.orders.count({ where }),
        prisma.orders.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            stalls: { select: { id: true, code: true, name: true } },
            markets: { select: { id: true, name: true } },
            users: { select: { id: true, full_name: true } },
          },
        }),
      ]);
      paginated(
        res,
        rows.map(({ users, ...o }) => ({ ...o, customer: users })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);

ordersAdminRouter.get('/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: req.params.id },
      include: {
        order_items: true,
        stalls: { select: { id: true, code: true, name: true, phone: true } },
        markets: { select: { id: true, name: true } },
        users: { select: { id: true, full_name: true, phone: true } },
      },
    });
    if (!order) throw notFound('Không tìm thấy đơn hàng');
    await assertMarketInScope(req.scope!, order.market_id);
    const { users, ...rest } = order;
    ok(res, { ...rest, customer: users });
  } catch (e) {
    next(e);
  }
});

ordersAdminRouter.post(
  '/:id/cancel',
  requireRoles('super_admin', 'market_manager'),
  validate({ params: idParam, body: z.object({ reason: z.string().trim().min(1).max(1000) }) }),
  async (req, res, next) => {
    try {
      const order = await prisma.orders.findUnique({ where: { id: req.params.id } });
      if (!order) throw notFound('Không tìm thấy đơn hàng');
      await assertMarketInScope(req.scope!, order.market_id);
      const merchantId = await merchantOfStall(order.stall_id);
      const cancelled = await cancelOrder({
        order,
        by: 'admin',
        reason: req.body.reason,
        notifyUserIds: [...(order.customer_id ? [order.customer_id] : []), ...(merchantId ? [merchantId] : [])],
      });
      ok(res, cancelled);
    } catch (e) {
      next(e);
    }
  },
);
