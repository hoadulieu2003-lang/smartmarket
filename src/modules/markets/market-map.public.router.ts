import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';
import { ok } from '../../shared/response';
import * as map from './market-map.service';

export const marketMapPublicRouter = Router();

const marketParam = z.object({ marketId: z.string().uuid() });
const floorParam = marketParam.extend({ revisionId: z.string().uuid(), floorId: z.string().uuid() });
const searchParam = marketParam.extend({ revisionId: z.string().uuid() });

marketMapPublicRouter.get('/:marketId/map-layout', validate({ params: marketParam }), async (req, res, next) => {
  try {
    ok(res, await map.getPublicMapMetadata(req.params.marketId));
  } catch (error) { next(error); }
});

marketMapPublicRouter.get('/:marketId/map-layout/revisions/:revisionId/floors/:floorId', validate({ params: floorParam }), async (req, res, next) => {
  try {
    ok(res, await map.getPublicMapFloor(req.params.marketId, req.params.revisionId, req.params.floorId));
  } catch (error) { next(error); }
});

marketMapPublicRouter.get(
  '/:marketId/map-layout/revisions/:revisionId/search',
  validate({ params: searchParam, query: z.object({ q: z.string().trim().min(1).max(100) }) }),
  async (req, res, next) => {
    try {
      ok(res, await map.searchPublicMap(req.params.marketId, req.params.revisionId, String(req.query.q)));
    } catch (error) { next(error); }
  },
);
