import { Router } from 'express';
import { z } from 'zod';
import { prisma, Tx } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { auth } from '../../middlewares/auth.middleware';
import { conflict, forbidden, notFound } from '../../shared/errors';
import { getSetting, SETTING_KEYS } from '../../shared/settings';
import { notifyUsers } from '../../shared/notification.helper';
import { visibleProductWhere } from '../stalls/stalls.service';
import { AppError } from '../../shared/errors';

export const reviewsRouter = Router(); // mount tại / (routes: /reviews, /my/reviews)
// Lưu ý: router gắn ở '/', KHÔNG dùng use(auth) cấp router — auth gắn theo từng route


const idParam = z.object({ id: z.string().uuid() });
const imageArr = z.array(z.object({ url: z.string().url() })).default([]);

/** Cập nhật lại rating_avg + review_count của sản phẩm (trong cùng transaction). */
async function recomputeRating(tx: Tx, productId: string) {
  const agg = await tx.reviews.aggregate({
    where: { product_id: productId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await tx.products.update({
    where: { id: productId },
    data: {
      rating_avg: agg._avg.rating ? Math.round(agg._avg.rating * 100) / 100 : 0,
      review_count: agg._count._all,
    },
  });
}

// POST /reviews
reviewsRouter.post(
  '/reviews',
  auth,
  validate({
    body: z.object({
      productId: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      content: z.string().max(2000).nullish(),
      images: imageArr,
    }),
  }),
  async (req, res, next) => {
    try {
      const user = req.user!;
      const product = await prisma.products.findFirst({
        where: visibleProductWhere({ id: req.body.productId }),
        include: { stalls: { select: { id: true, market_id: true } } },
      });
      if (!product) throw notFound('Sản phẩm không tồn tại hoặc đã ngừng bán');

      const requirePurchase = await getSetting<boolean>(SETTING_KEYS.reviewRequirePurchase, true);
      if (requirePurchase) {
        const purchased = await prisma.order_items.findFirst({
          where: {
            product_id: product.id,
            orders: { customer_id: user.id, status: 'completed' },
          },
        });
        if (!purchased)
          throw new AppError(403, 'REVIEW_NOT_PURCHASED', 'Bạn cần mua sản phẩm này trước khi đánh giá');
      }

      const review = await prisma.$transaction(async (tx) => {
        let created;
        try {
          created = await tx.reviews.create({
            data: {
              product_id: product.id,
              user_id: user.id,
              rating: req.body.rating,
              content: req.body.content ?? null,
              images: req.body.images,
            },
          });
        } catch (e: any) {
          if (e?.code === 'P2002')
            throw conflict('DUPLICATE_CODE', 'Bạn đã đánh giá sản phẩm này — hãy sửa đánh giá cũ');
          throw e;
        }
        await recomputeRating(tx, product.id);
        const contract = await tx.contracts.findFirst({
          where: { stall_id: product.stall_id, ended_at: null },
        });
        if (contract)
          await notifyUsers(tx, {
            userIds: [contract.merchant_id],
            marketId: product.stalls.market_id,
            title: 'Sản phẩm có đánh giá mới',
            content: `"${product.name}" vừa nhận đánh giá ${req.body.rating} sao.`,
            type: 'general',
            refType: 'product',
            refId: product.id,
          });
        return created;
      });
      ok(res, review, 201);
    } catch (e) {
      next(e);
    }
  },
);

// PUT /reviews/:id
reviewsRouter.put(
  '/reviews/:id',
  auth,
  validate({
    params: idParam,
    body: z.object({
      rating: z.number().int().min(1).max(5).optional(),
      content: z.string().max(2000).nullish(),
      images: imageArr.optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const review = await prisma.reviews.findUnique({ where: { id: req.params.id } });
      if (!review) throw notFound('Không tìm thấy đánh giá');
      if (review.user_id !== req.user!.id)
        throw forbidden('PERM_DENIED', 'Bạn chỉ được sửa đánh giá của mình');
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.reviews.update({
          where: { id: review.id },
          data: { rating: req.body.rating, content: req.body.content, images: req.body.images },
        });
        await recomputeRating(tx, review.product_id);
        return u;
      });
      ok(res, updated);
    } catch (e) {
      next(e);
    }
  },
);

// DELETE /reviews/:id
reviewsRouter.delete('/reviews/:id', auth, validate({ params: idParam }), async (req, res, next) => {
  try {
    const review = await prisma.reviews.findUnique({ where: { id: req.params.id } });
    if (!review) throw notFound('Không tìm thấy đánh giá');
    if (review.user_id !== req.user!.id)
      throw forbidden('PERM_DENIED', 'Bạn chỉ được xóa đánh giá của mình');
    await prisma.$transaction(async (tx) => {
      await tx.reviews.delete({ where: { id: review.id } });
      await recomputeRating(tx, review.product_id);
    });
    ok(res, { message: 'Đã xóa đánh giá' });
  } catch (e) {
    next(e);
  }
});

// GET /my/reviews
reviewsRouter.get('/my/reviews', auth, validate({ query: pageQuery }), async (req, res, next) => {
  try {
    const q = req.query as any;
    const where = { user_id: req.user!.id };
    const [total, rows] = await Promise.all([
      prisma.reviews.count({ where }),
      prisma.reviews.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        include: { products: { select: { id: true, name: true, images: true, unit: true } } },
      }),
    ]);
    paginated(
      res,
      rows.map(({ products, ...r }) => ({ ...r, product: products })),
      { page: q.page, limit: q.limit, total },
    );
  } catch (e) {
    next(e);
  }
});
