import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/prisma';
import { ok } from '../../shared/response';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles } from '../../middlewares/auth.middleware';
import { badRequest, conflict, notFound } from '../../shared/errors';

const SA = requireRoles('super_admin');

/** Public: /provinces, /categories */
export const catalogRouter = Router();
/** Admin (mount dưới /admin, đã có auth+role SA ở router cha cho route ghi) */
export const catalogAdminRouter = Router();

/** Lọc category theo cấp: ?parentId=<id> → loại mặt hàng của ngành hàng đó; ?topLevel=true → chỉ ngành hàng cấp 1. */
function categoryFilter(query: Record<string, unknown>): { parent_id?: string | null } {
  const where: { parent_id?: string | null } = {};
  if (typeof query.parentId === 'string') where.parent_id = query.parentId;
  else if (query.topLevel === 'true') where.parent_id = null;
  return where;
}

/** parentId (nếu có) phải trỏ ngành hàng CẤP 1 và khác chính nó — hệ thống chỉ 2 cấp. */
async function assertValidParent(parentId: string | null | undefined, selfId?: string) {
  if (!parentId) return;
  if (selfId && parentId === selfId) throw badRequest('Ngành hàng không thể là cha của chính nó');
  const parent = await prisma.categories.findUnique({
    where: { id: parentId },
    select: { parent_id: true },
  });
  if (!parent) throw badRequest('Ngành hàng cha không tồn tại');
  if (parent.parent_id) throw badRequest('Chỉ hỗ trợ 2 cấp: ngành hàng cha phải là cấp 1');
}

catalogRouter.get('/provinces', async (_req, res, next) => {
  try {
    ok(res, await prisma.provinces.findMany({ orderBy: { name: 'asc' } }));
  } catch (e) {
    next(e);
  }
});

catalogRouter.get('/categories', async (req, res, next) => {
  try {
    ok(res, await prisma.categories.findMany({ where: categoryFilter(req.query), orderBy: { display_order: 'asc' } }));
  } catch (e) {
    next(e);
  }
});

// ===== Admin: provinces =====
const provinceBody = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(255),
});

catalogAdminRouter.get('/provinces', async (_req, res, next) => {
  try {
    const rows = await prisma.provinces.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { markets: true } } },
    });
    ok(res, rows.map(({ _count, ...p }) => ({ ...p, market_count: _count.markets })));
  } catch (e) {
    next(e);
  }
});

catalogAdminRouter.post('/provinces', SA, validate({ body: provinceBody }), async (req, res, next) => {
  try {
    ok(res, await prisma.provinces.create({ data: req.body }), 201);
  } catch (e) {
    next(e);
  }
});

catalogAdminRouter.put(
  '/provinces/:id',
  SA,
  validate({ params: z.object({ id: z.string().uuid() }), body: provinceBody.partial() }),
  async (req, res, next) => {
    try {
      ok(res, await prisma.provinces.update({ where: { id: req.params.id }, data: req.body }));
    } catch (e) {
      next(e);
    }
  },
);

catalogAdminRouter.delete(
  '/provinces/:id',
  SA,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      await prisma.provinces.delete({ where: { id: req.params.id } });
      ok(res, { message: 'Đã xóa tỉnh/thành' });
    } catch (e) {
      next(e);
    }
  },
);

// ===== Admin: categories =====
const categoryBody = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().max(2000).optional(),
  displayOrder: z.number().int().min(0).default(0),
  // null/không gửi = ngành hàng cấp 1; uuid = loại mặt hàng con của ngành hàng đó.
  parentId: z.string().uuid().nullish(),
});

catalogAdminRouter.get('/categories', async (req, res, next) => {
  try {
    ok(res, await prisma.categories.findMany({ where: categoryFilter(req.query), orderBy: { display_order: 'asc' } }));
  } catch (e) {
    next(e);
  }
});

catalogAdminRouter.post('/categories', SA, validate({ body: categoryBody }), async (req, res, next) => {
  try {
    const { displayOrder, parentId, ...rest } = req.body;
    await assertValidParent(parentId);
    ok(
      res,
      await prisma.categories.create({ data: { ...rest, display_order: displayOrder, parent_id: parentId ?? null } }),
      201,
    );
  } catch (e) {
    next(e);
  }
});

catalogAdminRouter.put(
  '/categories/:id',
  SA,
  validate({ params: z.object({ id: z.string().uuid() }), body: categoryBody.partial() }),
  async (req, res, next) => {
    try {
      const { displayOrder, parentId, ...rest } = req.body;
      if (parentId !== undefined) {
        await assertValidParent(parentId, req.params.id);
        if (parentId) {
          const childCount = await prisma.categories.count({ where: { parent_id: req.params.id } });
          if (childCount > 0)
            throw badRequest('Ngành hàng này đang có loại mặt hàng con — không thể chuyển thành cấp con');
        }
      }
      const row = await prisma.categories.update({
        where: { id: req.params.id },
        data: {
          ...rest,
          display_order: displayOrder,
          ...(parentId !== undefined ? { parent_id: parentId } : {}),
        },
      });
      ok(res, row);
    } catch (e) {
      next(e);
    }
  },
);

catalogAdminRouter.delete(
  '/categories/:id',
  SA,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const found = await prisma.categories.findUnique({ where: { id: req.params.id } });
      if (!found) throw notFound('Không tìm thấy ngành hàng');
      const childCount = await prisma.categories.count({ where: { parent_id: req.params.id } });
      if (childCount > 0)
        throw conflict('HAS_SUBCATEGORIES', 'Ngành hàng còn loại mặt hàng con — xóa các loại con trước');
      await prisma.categories.delete({ where: { id: req.params.id } });
      ok(res, { message: 'Đã xóa ngành hàng' });
    } catch (e) {
      next(e);
    }
  },
);
