import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { auth } from '../../middlewares/auth.middleware';
import { badRequest, notFound } from '../../shared/errors';
import { marketManagerIds, notifyUsers } from '../../shared/notification.helper';
import { ensureOperationsSchema } from '../operations/operations.schema';

export const complaintsRouter = Router(); // app — mount tại / — auth gắn theo từng route
const idParam = z.object({ id: z.string().uuid() });

// Public, redacted feed of resolved complaints explicitly approved for publication.
// It never exposes reporter identity, phone, images or internal timeline notes.
complaintsRouter.get('/public/complaints', validate({ query: pageQuery.extend({ marketId: z.string().uuid().optional() }) }), async (req, res, next) => {
  try {
    await ensureOperationsSchema();
    const q = req.query as any;
    const market = q.marketId ? Prisma.sql`AND c.market_id=${q.marketId}::uuid` : Prisma.empty;
    const rows = await prisma.$queryRaw<any[]>`SELECT c.id,c.type,c.content,c.resolution_note,c.resolved_at,c.created_at,ma.name market_name,s.code stall_code FROM complaints c JOIN markets ma ON ma.id=c.market_id LEFT JOIN stalls s ON s.id=c.stall_id WHERE c.status='resolved' AND c.public_result=true ${market} ORDER BY c.resolved_at DESC NULLS LAST,c.created_at DESC LIMIT ${q.limit} OFFSET ${(q.page-1)*q.limit}`;
    const total = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint count FROM complaints c WHERE c.status='resolved' AND c.public_result=true ${market}`;
    paginated(res, rows, { page: q.page, limit: q.limit, total: Number(total[0]?.count ?? 0) });
  } catch (e) { next(e); }
});

complaintsRouter.get('/public/complaints/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    await ensureOperationsSchema();
    const row = await prisma.$queryRaw<any[]>`SELECT c.id,c.type,c.content,c.resolution_note,c.resolved_at,c.created_at,ma.name market_name,s.code stall_code FROM complaints c JOIN markets ma ON ma.id=c.market_id LEFT JOIN stalls s ON s.id=c.stall_id WHERE c.id=${req.params.id}::uuid AND c.status='resolved' AND c.public_result=true LIMIT 1`;
    if (!row[0]) throw notFound('Không tìm thấy kết quả công khai');
    ok(res, row[0]);
  } catch (e) { next(e); }
});

// Gửi phản ánh từ QR tại cổng chợ: không yêu cầu đăng nhập.
complaintsRouter.post(
  '/public/complaints',
  validate({
    body: z.object({
      marketId: z.string().uuid(),
      stallId: z.string().uuid().nullish(),
      type: z.enum(['product_quality', 'price_issue', 'food_safety', 'service_attitude', 'weighing_fraud', 'infrastructure', 'order_issue', 'other']),
      content: z.string().trim().min(1).max(5000),
      images: z.array(z.object({ url: z.string().url() })).max(5).default([]),
      contact: z.string().trim().max(120).optional(),
      orderCode: z.string().trim().max(60).optional(),
      paymentCode: z.string().trim().max(60).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      await ensureOperationsSchema();
      const b = req.body;
      const market = await prisma.markets.findUnique({ where: { id: b.marketId }, select: { id: true, name: true, status: true } });
      if (!market || market.status !== 'active') throw badRequest('Chợ không tồn tại hoặc đã ngừng hoạt động');
      if (b.stallId) {
        const stall = await prisma.stalls.findUnique({ where: { id: b.stallId }, select: { market_id: true } });
        if (!stall || stall.market_id !== b.marketId) throw badRequest('Sạp không thuộc chợ đã chọn');
      }
      let orderId: string | null = null;
      let paymentId: string | null = null;
      if (b.orderCode || b.paymentCode) {
        if (!b.orderCode || !b.paymentCode) throw badRequest('Phản ánh gắn giao dịch cần cả mã đơn và mã thanh toán');
        const matched = await prisma.$queryRaw<any[]>`
          SELECT o.id order_id, o.market_id, o.stall_id, pt.id payment_id
          FROM orders o JOIN payment_transactions pt ON pt.order_id=o.id
          WHERE o.code=${b.orderCode} AND pt.code=${b.paymentCode} AND pt.status='paid' LIMIT 1
        `;
        if (!matched[0] || matched[0].market_id !== b.marketId) throw badRequest('Không xác thực được hóa đơn/giao dịch');
        if (b.stallId && matched[0].stall_id !== b.stallId) throw badRequest('Hóa đơn không thuộc sạp đã chọn');
        orderId = matched[0].order_id;
        paymentId = matched[0].payment_id;
      }
      const publicToken = `FB-${randomUUID().replace(/-/g, '')}`;
      const complaint = await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<any[]>`
          INSERT INTO complaints
            (user_id, market_id, stall_id, type, content, images, status, resolution_images, public_token, reporter_contact, order_id, payment_transaction_id)
          VALUES
            (NULL, ${b.marketId}::uuid, ${b.stallId ?? null}::uuid, ${b.type}, ${b.content}, ${JSON.stringify(b.images)}::jsonb,
             'new', '[]'::jsonb, ${publicToken}, ${b.contact ?? null}, ${orderId}::uuid, ${paymentId}::uuid)
          RETURNING id, public_token, status, created_at
        `;
        const managers = await marketManagerIds(tx, b.marketId);
        await notifyUsers(tx, {
          userIds: managers,
          marketId: b.marketId,
          title: 'Có phản ánh công khai mới',
          content: `Phản ánh từ cổng chợ ${market.name}: ${b.content.slice(0, 120)}`,
          type: 'complaint',
          refType: 'complaint',
          refId: rows[0].id,
        });
        return rows[0];
      });
      ok(res, { ...complaint, tracking_url: `/feedback/public/track/${publicToken}` }, 201);
    } catch (e) { next(e); }
  },
);

complaintsRouter.get('/public/complaints/track/:token', validate({ params: z.object({ token: z.string().trim().min(10).max(120) }) }), async (req, res, next) => {
  try {
    await ensureOperationsSchema();
    const rows = await prisma.$queryRaw<any[]>`
      SELECT c.public_token, c.status, c.type, c.content, c.resolution_note, c.resolved_at, c.created_at, ma.name market_name, s.code stall_code
      FROM complaints c JOIN markets ma ON ma.id=c.market_id LEFT JOIN stalls s ON s.id=c.stall_id
      WHERE c.public_token=${req.params.token} LIMIT 1
    `;
    if (!rows[0]) throw notFound('Không tìm thấy mã tra cứu phản ánh');
    ok(res, rows[0]);
  } catch (e) { next(e); }
});

const typeEnum = z.enum([
  'product_quality',
  'price_issue',
  'food_safety',
  'service_attitude',
  'weighing_fraud',
  'infrastructure',
  'order_issue',
  'other',
]);
const statusEnum = z.enum(['new', 'processing', 'resolved', 'rejected', 'escalated']);

// POST /complaints
complaintsRouter.post(
  '/complaints',
  auth,
  validate({
    body: z.object({
      marketId: z.string().uuid(),
      stallId: z.string().uuid().nullish(),
      productId: z.string().uuid().nullish(),
      type: typeEnum,
      content: z.string().trim().min(1).max(5000),
      images: z.array(z.object({ url: z.string().url() })).default([]),
    }),
  }),
  async (req, res, next) => {
    try {
      const b = req.body;
      const market = await prisma.markets.findUnique({ where: { id: b.marketId } });
      if (!market || market.status !== 'active')
        throw badRequest('Chợ không tồn tại hoặc đã ngừng hoạt động');
      if (b.stallId) {
        const stall = await prisma.stalls.findUnique({ where: { id: b.stallId } });
        if (!stall || stall.market_id !== b.marketId)
          throw badRequest('Sạp không thuộc chợ đã chọn');
      }
      if (b.productId) {
        const product = await prisma.products.findUnique({
          where: { id: b.productId },
          include: { stalls: { select: { market_id: true, id: true } } },
        });
        if (!product || product.stalls.market_id !== b.marketId)
          throw badRequest('Sản phẩm không thuộc chợ đã chọn');
        if (b.stallId && product.stall_id !== b.stallId)
          throw badRequest('Sản phẩm không thuộc sạp đã chọn');
      }
      const complaint = await prisma.$transaction(async (tx) => {
        const created = await tx.complaints.create({
          data: {
            user_id: req.user!.id,
            market_id: b.marketId,
            stall_id: b.stallId ?? null,
            product_id: b.productId ?? null,
            type: b.type,
            content: b.content,
            images: b.images,
            status: 'new',
            resolution_images: [],
          },
        });
        const managers = await marketManagerIds(tx, b.marketId);
        await notifyUsers(tx, {
          userIds: managers,
          marketId: b.marketId,
          title: 'Có phản ánh mới',
          content: `Phản ánh mới tại ${market.name}: ${b.content.slice(0, 120)}`,
          type: 'complaint',
          refType: 'complaint',
          refId: created.id,
        });
        return created;
      });
      ok(res, complaint, 201);
    } catch (e) {
      next(e);
    }
  },
);

// GET /my/complaints
complaintsRouter.get(
  '/my/complaints',
  auth,
  validate({ query: pageQuery.extend({ status: statusEnum.optional() }) }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const where = { user_id: req.user!.id, status: q.status };
      const [total, rows] = await Promise.all([
        prisma.complaints.count({ where }),
        prisma.complaints.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            markets: { select: { id: true, name: true } },
            stalls: { select: { id: true, code: true, name: true } },
            products: { select: { id: true, name: true } },
          },
        }),
      ]);
      paginated(res, rows, { page: q.page, limit: q.limit, total });
    } catch (e) {
      next(e);
    }
  },
);

// GET /complaints/:id — chủ phản ánh xem chi tiết + phản hồi
complaintsRouter.get('/complaints/:id', auth, validate({ params: idParam }), async (req, res, next) => {
  try {
    const complaint = await prisma.complaints.findUnique({
      where: { id: req.params.id },
      include: {
        markets: { select: { id: true, name: true } },
        stalls: { select: { id: true, code: true, name: true } },
        products: { select: { id: true, name: true } },
      },
    });
    if (!complaint || complaint.user_id !== req.user!.id) throw notFound('Không tìm thấy phản ánh');
    ok(res, complaint);
  } catch (e) {
    next(e);
  }
});
