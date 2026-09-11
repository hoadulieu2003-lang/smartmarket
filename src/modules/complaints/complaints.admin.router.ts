import { Router } from 'express';
import { z } from 'zod';
import { Prisma, complaint_status } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles } from '../../middlewares/auth.middleware';
import { assertMarketInScope, marketFilter } from '../../shared/scope';
import { conflict, forbidden, notFound } from '../../shared/errors';
import { notifyUsers } from '../../shared/notification.helper';

export const complaintsAdminRouter = Router(); // mount tại /admin/complaints

const idParam = z.object({ id: z.string().uuid() });

/** Máy trạng thái phản ánh (PRD 10.11). */
const TRANSITIONS: Record<string, complaint_status[]> = {
  new: ['processing', 'rejected', 'escalated', 'resolved'],
  processing: ['resolved', 'rejected', 'escalated'],
  escalated: ['processing', 'resolved', 'rejected'],
  resolved: [],
  rejected: [],
};

async function complaintInScope(req: any, id: string) {
  const complaint = await prisma.complaints.findUnique({
    where: { id },
    include: {
      markets: { select: { id: true, name: true } },
      stalls: { select: { id: true, code: true, name: true } },
      products: { select: { id: true, name: true } },
      users: { select: { id: true, full_name: true, phone: true, avatar: true } },
    },
  });
  if (!complaint) throw notFound('Không tìm thấy phản ánh');
  await assertMarketInScope(req.scope, complaint.market_id);
  return complaint;
}

function assertTransition(from: complaint_status, to: complaint_status) {
  if (!TRANSITIONS[from]?.includes(to))
    throw conflict('STATE_INVALID', `Phản ánh đang ở trạng thái "${from}", không thể chuyển sang "${to}"`);
}

// GET /admin/complaints
complaintsAdminRouter.get(
  '/',
  validate({
    query: pageQuery.extend({
      status: z.enum(['new', 'processing', 'resolved', 'rejected', 'escalated']).optional(),
      type: z
        .enum(['product_quality', 'price_issue', 'food_safety', 'service_attitude', 'weighing_fraud', 'infrastructure', 'order_issue', 'other'])
        .optional(),
      marketId: z.string().uuid().optional(),
      stallId: z.string().uuid().optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const scopeWhere = await marketFilter(req.scope!, q.marketId);
      const where: Prisma.complaintsWhereInput = {
        ...scopeWhere,
        status: q.status,
        type: q.type,
        stall_id: q.stallId,
        ...(q.from || q.to ? { created_at: { gte: q.from, lte: q.to } } : {}),
      };
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
            users: { select: { id: true, full_name: true } },
          },
        }),
      ]);
      paginated(
        res,
        rows.map(({ users, ...c }) => ({ ...c, reporter: users })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);

// GET /admin/complaints/:id
complaintsAdminRouter.get('/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    const { users, ...complaint } = await complaintInScope(req, req.params.id);
    ok(res, { ...complaint, reporter: users });
  } catch (e) {
    next(e);
  }
});

// PATCH /admin/complaints/:id/status — processing | escalated | rejected
complaintsAdminRouter.patch(
  '/:id/status',
  validate({
    params: idParam,
    body: z.object({
      status: z.enum(['processing', 'escalated', 'rejected']),
      note: z.string().max(2000).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const complaint = await complaintInScope(req, req.params.id);
      const { status, note } = req.body;
      // PA chỉ được chuyển cấp (escalate)
      if (req.user!.role === 'province_admin' && status !== 'escalated')
        throw forbidden('PERM_DENIED', 'Cấp tỉnh chỉ được chuyển cấp phản ánh');
      if (status === 'rejected' && !note?.trim())
        throw conflict('STATE_INVALID', 'Từ chối phản ánh phải có lý do');
      assertTransition(complaint.status, status);
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.complaints.update({
          where: { id: complaint.id },
          data: {
            status,
            ...(status === 'rejected' ? { resolution_note: note, resolved_at: new Date() } : {}),
          },
        });
        if (status !== 'processing') {
          const LABEL = { escalated: 'được chuyển lên cấp cao hơn', rejected: 'không hợp lệ' } as const;
          if (complaint.user_id) await notifyUsers(tx, {
            userIds: [complaint.user_id],
            marketId: complaint.market_id,
            title: `Phản ánh của bạn ${LABEL[status as 'escalated' | 'rejected']}`,
            content: `Phản ánh tại ${complaint.markets.name} ${LABEL[status as 'escalated' | 'rejected']}.${note ? ` Ghi chú: ${note}` : ''}`,
            type: 'complaint',
            refType: 'complaint',
            refId: complaint.id,
          });
        }
        return u;
      });
      ok(res, updated);
    } catch (e) {
      next(e);
    }
  },
);

// POST /admin/complaints/:id/resolve
complaintsAdminRouter.post(
  '/:id/resolve',
  requireRoles('super_admin', 'market_manager'),
  validate({
    params: idParam,
    body: z.object({
      resolutionNote: z.string().trim().min(1).max(5000),
      resolutionImages: z.array(z.object({ url: z.string().url() })).default([]),
    }),
  }),
  async (req, res, next) => {
    try {
      const complaint = await complaintInScope(req, req.params.id);
      assertTransition(complaint.status, 'resolved');
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.complaints.update({
          where: { id: complaint.id },
          data: {
            status: 'resolved',
            resolution_note: req.body.resolutionNote,
            resolution_images: req.body.resolutionImages,
            resolved_at: new Date(),
          },
        });
        if (complaint.user_id) await notifyUsers(tx, {
          userIds: [complaint.user_id],
          marketId: complaint.market_id,
          title: 'Phản ánh của bạn đã được xử lý',
          content: `Phản ánh tại ${complaint.markets.name} đã được xử lý: ${req.body.resolutionNote.slice(0, 200)}`,
          type: 'complaint',
          refType: 'complaint',
          refId: complaint.id,
        });
        return u;
      });
      ok(res, updated);
    } catch (e) {
      next(e);
    }
  },
);
