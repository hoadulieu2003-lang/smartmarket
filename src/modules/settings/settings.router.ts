import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/prisma';
import { ok } from '../../shared/response';
import { validate } from '../../middlewares/validate.middleware';
import { requireRoles } from '../../middlewares/auth.middleware';
import { notFound } from '../../shared/errors';
import { getSetting, invalidateSetting, SETTING_KEYS } from '../../shared/settings';

export const settingsPublicRouter = Router(); // mount tại /settings
export const settingsAdminRouter = Router(); // mount tại /admin/settings

// GET /settings/public — subset an toàn cho app
settingsPublicRouter.get('/public', async (_req, res, next) => {
  try {
    const [units, months] = await Promise.all([
      getSetting<string[]>(SETTING_KEYS.productUnits, []),
      getSetting<number>(SETTING_KEYS.defaultDurationMonths, 24),
    ]);
    res.json({
      success: true,
      data: { product_units: units, contract_default_duration_months: months },
    });
  } catch (e) {
    next(e);
  }
});

// GET /admin/settings (SA)
settingsAdminRouter.get('/', requireRoles('super_admin'), async (_req, res, next) => {
  try {
    const rows = await prisma.app_settings.findMany({ orderBy: { key: 'asc' } });
    // Giữ nguyên value (không camelize nội dung setting)
    res.json({
      success: true,
      data: rows.map((r) => ({ id: r.id, key: r.key, value: r.value, description: r.description, updatedAt: r.updated_at })),
    });
  } catch (e) {
    next(e);
  }
});

const keyParam = z.object({ key: z.string().min(1).max(100) });

// GET /admin/settings/:key (mọi role CMS)
settingsAdminRouter.get('/:key', validate({ params: keyParam }), async (req, res, next) => {
  try {
    const row = await prisma.app_settings.findUnique({ where: { key: req.params.key } });
    if (!row) throw notFound('Không tìm thấy cấu hình');
    res.json({
      success: true,
      data: { id: row.id, key: row.key, value: row.value, description: row.description, updatedAt: row.updated_at },
    });
  } catch (e) {
    next(e);
  }
});

// PUT /admin/settings/:key (SA) — upsert
settingsAdminRouter.put(
  '/:key',
  requireRoles('super_admin'),
  validate({
    params: keyParam,
    body: z.object({ value: z.any(), description: z.string().max(500).optional() }),
  }),
  async (req, res, next) => {
    try {
      const row = await prisma.app_settings.upsert({
        where: { key: req.params.key },
        create: {
          key: req.params.key,
          value: req.body.value,
          description: req.body.description ?? req.params.key,
          updated_at: new Date(),
        },
        update: { value: req.body.value, description: req.body.description, updated_at: new Date() },
      });
      invalidateSetting(req.params.key);
      res.json({
        success: true,
        data: { id: row.id, key: row.key, value: row.value, description: row.description, updatedAt: row.updated_at },
      });
    } catch (e) {
      next(e);
    }
  },
);
