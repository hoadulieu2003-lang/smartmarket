import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles } from '../../middlewares/auth.middleware';
import { marketFilter } from '../../shared/scope';
import { notFound } from '../../shared/errors';
import { withPricing } from '../../shared/pricing';
import { notifyUsers } from '../../shared/notification.helper';

export const productsAdminRouter = Router(); // mount tại /admin/products

// GET /admin/products
productsAdminRouter.get(
  '/',
  validate({
    query: pageQuery.extend({
      marketId: z.string().uuid().optional(),
      stallId: z.string().uuid().optional(),
      search: z.string().trim().optional(),
      includeHidden: z.coerce.boolean().default(true),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const scopeWhere = await marketFilter(req.scope!, q.marketId);
      const where: Prisma.productsWhereInput = {
        deleted_at: null,
        stall_id: q.stallId,
        stalls: scopeWhere,
        ...(q.includeHidden ? {} : { is_hidden: false }),
        ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.products.count({ where }),
        prisma.products.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            stalls: { select: { id: true, code: true, name: true, market_id: true, markets: { select: { id: true, name: true } } } },
            categories: { select: { id: true, name: true } },
          },
        }),
      ]);
      paginated(res, rows.map((p) => withPricing(p)), { page: q.page, limit: q.limit, total });
    } catch (e) {
      next(e);
    }
  },
);

// PATCH /admin/products/:id/visibility — ẩn sản phẩm vi phạm
productsAdminRouter.patch(
  '/:id/visibility',
  requireRoles('super_admin', 'market_manager'),
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ isHidden: z.boolean(), reason: z.string().trim().min(1).max(1000) }),
  }),
  async (req, res, next) => {
    try {
      const product = await prisma.products.findUnique({
        where: { id: req.params.id },
        include: { stalls: true },
      });
      if (!product || product.deleted_at) throw notFound('Không tìm thấy sản phẩm');
      const scopeWhere = await marketFilter(req.scope!, product.stalls.market_id);
      void scopeWhere; // marketFilter đã assert scope khi truyền marketId
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.products.update({
          where: { id: product.id },
          data: { is_hidden: req.body.isHidden },
        });
        const contract = await tx.contracts.findFirst({
          where: { stall_id: product.stall_id, ended_at: null },
        });
        if (contract) {
          await notifyUsers(tx, {
            userIds: [contract.merchant_id],
            marketId: product.stalls.market_id,
            title: req.body.isHidden ? 'Sản phẩm bị ẩn bởi ban quản lý' : 'Sản phẩm được hiển thị lại',
            content: `Sản phẩm "${product.name}": ${req.body.reason}`,
            type: 'general',
            refType: 'product',
            refId: product.id,
          });
        }
        return u;
      });
      ok(res, withPricing(updated));
    } catch (e) {
      next(e);
    }
  },
);
