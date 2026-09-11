import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { auth } from '../../middlewares/auth.middleware';
import { notFound } from '../../shared/errors';

export const notificationsRouter = Router(); // app — mount tại /notifications
notificationsRouter.use(auth);

/**
 * Feed = thông báo có recipient row của tôi (trực tiếp/hệ thống)
 *      ∪ broadcast của chợ tôi đang chọn (target market, đã gửi).
 */
notificationsRouter.get('/', validate({ query: pageQuery }), async (req, res, next) => {
  try {
    const q = req.query as any;
    const userId = req.user!.id;
    const marketId = req.user!.selected_market_id;
    const offset = (q.page - 1) * q.limit;

    const rows = await prisma.$queryRaw<any[]>`
      SELECT n.id, n.market_id, n.title, n.content, n.type, n.priority, n.target_type,
             n.attachment, n.ref_type, n.ref_id, n.sent_at, r.read_at
      FROM notifications n
      LEFT JOIN notification_recipients r
        ON r.notification_id = n.id AND r.user_id = ${userId}::uuid
      WHERE n.sent_at IS NOT NULL
        AND (r.user_id IS NOT NULL
             OR (n.target_type = 'market' AND n.market_id = ${marketId ?? null}::uuid))
      ORDER BY n.sent_at DESC
      LIMIT ${q.limit} OFFSET ${offset}`;
    const [{ total }] = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(*)::bigint AS total
      FROM notifications n
      LEFT JOIN notification_recipients r
        ON r.notification_id = n.id AND r.user_id = ${userId}::uuid
      WHERE n.sent_at IS NOT NULL
        AND (r.user_id IS NOT NULL
             OR (n.target_type = 'market' AND n.market_id = ${marketId ?? null}::uuid))`;
    paginated(
      res,
      rows.map((r) => ({ ...r, is_read: !!r.read_at })),
      { page: q.page, limit: q.limit, total: Number(total) },
    );
  } catch (e) {
    next(e);
  }
});

// GET /notifications/unread-count — badge (chỉ tính thông báo có recipient row)
notificationsRouter.get('/unread-count', async (req, res, next) => {
  try {
    const count = await prisma.notification_recipients.count({
      where: { user_id: req.user!.id, read_at: null },
    });
    ok(res, { unread_count: count });
  } catch (e) {
    next(e);
  }
});

// POST /notifications/:id/read — upsert (hỗ trợ cả broadcast chưa có row)
notificationsRouter.post(
  '/:id/read',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const noti = await prisma.notifications.findUnique({ where: { id: req.params.id } });
      if (!noti || !noti.sent_at) throw notFound('Không tìm thấy thông báo');
      const existing = await prisma.notification_recipients.findUnique({
        where: { notification_id_user_id: { notification_id: noti.id, user_id: userId } },
      });
      const isBroadcastForMe =
        noti.target_type === 'market' && noti.market_id === req.user!.selected_market_id;
      if (!existing && !isBroadcastForMe) throw notFound('Không tìm thấy thông báo');
      await prisma.notification_recipients.upsert({
        where: { notification_id_user_id: { notification_id: noti.id, user_id: userId } },
        create: { notification_id: noti.id, user_id: userId, read_at: new Date() },
        update: { read_at: existing?.read_at ?? new Date() },
      });
      ok(res, { message: 'Đã đánh dấu đã đọc' });
    } catch (e) {
      next(e);
    }
  },
);

// POST /notifications/read-all
notificationsRouter.post('/read-all', async (req, res, next) => {
  try {
    const { count } = await prisma.notification_recipients.updateMany({
      where: { user_id: req.user!.id, read_at: null },
      data: { read_at: new Date() },
    });
    ok(res, { marked_count: count });
  } catch (e) {
    next(e);
  }
});
