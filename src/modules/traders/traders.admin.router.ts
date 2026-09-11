import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles, invalidateUserCache } from '../../middlewares/auth.middleware';
import { assertMarketInScope, marketIdsForScope } from '../../shared/scope';
import { notFound } from '../../shared/errors';
import { notifyUsers } from '../../shared/notification.helper';
import { stallAggregates } from '../markets/markets.service';

export const tradersAdminRouter = Router(); // mount tại /admin/traders

const idParam = z.object({ id: z.string().uuid() });

async function traderInScope(req: any, id: string) {
  const trader = await prisma.users.findUnique({ where: { id } });
  if (!trader || trader.role !== 'user' || !trader.merchant_status)
    throw notFound('Không tìm thấy tiểu thương');
  if (trader.merchant_market_id) await assertMarketInScope(req.scope, trader.merchant_market_id);
  else if (!('all' in req.scope)) throw notFound('Không tìm thấy tiểu thương');
  return trader;
}

// GET /admin/traders
tradersAdminRouter.get(
  '/',
  validate({
    query: pageQuery.extend({
      marketId: z.string().uuid().optional(),
      status: z.enum(['active', 'suspended', 'inactive']).optional(),
      categoryId: z.string().uuid().optional(),
      search: z.string().trim().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      let marketIds = await marketIdsForScope(req.scope!);
      if (q.marketId) {
        await assertMarketInScope(req.scope!, q.marketId);
        marketIds = [q.marketId];
      }
      const where: Prisma.usersWhereInput = {
        role: 'user',
        merchant_status: q.status ?? { not: null },
        merchant_category_id: q.categoryId,
        ...(marketIds ? { merchant_market_id: { in: marketIds } } : { merchant_market_id: { not: null } }),
        ...(q.search
          ? {
              OR: [
                { full_name: { contains: q.search, mode: 'insensitive' } },
                { phone: { contains: q.search } },
                { email: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.users.count({ where }),
        prisma.users.findMany({
          where,
          orderBy: { merchant_joined_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          select: {
            id: true,
            full_name: true,
            avatar: true,
            phone: true,
            email: true,
            merchant_status: true,
            merchant_joined_at: true,
            merchant_market_id: true,
            merchant_mode: true,
            markets_users_merchant_market_idTomarkets: { select: { id: true, name: true } },
            categories: { select: { id: true, name: true } },
          },
        }),
      ]);
      // Sạp hiện tại + thống kê
      const traderIds = rows.map((r) => r.id);
      const contracts = traderIds.length
        ? await prisma.contracts.findMany({
            where: { merchant_id: { in: traderIds }, ended_at: null },
            include: { stalls: { select: { id: true, code: true, name: true } } },
          })
        : [];
      const contractByTrader = new Map(contracts.map((c) => [c.merchant_id, c]));
      const stallIds = contracts.map((c) => c.stall_id);
      const aggs = await stallAggregates(stallIds);
      const openComplaints = stallIds.length
        ? await prisma.complaints.groupBy({
            by: ['stall_id'],
            where: { stall_id: { in: stallIds }, status: { in: ['new', 'processing', 'escalated'] } },
            _count: { _all: true },
          })
        : [];
      const complaintsByStall = new Map(openComplaints.map((c) => [c.stall_id as string, c._count._all]));

      paginated(
        res,
        rows.map(({ markets_users_merchant_market_idTomarkets, categories, ...u }) => {
          const contract = contractByTrader.get(u.id) ?? null;
          const agg = contract ? aggs.get(contract.stall_id) : null;
          return {
            ...u,
            market: markets_users_merchant_market_idTomarkets,
            category: categories,
            stall: contract ? contract.stalls : null,
            contract_end_date: contract?.end_date ?? null,
            rating_avg: agg?.rating_avg ?? 0,
            open_complaint_count: contract ? complaintsByStall.get(contract.stall_id) ?? 0 : 0,
          };
        }),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);

// GET /admin/traders/:id
tradersAdminRouter.get('/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    const trader = await traderInScope(req, req.params.id);
    const [contract, application, products, orders] = await Promise.all([
      prisma.contracts.findFirst({
        where: { merchant_id: trader.id, ended_at: null },
        include: {
          stalls: {
            include: {
              zones: { select: { id: true, code: true, name: true } },
              markets: { select: { id: true, name: true } },
            },
          },
          users_contracts_created_byTousers: { select: { id: true, full_name: true } },
        },
      }),
      prisma.merchant_applications.findFirst({
        where: { user_id: trader.id },
        orderBy: { created_at: 'desc' },
      }),
      prisma.products.findMany({
        where: { stalls: { contracts: { some: { merchant_id: trader.id, ended_at: null } } }, deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      prisma.orders.findMany({
        where: { stalls: { contracts: { some: { merchant_id: trader.id, ended_at: null } } } },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: { id: true, code: true, status: true, total_amount: true, created_at: true },
      }),
    ]);
    const complaints = contract
      ? await prisma.complaints.findMany({
          where: { stall_id: contract.stall_id },
          orderBy: { created_at: 'desc' },
          take: 10,
        })
      : [];
    const currentContract = contract
      ? (() => {
          const { users_contracts_created_byTousers, ...rest } = contract;
          return {
            ...rest,
            created_by_user: users_contracts_created_byTousers,
            days_left: contract.end_date ? dayjs(contract.end_date).diff(dayjs().startOf('day'), 'day') : null,
          };
        })()
      : null;
    const { password_hash, zalo_id, ...safe } = trader as any;
    ok(res, {
      ...safe,
      current_contract: currentContract,
      latest_application: application,
      recent_products: products,
      recent_orders: orders,
      recent_complaints: complaints,
    });
  } catch (e) {
    next(e);
  }
});

// PATCH /admin/traders/:id/status
tradersAdminRouter.patch(
  '/:id/status',
  requireRoles('super_admin', 'market_manager'),
  validate({
    params: idParam,
    body: z.object({
      status: z.enum(['active', 'suspended', 'inactive']),
      reason: z.string().max(1000).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const trader = await traderInScope(req, req.params.id);
      const { status, reason } = req.body;
      await prisma.$transaction(async (tx) => {
        await tx.users.update({ where: { id: trader.id }, data: { merchant_status: status } });
        if (status !== 'active') {
          // Ẩn sản phẩm của sạp đang thuê khi tạm khóa/ngừng
          const contract = await tx.contracts.findFirst({
            where: { merchant_id: trader.id, ended_at: null },
          });
          if (contract)
            await tx.products.updateMany({
              where: { stall_id: contract.stall_id, deleted_at: null },
              data: { is_hidden: true },
            });
        }
        const label =
          status === 'active' ? 'kích hoạt lại' : status === 'suspended' ? 'tạm khóa' : 'ngừng hoạt động';
        await notifyUsers(tx, {
          userIds: [trader.id],
          marketId: trader.merchant_market_id,
          title: `Tài khoản tiểu thương bị ${label}`,
          content: `Trạng thái tiểu thương của bạn đã được chuyển sang "${label}".${reason ? ` Lý do: ${reason}` : ''}`,
          type: 'general',
          refType: 'user',
          refId: trader.id,
        });
      });
      invalidateUserCache(trader.id);
      ok(res, { id: trader.id, merchant_status: status });
    } catch (e) {
      next(e);
    }
  },
);
