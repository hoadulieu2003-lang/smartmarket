import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles } from '../../middlewares/auth.middleware';
import { assertMarketInScope, marketIdsForScope } from '../../shared/scope';
import { badRequest, conflict, notFound } from '../../shared/errors';
import { createNotification, resolveRecipients } from '../../shared/notification.helper';

export const notificationsAdminRouter = Router(); // mount tại /admin/notifications

const idParam = z.object({ id: z.string().uuid() });
const CAN_SEND = ['super_admin', 'market_manager'] as const;

const notiBody = z.object({
  marketId: z.string().uuid(),
  title: z.string().trim().min(1).max(255),
  content: z.string().trim().min(1).max(10000),
  type: z.enum(['general', 'maintenance', 'fee', 'complaint', 'application', 'order', 'promotion', 'urgent']).default('general'),
  priority: z.enum(['normal', 'important', 'urgent']).default('normal'),
  targetType: z.enum(['market', 'zone', 'category', 'user']),
  targetId: z.string().uuid().nullish(),
  attachment: z.string().url().nullish(),
  send: z.boolean().default(true),
});

async function validateTarget(b: z.infer<typeof notiBody>) {
  if (b.targetType !== 'market' && !b.targetId)
    throw badRequest('targetId là bắt buộc với loại đối tượng này');
  if (b.targetType === 'zone') {
    const zone = await prisma.zones.findUnique({ where: { id: b.targetId! } });
    if (!zone || zone.market_id !== b.marketId) throw badRequest('Khu không thuộc chợ đã chọn');
  }
  if (b.targetType === 'category') {
    const cat = await prisma.categories.findUnique({ where: { id: b.targetId! } });
    if (!cat) throw badRequest('Ngành hàng không tồn tại');
  }
  if (b.targetType === 'user') {
    const user = await prisma.users.findUnique({ where: { id: b.targetId! } });
    if (!user) throw badRequest('Người nhận không tồn tại');
  }
}

// GET /admin/notifications
notificationsAdminRouter.get(
  '/',
  validate({
    query: pageQuery.extend({
      marketId: z.string().uuid().optional(),
      state: z.enum(['draft', 'sent']).optional(),
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
      const where: Prisma.notificationsWhereInput = {
        ...(marketIds ? { market_id: { in: marketIds } } : {}),
        ...(q.state === 'draft' ? { sent_at: null } : q.state === 'sent' ? { sent_at: { not: null } } : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.notifications.count({ where }),
        prisma.notifications.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            markets: { select: { id: true, name: true } },
            users: { select: { id: true, full_name: true } },
          },
        }),
      ]);
      // Thống kê người nhận/đã đọc cho trang hiện tại
      const ids = rows.map((r) => r.id);
      const stats = ids.length
        ? await prisma.notification_recipients.groupBy({
            by: ['notification_id'],
            where: { notification_id: { in: ids } },
            _count: { _all: true },
          })
        : [];
      const readStats = ids.length
        ? await prisma.notification_recipients.groupBy({
            by: ['notification_id'],
            where: { notification_id: { in: ids }, read_at: { not: null } },
            _count: { _all: true },
          })
        : [];
      const totalMap = new Map(stats.map((s) => [s.notification_id, s._count._all]));
      const readMap = new Map(readStats.map((s) => [s.notification_id, s._count._all]));
      paginated(
        res,
        rows.map(({ users, ...n }) => ({
          ...n,
          creator: users,
          recipient_count: totalMap.get(n.id) ?? 0,
          read_count: readMap.get(n.id) ?? 0,
        })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);

// POST /admin/notifications
notificationsAdminRouter.post(
  '/',
  requireRoles(...CAN_SEND),
  validate({ body: notiBody }),
  async (req, res, next) => {
    try {
      const b = req.body;
      await assertMarketInScope(req.scope!, b.marketId);
      await validateTarget(b);
      const noti = await prisma.$transaction((tx) =>
        createNotification(tx, {
          marketId: b.marketId,
          createdBy: req.user!.id,
          title: b.title,
          content: b.content,
          type: b.type,
          priority: b.priority,
          targetType: b.targetType,
          targetId: b.targetId ?? null,
          attachment: b.attachment ?? null,
          send: b.send,
        }),
      );
      ok(res, noti, 201);
    } catch (e) {
      next(e);
    }
  },
);

// GET /admin/notifications/:id
notificationsAdminRouter.get('/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    const noti = await prisma.notifications.findUnique({
      where: { id: req.params.id },
      include: {
        markets: { select: { id: true, name: true } },
        users: { select: { id: true, full_name: true } },
      },
    });
    if (!noti) throw notFound('Không tìm thấy thông báo');
    if (noti.market_id) await assertMarketInScope(req.scope!, noti.market_id);
    const [recipientCount, readCount] = await Promise.all([
      prisma.notification_recipients.count({ where: { notification_id: noti.id } }),
      prisma.notification_recipients.count({ where: { notification_id: noti.id, read_at: { not: null } } }),
    ]);
    const { users, ...rest } = noti;
    ok(res, { ...rest, creator: users, recipient_count: recipientCount, read_count: readCount });
  } catch (e) {
    next(e);
  }
});

async function draftInScope(req: any, id: string) {
  const noti = await prisma.notifications.findUnique({ where: { id } });
  if (!noti) throw notFound('Không tìm thấy thông báo');
  if (noti.market_id) await assertMarketInScope(req.scope, noti.market_id);
  if (noti.sent_at) throw conflict('STATE_INVALID', 'Thông báo đã gửi, không thể thay đổi');
  return noti;
}

// PUT /admin/notifications/:id — chỉ nháp
notificationsAdminRouter.put(
  '/:id',
  requireRoles(...CAN_SEND),
  validate({ params: idParam, body: notiBody.omit({ send: true }).partial() }),
  async (req, res, next) => {
    try {
      const draft = await draftInScope(req, req.params.id);
      const b = req.body;
      if (b.marketId) await assertMarketInScope(req.scope!, b.marketId);
      const updated = await prisma.notifications.update({
        where: { id: draft.id },
        data: {
          market_id: b.marketId,
          title: b.title,
          content: b.content,
          type: b.type,
          priority: b.priority,
          target_type: b.targetType,
          target_id: b.targetId,
          attachment: b.attachment,
        },
      });
      ok(res, updated);
    } catch (e) {
      next(e);
    }
  },
);

// POST /admin/notifications/:id/send — gửi nháp
notificationsAdminRouter.post(
  '/:id/send',
  requireRoles(...CAN_SEND),
  validate({ params: idParam }),
  async (req, res, next) => {
    try {
      const draft = await draftInScope(req, req.params.id);
      const sent = await prisma.$transaction(async (tx) => {
        const updated = await tx.notifications.update({
          where: { id: draft.id },
          data: { sent_at: new Date() },
        });
        const userIds = await resolveRecipients(tx, draft.target_type, draft.target_id, draft.market_id);
        for (let i = 0; i < userIds.length; i += 500) {
          await tx.notification_recipients.createMany({
            data: userIds.slice(i, i + 500).map((user_id) => ({ notification_id: draft.id, user_id })),
            skipDuplicates: true,
          });
        }
        return updated;
      });
      ok(res, sent);
    } catch (e) {
      next(e);
    }
  },
);

// DELETE /admin/notifications/:id — chỉ nháp
notificationsAdminRouter.delete(
  '/:id',
  requireRoles(...CAN_SEND),
  validate({ params: idParam }),
  async (req, res, next) => {
    try {
      const draft = await draftInScope(req, req.params.id);
      await prisma.notifications.delete({ where: { id: draft.id } });
      ok(res, { message: 'Đã xóa thông báo nháp' });
    } catch (e) {
      next(e);
    }
  },
);
