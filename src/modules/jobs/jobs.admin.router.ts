import { Router } from 'express';
import { requireRoles } from '../../middlewares/auth.middleware';
import { ok } from '../../shared/response';
import { runContractExpiryJob } from '../../jobs/contract-expiry.job';
import { runMockPaymentExpiryJob } from '../../jobs/mock-payment-expiry.job';

export const jobsAdminRouter = Router(); // mount tại /admin/jobs

// Chạy tay job cảnh báo hợp đồng (SA) — phục vụ vận hành/test
jobsAdminRouter.post('/contract-expiry/run', requireRoles('super_admin'), async (_req, res, next) => {
  try {
    ok(res, await runContractExpiryJob());
  } catch (e) {
    next(e);
  }
});

jobsAdminRouter.post('/mock-payment-expiry/run', requireRoles('super_admin'), async (_req, res, next) => {
  try {
    ok(res, await runMockPaymentExpiryJob());
  } catch (e) {
    next(e);
  }
});
