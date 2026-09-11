import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { prisma } from './shared/prisma';
import { auth, attachScope } from './middlewares/auth.middleware';
import { auditAdminWrites } from './middlewares/audit.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/request-logger.middleware';

// Routers
import { authRouter, usersMeRouter } from './modules/auth/auth.router';
import { catalogRouter, catalogAdminRouter } from './modules/catalog/catalog.router';
import { marketsRouter } from './modules/markets/markets.router';
import { marketsAdminRouter } from './modules/markets/markets.admin.router';
import { marketMapAdminRouter } from './modules/markets/market-map.admin.router';
import { marketMapPublicRouter } from './modules/markets/market-map.public.router';
import { stallsPublicRouter } from './modules/stalls/stalls.public.router';
import { zonesAdminRouter, stallsAdminRouter } from './modules/stalls/stalls.admin.router';
import { contractsAdminRouter } from './modules/contracts/contracts.admin.router';
import { applicationsRouter } from './modules/applications/applications.router';
import { applicationsAdminRouter } from './modules/applications/applications.admin.router';
import { tradersAdminRouter } from './modules/traders/traders.admin.router';
import { productsPublicRouter } from './modules/products/products.public.router';
import { sellerRouter } from './modules/products/products.seller.router';
import { productsAdminRouter } from './modules/products/products.admin.router';
import { ordersRouter, sellerOrdersRouter } from './modules/orders/orders.router';
import { ordersAdminRouter } from './modules/orders/orders.admin.router';
import { reviewsRouter } from './modules/reviews/reviews.router';
import { complaintsRouter } from './modules/complaints/complaints.router';
import { complaintsAdminRouter } from './modules/complaints/complaints.admin.router';
import { notificationsRouter } from './modules/notifications/notifications.router';
import { notificationsAdminRouter } from './modules/notifications/notifications.admin.router';
import { dashboardAdminRouter } from './modules/dashboard/dashboard.admin.router';
import { complianceAdminRouter } from './modules/compliance/compliance.admin.router';
import { reportsAdminRouter } from './modules/reports/reports.admin.router';
import { exportsAdminRouter } from './modules/exports/exports.admin.router';
import { settingsPublicRouter, settingsAdminRouter } from './modules/settings/settings.router';
import { usersAdminRouter } from './modules/users/users.admin.router';
import { uploadsRouter } from './modules/uploads/uploads.router';
import { auditsAdminRouter } from './modules/audits/audits.admin.router';
import { jobsAdminRouter } from './modules/jobs/jobs.admin.router';
import { operationsAdminRouter, tableQrPublicRouter, traceabilityPublicRouter } from './modules/operations/operations.admin.router';

export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(helmet());
  app.use(
    cors({
      origin: '*',
      credentials: false,
    }),
  );
  app.use(requestLogger);
  app.use(express.json({ limit: '2mb' }));

  // Health
  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.get('/readyz', async (_req, res) => {
    try {
      // A bare SELECT 1 cannot detect an application/DB schema drift. Reading one
      // users row forces Prisma to validate every scalar column required by auth.
      await prisma.users.findFirst();
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false });
    }
  });

  // Swagger UI — tài liệu API tại /docs
  try {
    const openapiPath = path.resolve(__dirname, '..', 'openapi.yaml');
    const spec = YAML.parse(fs.readFileSync(openapiPath, 'utf8'));
    app.get('/docs/openapi.json', (_req, res) => res.json(spec));
    app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(spec, {
        customSiteTitle: 'Smart Market API Docs',
        swaggerOptions: { persistAuthorization: true, docExpansion: 'none', tagsSorter: 'alpha' },
      }),
    );
  } catch (e) {
    console.error('Không nạp được openapi.yaml — /docs bị tắt', e);
  }

  const api = express.Router();
  app.use('/api/v1', api);

  // ===== Public/App =====
  api.use('/auth', authRouter);
  api.use('/users', usersMeRouter);
  api.use('/', catalogRouter); // /provinces, /categories
  api.use('/settings', settingsPublicRouter); // /settings/public
  api.use('/markets', marketMapPublicRouter);
  api.use('/markets', marketsRouter);
  api.use('/stalls', stallsPublicRouter);
  api.use('/products', productsPublicRouter);
  api.use('/orders', ordersRouter);
  api.use('/', reviewsRouter); // /reviews, /my/reviews
  api.use('/', complaintsRouter); // /complaints, /my/complaints
  api.use('/', applicationsRouter); // /merchant-applications, /my/merchant-application
  api.use('/notifications', notificationsRouter);
  api.use('/uploads', uploadsRouter);
  api.use('/trace', traceabilityPublicRouter);
  api.use('/table', tableQrPublicRouter);

  // ===== Seller =====
  api.use('/seller/orders', sellerOrdersRouter);
  api.use('/seller', sellerRouter); // /seller/stall, /seller/dashboard, /seller/products*

  // ===== Admin (CMS) =====
  const admin = express.Router();
  admin.use(auth, (req, _res, next) => next(), attachScope, auditAdminWrites);
  admin.use('/dashboard', dashboardAdminRouter);
  admin.use('/compliance', complianceAdminRouter);
  admin.use('/reports', reportsAdminRouter);
  admin.use('/exports', exportsAdminRouter);
  admin.use('/markets', marketsAdminRouter);
  admin.use('/', marketMapAdminRouter); // /admin/markets/:id/map-layout
  admin.use('/', zonesAdminRouter); // /admin/markets/:id/zones, /admin/zones/*
  admin.use('/stalls', stallsAdminRouter);
  admin.use('/', contractsAdminRouter); // /admin/stalls/:id/assign|unassign|contracts, /admin/contracts
  admin.use('/merchant-approvals', applicationsAdminRouter);
  admin.use('/traders', tradersAdminRouter);
  admin.use('/products', productsAdminRouter);
  admin.use('/orders', ordersAdminRouter);
  admin.use('/complaints', complaintsAdminRouter);
  admin.use('/notifications', notificationsAdminRouter);
  admin.use('/settings', settingsAdminRouter);
  admin.use('/users', usersAdminRouter);
  admin.use('/audits', auditsAdminRouter);
  admin.use('/', catalogAdminRouter); // /admin/provinces, /admin/categories
  admin.use('/jobs', jobsAdminRouter);
  admin.use('/operations', operationsAdminRouter);
  api.use('/admin', admin);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
