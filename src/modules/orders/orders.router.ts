import { Router } from 'express';
import { z } from 'zod';
import { createHash } from 'crypto';
import { prisma } from '../../shared/prisma';
import { ok, paginated, sanitize } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { auth, requireActiveSeller } from '../../middlewares/auth.middleware';
import { badRequest, conflict, notFound } from '../../shared/errors';
import { ensureOperationsSchema } from '../operations/operations.schema';
import * as svc from './orders.service';
import { findOrderPayment, settleSellerOrderPayment, simulateOrderPayment } from '../payments/mock-payment.service';

export const ordersRouter = Router(); // buyer — mount tại /orders
export const sellerOrdersRouter = Router(); // seller — mount tại /seller/orders

const idParam = z.object({ id: z.string().uuid() });
const statusEnum = z.enum(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']);
const phoneRegex = /^0\d{9}$/;

// ===== BUYER =====
ordersRouter.use(auth);

ordersRouter.post(
  '/',
  validate({
    body: z.object({
      marketId: z.string().uuid(),
      receiveType: z.enum(['pickup', 'delivery']).default('pickup'),
      receiverName: z.string().trim().min(1).max(255),
      receiverPhone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ'),
      note: z.string().max(1000).nullish(),
      tableToken: z.string().trim().max(120).nullish(),
      items: z
        .array(
          z.object({
            productId: z.string().uuid(),
            quantity: z.number().positive().max(10000),
            expectedUnitPrice: z.number().int().min(0),
          }),
        )
        .min(1)
        .max(50),
    }),
  }),
  async (req, res, next) => {
    let claimedKey: string | null = null;
    try {
      if (!req.user!.phone)
        throw badRequest('ZALO_CONTACT_REQUIRED', 'Vui lòng cấp quyền thông tin và số điện thoại Zalo trước khi đặt hàng');
      const idempotencyKey = String(req.header('Idempotency-Key') ?? '').trim();
      if (idempotencyKey) {
        if (idempotencyKey.length > 120) throw badRequest('IDEMPOTENCY_KEY_INVALID', 'Idempotency-Key quá dài');
        await ensureOperationsSchema();
        const requestHash = createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
        const existing = await prisma.$queryRaw<any[]>`SELECT id,request_hash,response_json FROM checkout_idempotency WHERE user_id=${req.user!.id}::uuid AND idempotency_key=${idempotencyKey} LIMIT 1`;
        if (existing[0]) {
          if (existing[0].request_hash !== requestHash) throw conflict('IDEMPOTENCY_KEY_REUSED', 'Idempotency-Key đã được dùng cho payload khác');
          if (existing[0].response_json) return ok(res, existing[0].response_json);
          throw conflict('IDEMPOTENCY_IN_PROGRESS', 'Yêu cầu đặt hàng trước đó đang được xử lý');
        }
        const claimed = await prisma.$queryRaw<any[]>`INSERT INTO checkout_idempotency(user_id,idempotency_key,request_hash) VALUES (${req.user!.id}::uuid,${idempotencyKey},${requestHash}) ON CONFLICT (user_id,idempotency_key) DO NOTHING RETURNING id`;
        if (!claimed[0]) throw conflict('IDEMPOTENCY_IN_PROGRESS', 'Yêu cầu đặt hàng trước đó đang được xử lý');
        claimedKey = idempotencyKey;
      }
      const result = await svc.checkout(req.user!.id, req.body);
      if (claimedKey) {
        await prisma.$executeRaw`UPDATE checkout_idempotency SET response_json=${JSON.stringify(sanitize(result))}::jsonb WHERE user_id=${req.user!.id}::uuid AND idempotency_key=${claimedKey}`;
      }
      ok(res, result, 201);
    } catch (e) {
      if (claimedKey) await prisma.$executeRaw`DELETE FROM checkout_idempotency WHERE user_id=${req.user!.id}::uuid AND idempotency_key=${claimedKey}`.catch(() => undefined);
      next(e);
    }
  },
);

ordersRouter.get(
  '/',
  validate({ query: pageQuery.extend({ status: statusEnum.optional() }) }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const where = { customer_id: req.user!.id, status: q.status };
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
            order_items: { select: { id: true, product_name: true, product_image: true, quantity: true } },
          },
        }),
      ]);
      paginated(
        res,
        rows.map(({ order_items, ...o }) => ({
          ...o,
          item_count: order_items.length,
          first_item: order_items[0] ?? null,
        })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);

ordersRouter.get('/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: req.params.id },
      include: {
        order_items: true,
        stalls: { select: { id: true, code: true, name: true, phone: true } },
        markets: { select: { id: true, name: true, address: true } },
      },
    });
    if (!order || order.customer_id !== req.user!.id) throw notFound('Không tìm thấy đơn hàng');
    ok(res, { ...order, payment: await findOrderPayment(order.id) });
  } catch (e) {
    next(e);
  }
});

// Mock payment endpoints: giữ nguyên contract để sau này thay provider adapter.
ordersRouter.get('/:id/payment', validate({ params: idParam }), async (req, res, next) => {
  try {
    const order = await prisma.orders.findUnique({ where: { id: req.params.id }, select: { id: true, customer_id: true } });
    if (!order || order.customer_id !== req.user!.id) throw notFound('Không tìm thấy đơn hàng');
    ok(res, await findOrderPayment(order.id));
  } catch (e) {
    next(e);
  }
});

ordersRouter.post(
  '/:id/payment/simulate',
  validate({
    params: idParam,
    body: z.object({
      status: z.enum(['paid', 'failed', 'expired', 'refunded']),
      failureReason: z.string().max(500).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      ok(res, await simulateOrderPayment(req.params.id, req.user!.id, req.body.status, req.body.failureReason));
    } catch (e) {
      next(e);
    }
  },
);

ordersRouter.post(
  '/:id/cancel',
  validate({ params: idParam, body: z.object({ reason: z.string().max(1000).nullish() }) }),
  async (req, res, next) => {
    try {
      const order = await prisma.orders.findUnique({ where: { id: req.params.id } });
      if (!order || order.customer_id !== req.user!.id) throw notFound('Không tìm thấy đơn hàng');
      const merchantId = await svc.merchantOfStall(order.stall_id);
      const cancelled = await svc.cancelOrder({
        order,
        by: 'buyer',
        reason: req.body.reason ?? null,
        notifyUserIds: merchantId ? [merchantId] : [],
      });
      ok(res, cancelled);
    } catch (e) {
      next(e);
    }
  },
);

// ===== SELLER =====
sellerOrdersRouter.use(auth, requireActiveSeller);

sellerOrdersRouter.post(
  '/pos',
  validate({
    body: z.object({
      receiverName: z.string().trim().min(1).max(255).default('Khách tại quầy'),
      receiverPhone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ').default('0900000000'),
      note: z.string().max(1000).nullish(),
      paymentMethod: z.enum(['cash', 'mock_qr']).default('cash'),
      items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().positive().max(10000), expectedUnitPrice: z.number().int().min(0) })).min(1).max(50),
    }),
  }),
  async (req, res, next) => {
    try {
      if (req.user!.merchant_mode !== 'pos') throw badRequest('POS_MODE_REQUIRED', 'Tiểu thương chưa được bật mô hình POS');
      ok(res, await svc.posCheckout(req.user!.id, {
        stallId: req.seller!.stallId,
        marketId: req.seller!.marketId,
        receiverName: req.body.receiverName,
        receiverPhone: req.body.receiverPhone,
        note: req.body.note,
        paymentMethod: req.body.paymentMethod,
        items: req.body.items,
      }), 201);
    } catch (e) {
      next(e);
    }
  },
);

sellerOrdersRouter.get(
  '/',
  validate({ query: pageQuery.extend({ status: statusEnum.optional() }) }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const where = { stall_id: req.seller!.stallId, status: q.status };
      const [total, rows] = await Promise.all([
        prisma.orders.count({ where }),
        prisma.orders.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            users: { select: { id: true, full_name: true, avatar: true } },
            order_items: { select: { id: true } },
          },
        }),
      ]);
      paginated(
        res,
        rows.map(({ users, order_items, ...o }) => ({
          ...o,
          customer: users,
          item_count: order_items.length,
        })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);

async function sellerOrder(req: any, id: string) {
  const order = await prisma.orders.findUnique({
    where: { id },
    include: { order_items: true, users: { select: { id: true, full_name: true, avatar: true, phone: true } } },
  });
  if (!order || order.stall_id !== req.seller.stallId) throw notFound('Không tìm thấy đơn hàng của sạp bạn');
  return order;
}

sellerOrdersRouter.get('/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    const { users, ...order } = await sellerOrder(req, req.params.id);
    ok(res, { ...order, customer: users });
  } catch (e) {
    next(e);
  }
});

sellerOrdersRouter.post(
  '/:id/payment/settle',
  validate({ params: idParam, body: z.object({ referenceCode: z.string().trim().max(120).optional() }) }),
  async (req, res, next) => {
    try {
      await sellerOrder(req, req.params.id);
      ok(res, await settleSellerOrderPayment(req.params.id, req.user!.id, req.body.referenceCode ?? 'POS_QR_SETTLED'));
    } catch (e) {
      next(e);
    }
  },
);

sellerOrdersRouter.patch(
  '/:id/status',
  validate({
    params: idParam,
    body: z.object({ status: z.enum(['confirmed', 'preparing', 'ready', 'completed']) }),
  }),
  async (req, res, next) => {
    try {
      const order = await sellerOrder(req, req.params.id);
      ok(res, await svc.sellerUpdateStatus(order, req.body.status, req.user!.id));
    } catch (e) {
      next(e);
    }
  },
);

sellerOrdersRouter.post(
  '/:id/cancel',
  validate({ params: idParam, body: z.object({ reason: z.string().trim().min(1).max(1000) }) }),
  async (req, res, next) => {
    try {
      const order = await sellerOrder(req, req.params.id);
      const cancelled = await svc.cancelOrder({
        order,
        by: 'seller',
        reason: req.body.reason,
        notifyUserIds: order.customer_id ? [order.customer_id] : [],
      });
      ok(res, cancelled);
    } catch (e) {
      next(e);
    }
  },
);
