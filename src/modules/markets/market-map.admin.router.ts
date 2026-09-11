import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/prisma';
import { ok } from '../../shared/response';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles } from '../../middlewares/auth.middleware';
import { assertMarketInScope } from '../../shared/scope';
import { badRequest } from '../../shared/errors';
import * as map from './market-map.service';

export const marketMapAdminRouter = Router();

const idParam = z.object({ id: z.string().uuid() });
const floorParam = z.object({ id: z.string().uuid(), floorId: z.string().uuid() });
const revisionParam = z.object({ id: z.string().uuid(), revisionId: z.string().uuid() });

const CAN_EDIT = ['super_admin', 'market_manager'] as const;

// Legacy positions & drawings schemas for backwards compatibility
const position = z.object({
  stallId: z.string().uuid(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0.5).max(40),
  height: z.number().min(0.5).max(40),
  rotation: z.number().min(-360).max(360).default(0),
});

const drawing = z.object({
  kind: z.enum(['zone', 'path']),
  points: z.array(z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })).min(2).max(1000),
  label: z.string().trim().max(255).nullish(),
  strokeColor: z.string().trim().max(20).default('#138a52'),
  fillColor: z.string().trim().max(20).default('#138a5230'),
  strokeWidth: z.number().min(0.2).max(10).default(0.8),
}).superRefine((value, ctx) => {
  if (value.kind === 'zone' && value.points.length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Khu vực cần ít nhất 3 điểm' });
});

function asPositions(rows: any[]) {
  return rows.map((p) => ({
    id: p.id,
    stallId: p.stall_id,
    x: Number(p.x_percent),
    y: Number(p.y_percent),
    width: Number(p.width_percent),
    height: Number(p.height_percent),
    rotation: Number(p.rotation ?? 0),
  }));
}

function asDrawings(rows: any[]) {
  return rows.map((d) => ({
    id: d.id,
    kind: d.kind,
    points: d.points,
    label: d.label,
    strokeColor: d.stroke_color,
    fillColor: d.fill_color,
    strokeWidth: Number(d.stroke_width ?? 0.8),
  }));
}

/** GET /admin/markets/:id/map-layout - Overview sơ đồ hoặc dữ liệu legacy */
marketMapAdminRouter.get(
  '/markets/:id/map-layout',
  validate({ params: idParam, query: z.object({ legacy: z.coerce.boolean().optional() }) }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      if (req.query.legacy === 'true' || (req.query as any).legacy === true) {
        const [rows, drawings] = await Promise.all([
          prisma.market_map_positions.findMany({
            where: { market_id: req.params.id },
            orderBy: { created_at: 'asc' },
          }),
          prisma.market_map_drawings.findMany({ where: { market_id: req.params.id }, orderBy: { created_at: 'asc' } }),
        ]);
        return ok(res, { positions: asPositions(rows), drawings: asDrawings(drawings) });
      }
      ok(res, await map.getAdminMapOverview(req.params.id));
    } catch (e) {
      next(e);
    }
  },
);
/** GET /admin/markets/:id/map-layout/stalls - Danh sách sạp kèm trạng thái placement */
marketMapAdminRouter.get(
  '/markets/:id/map-layout/stalls',
  validate({
    params: idParam,
    query: z.object({
      search: z.string().trim().optional(),
      categoryId: z.string().uuid().optional(),
      zoneId: z.string().uuid().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.listMapStalls(req.params.id, req.query as any));
    } catch (e) {
      next(e);
    }
  },
);

/** GET /admin/markets/:id/floors/:floorId/layout - Chi tiết layout của 1 tầng */
marketMapAdminRouter.get(
  '/markets/:id/floors/:floorId/layout',
  validate({ params: floorParam }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.getMapFloor(req.params.id, req.params.floorId));
    } catch (e) {
      next(e);
    }
  },
);

/** PUT /admin/markets/:id/map-layout/draft - Lưu toàn bộ bản nháp sơ đồ */
marketMapAdminRouter.put(
  '/markets/:id/map-layout/draft',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam, body: z.record(z.unknown()) }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.saveMapDraft(req.params.id, req.body, req.user!.id));
    } catch (e) {
      next(e);
    }
  },
);

/** POST /admin/markets/:id/floors - Tạo thêm tầng mới */
marketMapAdminRouter.post(
  '/markets/:id/floors',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam, body: z.record(z.unknown()) }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.createMapFloor(req.params.id, req.body, req.user!.id));
    } catch (e) {
      next(e);
    }
  },
);

/** PUT /admin/markets/:id/floors/:floorId/layout - Cập nhật layout của 1 tầng */
marketMapAdminRouter.put(
  '/markets/:id/floors/:floorId/layout',
  requireRoles(...CAN_EDIT),
  validate({ params: floorParam, body: z.record(z.unknown()) }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.updateMapFloor(req.params.id, req.params.floorId, req.body, req.user!.id));
    } catch (e) {
      next(e);
    }
  },
);

/** PATCH /admin/markets/:id/floors/:floorId/rename - Đổi tên tầng */
marketMapAdminRouter.patch(
  '/markets/:id/floors/:floorId/rename',
  requireRoles(...CAN_EDIT),
  validate({ params: floorParam, body: z.record(z.unknown()) }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.renameMapFloor(req.params.id, req.params.floorId, req.body, req.user!.id));
    } catch (e) {
      next(e);
    }
  },
);

/** DELETE /admin/markets/:id/floors/:floorId - Xóa một tầng */
marketMapAdminRouter.delete(
  '/markets/:id/floors/:floorId',
  requireRoles(...CAN_EDIT),
  validate({ params: floorParam, body: z.record(z.unknown()).optional() }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.deleteMapFloor(req.params.id, req.params.floorId, req.body ?? {}, req.user!.id));
    } catch (e) {
      next(e);
    }
  },
);

/** PUT /admin/markets/:id/map-layout/entrance - Cập nhật vị trí cửa chính */
marketMapAdminRouter.put(
  '/markets/:id/map-layout/entrance',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam, body: z.record(z.unknown()) }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.setMapEntrance(req.params.id, req.body, req.user!.id));
    } catch (e) {
      next(e);
    }
  },
);

/** POST /admin/markets/:id/map-layout/auto - Tự động xếp các sạp chưa đặt */
marketMapAdminRouter.post(
  '/markets/:id/map-layout/auto',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      let expectedVersion = req.body?.expectedDraftVersion;
      if (expectedVersion === undefined) {
        const m = await prisma.markets.findUnique({
          where: { id: req.params.id },
          select: { map_layout_draft_version: true },
        });
        expectedVersion = m?.map_layout_draft_version ?? 0;
      }
      ok(res, await map.autoPlaceDraftStalls(req.params.id, expectedVersion, req.user!.id));
    } catch (e) {
      next(e);
    }
  },
);

/** POST /admin/markets/:id/map-layout/publish - Xuất bản sơ đồ */
marketMapAdminRouter.post(
  '/markets/:id/map-layout/publish',
  requireRoles(...CAN_EDIT),
  validate({ params: idParam, body: z.record(z.unknown()).optional() }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.publishMap(req.params.id, req.body ?? {}, req.user!.id));
    } catch (e) {
      next(e);
    }
  },
);

/** GET /admin/markets/:id/map-layout/revisions - Lịch sử xuất bản */
marketMapAdminRouter.get(
  '/markets/:id/map-layout/revisions',
  validate({ params: idParam }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.listMapRevisions(req.params.id));
    } catch (e) {
      next(e);
    }
  },
);

/** POST /admin/markets/:id/map-layout/revisions/:revisionId/restore - Khôi phục revision cũ */
marketMapAdminRouter.post(
  '/markets/:id/map-layout/revisions/:revisionId/restore',
  requireRoles(...CAN_EDIT),
  validate({ params: revisionParam, body: z.record(z.unknown()).optional() }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.restoreMapRevision(req.params.id, req.params.revisionId, req.body ?? {}));
    } catch (e) {
      next(e);
    }
  },
);

/** POST /admin/markets/:id/floors/:floorId/validate - Kiểm tra tính hợp lệ của tầng */
marketMapAdminRouter.post(
  '/markets/:id/floors/:floorId/validate',
  validate({ params: floorParam, body: z.record(z.unknown()) }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      ok(res, await map.validateMapFloor(req.params.id, req.params.floorId, req.body));
    } catch (e) {
      next(e);
    }
  },
);

/** PUT /admin/markets/:id/map-layout - Lưu bố cục (hỗ trợ legacy positions hoặc draft document) */
marketMapAdminRouter.put(
  '/markets/:id/map-layout',
  requireRoles(...CAN_EDIT),
  validate({
    params: idParam,
    body: z.object({
      positions: z.array(position).max(1000).optional(),
      drawings: z.array(drawing).max(200).optional(),
      expectedDraftVersion: z.number().int().min(0).optional(),
      document: z.record(z.unknown()).optional(),
    }).passthrough(),
  }),
  async (req, res, next) => {
    try {
      await assertMarketInScope(req.scope!, req.params.id);
      if (req.body.positions) {
        const input = req.body.positions as z.infer<typeof position>[];
        const stallIds = [...new Set(input.map((p) => p.stallId))];
        if (stallIds.length !== input.length) throw badRequest('Mỗi sạp chỉ được có một vị trí trên bản đồ');
        const stalls = await prisma.stalls.findMany({
          where: { id: { in: stallIds }, market_id: req.params.id },
          select: { id: true },
        });
        if (stalls.length !== stallIds.length) throw badRequest('Có sạp không thuộc chợ đang chọn');
        await prisma.$transaction(async (tx) => {
          await tx.market_map_positions.deleteMany({ where: { market_id: req.params.id } });
          if (input.length) {
            await tx.market_map_positions.createMany({
              data: input.map((p) => ({
                market_id: req.params.id,
                stall_id: p.stallId,
                x_percent: p.x,
                y_percent: p.y,
                width_percent: p.width,
                height_percent: p.height,
                rotation: p.rotation ?? 0,
              })),
            });
          }
          if (req.body.drawings !== undefined) {
            await tx.market_map_drawings.deleteMany({ where: { market_id: req.params.id } });
            if (req.body.drawings.length) {
              await tx.market_map_drawings.createMany({
                data: req.body.drawings.map((d: z.infer<typeof drawing>) => ({
                  market_id: req.params.id,
                  kind: d.kind,
                  points: d.points,
                  label: d.label ?? null,
                  stroke_color: d.strokeColor,
                  fill_color: d.fillColor,
                  stroke_width: d.strokeWidth,
                })),
              });
            }
          }
        });
        const [rows, drawings] = await Promise.all([
          prisma.market_map_positions.findMany({ where: { market_id: req.params.id }, orderBy: { created_at: 'asc' } }),
          prisma.market_map_drawings.findMany({ where: { market_id: req.params.id }, orderBy: { created_at: 'asc' } }),
        ]);
        return ok(res, { positions: asPositions(rows), drawings: asDrawings(drawings) });
      }
      ok(res, await map.saveMapDraft(req.params.id, req.body, req.user!.id));
    } catch (e) {
      next(e);
    }
  },
);
