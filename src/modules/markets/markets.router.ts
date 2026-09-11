import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';
import { auth } from '../../middlewares/auth.middleware';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import * as svc from './markets.service';
import { assertZaloIdentity, decodeZaloLocation } from '../../shared/zalo.client';

export const marketsRouter = Router();

marketsRouter.post(
  '/nearby',
  validate({
    body: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      limit: z.number().int().min(1).max(50).default(10),
    }),
  }),
  async (req, res, next) => {
    try {
      ok(res, await svc.nearbyMarkets(req.body.latitude, req.body.longitude, req.body.limit));
    } catch (e) {
      next(e);
    }
  },
);

marketsRouter.post(
  '/nearby/zalo',
  auth,
  validate({
    body: z.object({
      locationToken: z.string().min(1),
      accessToken: z.string().min(1),
      limit: z.number().int().min(1).max(50).default(10),
    }),
  }),
  async (req, res, next) => {
    try {
      await assertZaloIdentity(req.body.accessToken, req.user!.zalo_id);
      const location = await decodeZaloLocation(req.body.accessToken, req.body.locationToken);
      ok(res, await svc.nearbyMarkets(location.latitude, location.longitude, req.body.limit));
    } catch (e) {
      next(e);
    }
  },
);

marketsRouter.get(
  '/',
  validate({
    query: pageQuery.extend({
      provinceId: z.string().uuid().optional(),
      search: z.string().trim().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const { total, rows } = await svc.listMarkets(q);
      paginated(res, rows, { page: q.page, limit: q.limit, total });
    } catch (e) {
      next(e);
    }
  },
);

const idParam = z.object({ id: z.string().uuid() });

marketsRouter.get('/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    ok(res, await svc.marketDetail(req.params.id));
  } catch (e) {
    next(e);
  }
});

marketsRouter.get(
  '/:id/traders',
  validate({
    params: idParam,
    query: pageQuery.extend({
      categoryId: z.string().uuid().optional(),
      zoneId: z.string().uuid().optional(),
      hasPromotion: z.coerce.boolean().optional(),
      minRating: z.coerce.number().min(0).max(5).optional(),
      search: z.string().trim().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const { total, rows } = await svc.marketTraders(req.params.id, q);
      paginated(res, rows, { page: q.page, limit: q.limit, total });
    } catch (e) {
      next(e);
    }
  },
);

marketsRouter.get('/:id/home', validate({ params: idParam }), async (req, res, next) => {
  try {
    ok(res, await svc.marketHome(req.params.id));
  } catch (e) {
    next(e);
  }
});
