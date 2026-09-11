import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/prisma';
import { ok } from '../../shared/response';
import { validate } from '../../middlewares/validate.middleware';
import { notFound } from '../../shared/errors';
import { stallAggregates } from '../markets/markets.service';

export const stallsPublicRouter = Router();

/** Chi tiết sạp/tiểu thương cho app (chỉ sạp đang kinh doanh trong chợ active). */
stallsPublicRouter.get(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const stall = await prisma.stalls.findUnique({
        where: { id: req.params.id },
        include: {
          zones: { select: { id: true, code: true, name: true } },
          markets: { select: { id: true, name: true, status: true, address: true } },
          categories: { select: { id: true, name: true } },
          contracts: {
            where: { ended_at: null },
            take: 1,
            include: {
              users_contracts_merchant_idTousers: {
                select: { id: true, full_name: true, avatar: true, merchant_joined_at: true },
              },
            },
          },
        },
      });
      if (!stall || stall.status !== 'occupied' || stall.markets.status !== 'active')
        throw notFound('Sạp không tồn tại hoặc đã ngừng kinh doanh');
      const aggs = await stallAggregates([stall.id]);
      const { contracts, ...rest } = stall;
      ok(res, {
        ...rest,
        merchant: contracts[0]?.users_contracts_merchant_idTousers ?? null,
        ...aggs.get(stall.id),
      });
    } catch (e) {
      next(e);
    }
  },
);
