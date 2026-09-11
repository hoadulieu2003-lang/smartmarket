import { Router } from 'express';
import { z } from 'zod';
import { Prisma, application_status } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles, invalidateUserCache } from '../../middlewares/auth.middleware';
import { assertMarketInScope, marketFilter } from '../../shared/scope';
import { conflict, notFound } from '../../shared/errors';
import { notifyUsers } from '../../shared/notification.helper';
import { assignStallTx } from '../contracts/contracts.service';
import * as map from '../markets/market-map.service';

export const applicationsAdminRouter = Router(); // mount tại /admin/merchant-approvals

const idParam = z.object({ id: z.string().uuid() });
const CAN_REVIEW = ['super_admin', 'market_manager'] as const;

/** Máy trạng thái hồ sơ (PRD 10.6). */
const TRANSITIONS: Record<string, application_status[]> = {
  pending: ['reviewing', 'approved', 'rejected', 'need_more_info'],
  reviewing: ['approved', 'rejected', 'need_more_info'],
  need_more_info: [], // user cập nhật mới quay về pending
  approved: [],
  rejected: [],
  cancelled: [],
};

async function appInScope(req: any, id: string) {
  const app = await prisma.merchant_applications.findUnique({
    where: { id },
    include: {
      markets: { select: { id: true, name: true } },
      users_merchant_applications_user_idTousers: {
        select: { id: true, full_name: true, avatar: true, phone: true, merchant_status: true },
      },
      categories: { select: { id: true, name: true } },
    },
  });
  if (!app) throw notFound('Không tìm thấy hồ sơ');
  await assertMarketInScope(req.scope, app.market_id);
  return app;
}

function assertTransition(from: application_status, to: application_status) {
  if (!TRANSITIONS[from]?.includes(to))
    throw conflict('STATE_INVALID', `Hồ sơ đang ở trạng thái "${from}", không thể chuyển sang "${to}"`);
}

// GET /admin/merchant-approvals
applicationsAdminRouter.get(
  '/',
  validate({
    query: pageQuery.extend({
      status: z
        .enum(['pending', 'reviewing', 'need_more_info', 'approved', 'rejected', 'cancelled'])
        .optional(),
      marketId: z.string().uuid().optional(),
      search: z.string().trim().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const scopeWhere = await marketFilter(req.scope!, q.marketId);
      const where: Prisma.merchant_applicationsWhereInput = {
        ...scopeWhere,
        status: q.status,
        ...(q.search
          ? {
              OR: [
                { full_name: { contains: q.search, mode: 'insensitive' } },
                { phone: { contains: q.search } },
                { id_number: { contains: q.search } },
              ],
            }
          : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.merchant_applications.count({ where }),
        prisma.merchant_applications.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            markets: { select: { id: true, name: true } },
            categories: { select: { id: true, name: true } },
            users_merchant_applications_user_idTousers: {
              select: { id: true, full_name: true, avatar: true },
            },
          },
        }),
      ]);
      paginated(
        res,
        rows.map(({ users_merchant_applications_user_idTousers, ...a }) => ({
          ...a,
          applicant: users_merchant_applications_user_idTousers,
        })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);

// GET /admin/merchant-approvals/:id
applicationsAdminRouter.get('/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    const app = await appInScope(req, req.params.id);
    const reviewer = app.reviewed_by
      ? await prisma.users.findUnique({
          where: { id: app.reviewed_by },
          select: { id: true, full_name: true },
        })
      : null;
    const { users_merchant_applications_user_idTousers, ...rest } = app;
    ok(res, { ...rest, applicant: users_merchant_applications_user_idTousers, reviewer });
  } catch (e) {
    next(e);
  }
});

// GET /admin/merchant-approvals/:id/stalls — danh sách sạp kèm sơ đồ cho modal duyệt
applicationsAdminRouter.get('/:id/stalls', validate({ params: idParam }), async (req, res, next) => {
  try {
    const app = await appInScope(req, req.params.id);
    const [mapPreview, market, stalls] = await Promise.all([
      map.getAssignmentMapPreview(app.market_id),
      prisma.markets.findUnique({
        where: { id: app.market_id },
        select: { map_layout_published: true },
      }),
      prisma.stalls.findMany({
        where: { market_id: app.market_id },
        orderBy: [{ zones: { display_order: 'asc' } }, { display_order: 'asc' }, { code: 'asc' }],
        include: {
          zones: {
            select: {
              id: true,
              name: true,
              is_active: true,
              categories: { select: { id: true, name: true } },
            },
          },
          categories: { select: { id: true, name: true } },
          contracts: {
            where: { ended_at: null },
            select: {
              id: true,
              users_contracts_merchant_idTousers: {
                select: { id: true, full_name: true },
              },
            },
            take: 1,
          },
        },
      }),
    ]);

    let publishedDoc: any = null;
    if (market?.map_layout_published) {
      try {
        publishedDoc = typeof market.map_layout_published === 'string'
          ? JSON.parse(market.map_layout_published)
          : market.map_layout_published;
      } catch {}
    }
    const hasPublishedMap = Boolean(publishedDoc && publishedDoc.revisionId);

    const publishedFloorByStall = new Map<string, { floorId: string; isActive: boolean }>();
    if (hasPublishedMap && Array.isArray(publishedDoc?.floors)) {
      for (const floor of publishedDoc.floors) {
        if (Array.isArray(floor.placements)) {
          for (const p of floor.placements) {
            if (p.stallId) {
              publishedFloorByStall.set(p.stallId, { floorId: floor.id, isActive: Boolean(floor.isActive) });
            }
          }
        }
      }
    }

    const previewFloorByStall = new Map<string, {
      floorId: string;
      floorName: string;
      isActive: boolean;
      column: number;
      row: number;
      columnSpan: number;
      rowSpan: number;
      isTemporary: boolean;
    }>();

    if (Array.isArray(mapPreview?.document?.floors)) {
      for (const floor of mapPreview.document.floors) {
        if (Array.isArray(floor.placements)) {
          for (const p of floor.placements) {
            if (p.stallId) {
              previewFloorByStall.set(p.stallId, {
                floorId: floor.id,
                floorName: floor.name,
                isActive: Boolean(floor.isActive),
                column: p.column,
                row: p.row,
                columnSpan: p.columnSpan,
                rowSpan: p.rowSpan,
                isTemporary: Boolean(p.isTemporary),
              });
            }
          }
        }
      }
    }

    const candidateStalls = stalls.map((stall) => {
      const placement = previewFloorByStall.get(stall.id) ?? null;
      const pubInfo = publishedFloorByStall.get(stall.id);
      const published = Boolean(pubInfo);
      const publishedFloorIsActive = Boolean(pubInfo?.isActive);

      let currentContract: { id: string; merchant: { id: string; fullName: string } } | null = null;
      if (stall.contracts && stall.contracts.length > 0) {
        const c = stall.contracts[0];
        currentContract = {
          id: c.id,
          merchant: {
            id: c.users_contracts_merchant_idTousers.id,
            fullName: c.users_contracts_merchant_idTousers.full_name,
          },
        };
      }

      let selectable = true;
      let disabledReasonCode: string | null = null;
      let disabledReason: string | null = null;

      if (currentContract || stall.status === 'occupied') {
        selectable = false;
        disabledReasonCode = 'STALL_OCCUPIED';
        disabledReason = 'Sạp đang có người thuê';
      } else if (stall.status === 'maintenance') {
        selectable = false;
        disabledReasonCode = 'STALL_MAINTENANCE';
        disabledReason = 'Sạp đang bảo trì';
      } else if (stall.status === 'reserved') {
        selectable = false;
        disabledReasonCode = 'STALL_RESERVED';
        disabledReason = 'Sạp đã được đặt trước';
      } else if (stall.status !== 'vacant') {
        selectable = false;
        disabledReasonCode = 'STALL_UNAVAILABLE';
        disabledReason = 'Sạp không khả dụng';
      } else if (!stall.zones.is_active) {
        selectable = false;
        disabledReasonCode = 'ZONE_INACTIVE';
        disabledReason = 'Khu vực đang tạm dừng hoạt động';
      } else if (hasPublishedMap) {
        if (!published) {
          selectable = false;
          disabledReasonCode = 'STALL_NOT_ON_ACTIVE_FLOOR';
          disabledReason = 'Cần xuất bản sơ đồ có sạp này lên tầng hoạt động trước khi gán';
        } else if (!publishedFloorIsActive) {
          selectable = false;
          disabledReasonCode = 'STALL_NOT_ON_ACTIVE_FLOOR';
          disabledReason = 'Tầng chứa sạp đang tạm dừng hoạt động';
        }
      } else if (placement && !placement.isActive) {
        selectable = false;
        disabledReasonCode = 'STALL_NOT_ON_ACTIVE_FLOOR';
        disabledReason = 'Tầng chứa sạp đang tạm dừng hoạt động';
      }

      const category = stall.categories ?? stall.zones.categories ?? null;

      return {
        id: stall.id,
        code: stall.code,
        name: stall.name,
        status: stall.status,
        zone: { id: stall.zones.id, name: stall.zones.name },
        category: category ? { id: category.id, name: category.name } : null,
        placement,
        published,
        selectable,
        disabledReasonCode,
        disabledReason,
        currentContract,
      };
    });

    ok(res, {
      marketId: app.market_id,
      map: mapPreview,
      stalls: candidateStalls,
    });
  } catch (e) {
    next(e);
  }
});

// POST /admin/merchant-approvals/:id/review — đánh dấu đang xem
applicationsAdminRouter.post(
  '/:id/review',
  requireRoles(...CAN_REVIEW),
  validate({ params: idParam }),
  async (req, res, next) => {
    try {
      const app = await appInScope(req, req.params.id);
      assertTransition(app.status, 'reviewing');
      const updated = await prisma.merchant_applications.update({
        where: { id: app.id },
        data: { status: 'reviewing', reviewed_by: req.user!.id },
      });
      ok(res, updated);
    } catch (e) {
      next(e);
    }
  },
);

// POST /admin/merchant-approvals/:id/approve
applicationsAdminRouter.post(
  '/:id/approve',
  requireRoles(...CAN_REVIEW),
  validate({
    params: idParam,
    body: z.object({
      categoryId: z.string().uuid().nullish(),
      note: z.string().max(2000).nullish(),
      // BẮT BUỘC gán sạp khi duyệt: không có sạp thì tiểu thương không vào được chế độ bán hàng (seller = null).
      stallId: z
        .string({
          required_error: 'Phải gán sạp cho tiểu thương khi duyệt hồ sơ',
          invalid_type_error: 'Phải gán sạp cho tiểu thương khi duyệt hồ sơ',
        })
        .uuid('Sạp không hợp lệ'),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
      fee: z.number().min(0).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const app = await appInScope(req, req.params.id);
      assertTransition(app.status, 'approved');
      const b = req.body;
      const categoryId = b.categoryId ?? app.category_id;

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.merchant_applications.update({
          where: { id: app.id },
          data: {
            status: 'approved',
            admin_note: b.note ?? null,
            reviewed_by: req.user!.id,
            reviewed_at: new Date(),
          },
        });
        await tx.users.update({
          where: { id: app.user_id },
          data: {
            merchant_status: 'active',
            merchant_market_id: app.market_id,
            merchant_category_id: categoryId,
            merchant_joined_at: new Date(),
          },
        });
        let contract = null;
        if (b.stallId) {
          const stall = await tx.stalls.findUnique({ where: { id: b.stallId } });
          if (!stall || stall.market_id !== app.market_id)
            throw conflict('STATE_INVALID', 'Sạp được chọn không thuộc chợ của hồ sơ');
          contract = await assignStallTx(tx, {
            stallId: b.stallId,
            merchantId: app.user_id,
            startDate: b.startDate ?? new Date().toISOString().slice(0, 10),
            endDate: b.endDate ?? null,
            fee: b.fee,
            categoryId,
            note: `Gán sạp khi duyệt hồ sơ ${app.id}`,
            createdBy: req.user!.id,
          });
        }
        await notifyUsers(tx, {
          userIds: [app.user_id],
          marketId: app.market_id,
          title: 'Hồ sơ tiểu thương đã được duyệt',
          content: `Chúc mừng! Hồ sơ đăng ký kinh doanh tại ${app.markets.name} của bạn đã được duyệt.${contract ? ' Bạn đã được gán sạp, hãy vào chế độ Tiểu thương để bắt đầu.' : ''}`,
          type: 'application',
          refType: 'merchant_application',
          refId: app.id,
        });
        return { application: updated, contract };
      });
      invalidateUserCache(app.user_id);
      ok(res, result);
    } catch (e) {
      next(e);
    }
  },
);

// POST /admin/merchant-approvals/:id/reject
applicationsAdminRouter.post(
  '/:id/reject',
  requireRoles(...CAN_REVIEW),
  validate({
    params: idParam,
    body: z.object({ reason: z.string().trim().min(1).max(500), note: z.string().max(2000).nullish() }),
  }),
  async (req, res, next) => {
    try {
      const app = await appInScope(req, req.params.id);
      assertTransition(app.status, 'rejected');
      const adminNote = req.body.note ? `[${req.body.reason}] ${req.body.note}` : `[${req.body.reason}]`;
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.merchant_applications.update({
          where: { id: app.id },
          data: { status: 'rejected', admin_note: adminNote, reviewed_by: req.user!.id, reviewed_at: new Date() },
        });
        await notifyUsers(tx, {
          userIds: [app.user_id],
          marketId: app.market_id,
          title: 'Hồ sơ tiểu thương bị từ chối',
          content: `Hồ sơ đăng ký tại ${app.markets.name} của bạn bị từ chối. Lý do: ${req.body.reason}`,
          type: 'application',
          refType: 'merchant_application',
          refId: app.id,
        });
        return u;
      });
      ok(res, updated);
    } catch (e) {
      next(e);
    }
  },
);

// POST /admin/merchant-approvals/:id/request-info
applicationsAdminRouter.post(
  '/:id/request-info',
  requireRoles(...CAN_REVIEW),
  validate({ params: idParam, body: z.object({ note: z.string().trim().min(1).max(2000) }) }),
  async (req, res, next) => {
    try {
      const app = await appInScope(req, req.params.id);
      assertTransition(app.status, 'need_more_info');
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.merchant_applications.update({
          where: { id: app.id },
          data: { status: 'need_more_info', admin_note: req.body.note, reviewed_by: req.user!.id },
        });
        await notifyUsers(tx, {
          userIds: [app.user_id],
          marketId: app.market_id,
          title: 'Hồ sơ cần bổ sung thông tin',
          content: `Hồ sơ tại ${app.markets.name} cần bổ sung: ${req.body.note}`,
          type: 'application',
          refType: 'merchant_application',
          refId: app.id,
        });
        return u;
      });
      ok(res, updated);
    } catch (e) {
      next(e);
    }
  },
);
