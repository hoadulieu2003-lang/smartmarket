import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles } from '../../middlewares/auth.middleware';
import { assertMarketInScope, marketIdsForScope } from '../../shared/scope';
import { notFound } from '../../shared/errors';
import { assignStallTx, unassignStall } from './contracts.service';

export const contractsAdminRouter = Router(); // mount tại /admin

const idParam = z.object({ id: z.string().uuid() });
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày YYYY-MM-DD');
const CAN_EDIT = ['super_admin', 'market_manager'] as const;

async function stallInScope(req: any, stallId: string) {
  const stall = await prisma.stalls.findUnique({ where: { id: stallId } });
  if (!stall) throw notFound('Không tìm thấy sạp');
  await assertMarketInScope(req.scope, stall.market_id);
  return stall;
}

// POST /admin/stalls/:id/assign
contractsAdminRouter.post(
  '/stalls/:id/assign',
  requireRoles(...CAN_EDIT),
  validate({
    params: idParam,
    body: z.object({
      merchantId: z.string().uuid(),
      startDate: dateStr,
      endDate: dateStr.nullish(),
      fee: z.number().min(0).max(10_000_000_000).optional(),
      categoryId: z.string().uuid().nullish(),
      note: z.string().max(2000).nullish(),
      /** Gia hạn: kết thúc hợp đồng cũ và tạo mới trong cùng transaction (R11). */
      renewFromContractId: z.string().uuid().nullish(),
    }),
  }),
  async (req, res, next) => {
    try {
      await stallInScope(req, req.params.id);
      const b = req.body;
      const contract = await prisma.$transaction(async (tx) => {
        if (b.renewFromContractId) {
          const old = await tx.contracts.findUnique({ where: { id: b.renewFromContractId } });
          if (old && old.stall_id === req.params.id && !old.ended_at) {
            await tx.contracts.update({
              where: { id: old.id },
              data: { ended_at: new Date(), end_reason: 'Gia hạn hợp đồng mới' },
            });
            await tx.stalls.update({ where: { id: req.params.id }, data: { status: 'vacant' } });
          }
        }
        return assignStallTx(tx, {
          stallId: req.params.id,
          merchantId: b.merchantId,
          startDate: b.startDate,
          endDate: b.endDate ?? null,
          fee: b.fee,
          categoryId: b.categoryId ?? null,
          note: b.note ?? null,
          createdBy: req.user!.id,
        });
      });
      ok(res, contract, 201);
    } catch (e) {
      next(e);
    }
  },
);

// POST /admin/stalls/:id/unassign
contractsAdminRouter.post(
  '/stalls/:id/unassign',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam, body: z.object({ reason: z.string().trim().min(1).max(2000) }) }),
  async (req, res, next) => {
    try {
      await stallInScope(req, req.params.id);
      const contract = await unassignStall(req.params.id, req.body.reason, req.user!.id);
      ok(res, contract);
    } catch (e) {
      next(e);
    }
  },
);

// GET /admin/stalls/:id/contracts — lịch sử
contractsAdminRouter.get(
  '/stalls/:id/contracts',
  validate({ params: idParam }),
  async (req, res, next) => {
    try {
      await stallInScope(req, req.params.id);
      const rows = await prisma.contracts.findMany({
        where: { stall_id: req.params.id },
        orderBy: { created_at: 'desc' },
        include: {
          users_contracts_merchant_idTousers: { select: { id: true, full_name: true, phone: true } },
          users_contracts_created_byTousers: { select: { id: true, full_name: true } },
        },
      });
      ok(
        res,
        rows.map(({ users_contracts_merchant_idTousers, users_contracts_created_byTousers, ...c }) => ({
          ...c,
          merchant: users_contracts_merchant_idTousers,
          created_by_user: users_contracts_created_byTousers,
        })),
      );
    } catch (e) {
      next(e);
    }
  },
);

// GET /admin/contracts
contractsAdminRouter.get(
  '/contracts',
  validate({
    query: pageQuery.extend({
      marketId: z.string().uuid().optional(),
      merchantId: z.string().uuid().optional(),
      activeOnly: z.coerce.boolean().optional(),
      expiringInDays: z.coerce.number().int().min(1).max(365).optional(),
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
      const where: Prisma.contractsWhereInput = {
        merchant_id: q.merchantId,
        ...(q.activeOnly || q.expiringInDays ? { ended_at: null } : {}),
        ...(q.expiringInDays
          ? {
              end_date: {
                gte: dayjs().startOf('day').toDate(),
                lte: dayjs().add(q.expiringInDays, 'day').endOf('day').toDate(),
              },
            }
          : {}),
        ...(marketIds ? { stalls: { market_id: { in: marketIds } } } : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.contracts.count({ where }),
        prisma.contracts.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            stalls: {
              select: {
                id: true,
                code: true,
                name: true,
                market_id: true,
                zones: { select: { id: true, code: true, name: true } },
                markets: { select: { id: true, name: true } },
              },
            },
            users_contracts_merchant_idTousers: { select: { id: true, full_name: true, phone: true } },
            users_contracts_created_byTousers: { select: { id: true, full_name: true } },
          },
        }),
      ]);
      const today = dayjs().startOf('day');
      paginated(
        res,
        rows.map(({ users_contracts_merchant_idTousers, users_contracts_created_byTousers, ...c }) => ({
          ...c,
          merchant: users_contracts_merchant_idTousers,
          created_by_user: users_contracts_created_byTousers,
          days_left: c.end_date && !c.ended_at ? dayjs(c.end_date).diff(today, 'day') : null,
        })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);
