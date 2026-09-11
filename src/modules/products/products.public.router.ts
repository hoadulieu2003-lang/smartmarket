import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { notFound } from '../../shared/errors';
import { withPricing, isOnSale } from '../../shared/pricing';
import { visibleProductWhere } from '../stalls/stalls.service';

export const productsPublicRouter = Router();

// GET /products?marketId=...
productsPublicRouter.get(
  '/',
  validate({
    query: pageQuery.extend({
      marketId: z.string().uuid(),
      categoryId: z.string().uuid().optional(),
      stallId: z.string().uuid().optional(),
      search: z.string().trim().optional(),
      onSale: z.coerce.boolean().optional(),
      inStock: z.coerce.boolean().optional(),
      sort: z.enum(['price', 'rating', 'newest']).default('newest'),
      order: z.enum(['asc', 'desc']).default('desc'),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const now = new Date();
      const where = visibleProductWhere({
        stalls: { market_id: q.marketId, status: 'occupied', markets: { status: 'active' } },
        // Lọc theo ngành hàng cấp 1 sẽ gồm cả sản phẩm thuộc các loại mặt hàng con; lọc theo loại mặt hàng thì khớp trực tiếp.
        ...(q.categoryId ? { categories: { OR: [{ id: q.categoryId }, { parent_id: q.categoryId }] } } : {}),
        stall_id: q.stallId,
        ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
        ...(q.inStock ? { quantity: { gt: 0 } } : {}),
        ...(q.onSale
          ? {
              discount_type: { not: null },
              AND: [
                { OR: [{ discount_start_at: null }, { discount_start_at: { lte: now } }] },
                { OR: [{ discount_end_at: null }, { discount_end_at: { gte: now } }] },
              ],
            }
          : {}),
      });
      const orderBy: Prisma.productsOrderByWithRelationInput =
        q.sort === 'price'
          ? { price: q.order }
          : q.sort === 'rating'
            ? { rating_avg: q.order }
            : { created_at: q.order };
      const [total, rows] = await Promise.all([
        prisma.products.count({ where }),
        prisma.products.findMany({
          where,
          orderBy,
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            stalls: { select: { id: true, code: true, name: true } },
            categories: { select: { id: true, name: true } },
            traceability: { select: { id: true } },
          },
        }),
      ]);
      paginated(
        res,
        rows.map(({ traceability, ...product }) => ({
          ...withPricing(product, now),
          has_traceability: !!traceability,
        })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);

const idParam = z.object({ id: z.string().uuid() });

// GET /products/:id
productsPublicRouter.get('/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    const now = new Date();
    const product = await prisma.products.findUnique({
      where: { id: req.params.id },
      include: {
        categories: { select: { id: true, name: true } },
        traceability: true,
        stalls: {
          include: {
            markets: { select: { id: true, name: true, status: true } },
            zones: { select: { id: true, code: true, name: true } },
            contracts: {
              where: { ended_at: null },
              take: 1,
              include: {
                users_contracts_merchant_idTousers: { select: { id: true, full_name: true, avatar: true } },
              },
            },
          },
        },
      },
    });
    if (
      !product ||
      product.deleted_at ||
      product.is_hidden ||
      product.stalls.status !== 'occupied' ||
      product.stalls.markets.status !== 'active'
    )
      throw notFound('Sản phẩm không tồn tại hoặc đã ngừng bán');

    const related = await prisma.products.findMany({
      where: visibleProductWhere({
        id: { not: product.id },
        category_id: product.category_id,
        stalls: { market_id: product.stalls.market_id, status: 'occupied' },
      }),
      orderBy: [{ review_count: 'desc' }],
      take: 6,
      include: {
        stalls: { select: { id: true, code: true, name: true } },
        traceability: { select: { id: true } },
      },
    });

    const { stalls, ...rest } = product;
    const { contracts, ...stallRest } = stalls;
    ok(res, {
      ...withPricing(rest as any, now),
      has_traceability: !!rest.traceability,
      stall: { ...stallRest, merchant: contracts[0]?.users_contracts_merchant_idTousers ?? null },
      related_products: related.map(({ traceability, ...relatedProduct }) => ({
        ...withPricing(relatedProduct, now),
        has_traceability: !!traceability,
      })),
    });
  } catch (e) {
    next(e);
  }
});

// GET /products/:id/reviews
productsPublicRouter.get(
  '/:id/reviews',
  validate({ params: idParam, query: pageQuery }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const product = await prisma.products.findUnique({ where: { id: req.params.id } });
      if (!product || product.deleted_at) throw notFound('Sản phẩm không tồn tại');
      const where = { product_id: req.params.id };
      const [total, rows] = await Promise.all([
        prisma.reviews.count({ where }),
        prisma.reviews.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: { users: { select: { id: true, full_name: true, avatar: true } } },
        }),
      ]);
      paginated(
        res,
        rows.map(({ users, ...r }) => ({ ...r, reviewer: users })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);
