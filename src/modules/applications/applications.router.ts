import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/prisma';
import { ok } from '../../shared/response';
import { validate } from '../../middlewares/validate.middleware';
import { auth, requireRoles } from '../../middlewares/auth.middleware';
import { conflict, notFound, badRequest } from '../../shared/errors';
import { marketManagerIds, notifyUsers } from '../../shared/notification.helper';

/** App-side: /merchant-applications + /my/merchant-application — auth theo từng route. */
export const applicationsRouter = Router();
const appGuard = [auth, requireRoles('user')] as const;

const docArr = z.array(z.object({ url: z.string().url() })).min(1, 'Cần tối thiểu 1 ảnh giấy tờ');
const phoneRegex = /^0\d{9}$/;

const applyBody = z.object({
  marketId: z.string().uuid(),
  categoryId: z.string().uuid().nullish(),
  fullName: z.string().trim().min(1).max(255),
  phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  idNumber: z.string().trim().min(9).max(20),
  businessDescription: z.string().max(5000).nullish(),
  desiredStallNote: z.string().max(2000).nullish(),
  documents: docArr,
});
const updateBody = applyBody
  .omit({ marketId: true })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Cần cập nhật ít nhất một thông tin trong hồ sơ');

const OPEN_STATUSES = ['pending', 'reviewing', 'need_more_info'] as const;
const EDITABLE_STATUSES = ['need_more_info', 'rejected'] as const;

// POST /merchant-applications
applicationsRouter.post('/merchant-applications', ...appGuard, validate({ body: applyBody }), async (req, res, next) => {
  try {
    const user = req.user!;
    if (user.merchant_status === 'active')
      throw conflict('APPLICATION_EXISTS', 'Bạn đã là tiểu thương, không cần gửi hồ sơ');
    const latest = await prisma.merchant_applications.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
    });
    if (latest && OPEN_STATUSES.includes(latest.status as any))
      throw conflict('APPLICATION_EXISTS', 'Bạn đang có hồ sơ chờ xử lý, không thể gửi hồ sơ mới');
    if (latest?.status === 'rejected')
      throw conflict(
        'APPLICATION_RESUBMIT_REQUIRED',
        'Hồ sơ gần nhất đã bị từ chối. Vui lòng chỉnh sửa và gửi lại hồ sơ cũ',
      );
    const market = await prisma.markets.findUnique({ where: { id: req.body.marketId } });
    if (!market || market.status !== 'active') throw badRequest('Chợ không tồn tại hoặc đã ngừng hoạt động');

    const app = await prisma.$transaction(async (tx) => {
      const created = await tx.merchant_applications.create({
        data: {
          user_id: user.id,
          market_id: req.body.marketId,
          category_id: req.body.categoryId ?? null,
          full_name: req.body.fullName,
          phone: req.body.phone,
          id_number: req.body.idNumber,
          business_description: req.body.businessDescription ?? null,
          desired_stall_note: req.body.desiredStallNote ?? null,
          documents: req.body.documents,
          status: 'pending',
        },
      });
      const managers = await marketManagerIds(tx, market.id);
      await notifyUsers(tx, {
        userIds: managers,
        marketId: market.id,
        title: 'Hồ sơ đăng ký tiểu thương mới',
        content: `${req.body.fullName} vừa gửi hồ sơ đăng ký kinh doanh tại ${market.name}.`,
        type: 'application',
        refType: 'merchant_application',
        refId: created.id,
      });
      return created;
    });
    ok(res, app, 201);
  } catch (e) {
    next(e);
  }
});

// GET /my/merchant-application
applicationsRouter.get('/my/merchant-application', ...appGuard, async (req, res, next) => {
  try {
    const apps = await prisma.merchant_applications.findMany({
      where: { user_id: req.user!.id },
      orderBy: { created_at: 'desc' },
      include: { markets: { select: { id: true, name: true } }, categories: { select: { id: true, name: true } } },
    });
    if (apps.length === 0) return ok(res, { current: null, history: [] });
    const [current, ...history] = apps;
    ok(res, { current, history });
  } catch (e) {
    next(e);
  }
});

// PUT /my/merchant-application — bổ sung hoặc sửa hồ sơ bị từ chối → quay về pending trên cùng ID
applicationsRouter.put(
  '/my/merchant-application',
  ...appGuard,
  validate({ body: updateBody }),
  async (req, res, next) => {
    try {
      const latest = await prisma.merchant_applications.findFirst({
        where: { user_id: req.user!.id },
        orderBy: { created_at: 'desc' },
        include: { markets: { select: { id: true, name: true } } },
      });
      if (!latest) throw notFound('Bạn chưa có hồ sơ nào');
      if (!EDITABLE_STATUSES.includes(latest.status as any))
        throw conflict(
          'STATE_INVALID',
          'Chỉ được cập nhật hồ sơ khi được yêu cầu bổ sung hoặc hồ sơ đã bị từ chối',
        );
      const b = req.body;
      const previousStatus = latest.status;
      const app = await prisma.$transaction(async (tx) => {
        const updated = await tx.merchant_applications.update({
          where: { id: latest.id },
          data: {
            category_id: b.categoryId,
            full_name: b.fullName,
            phone: b.phone,
            id_number: b.idNumber,
            business_description: b.businessDescription,
            desired_stall_note: b.desiredStallNote,
            documents: b.documents,
            status: 'pending',
            reviewed_by: null,
            reviewed_at: null,
          },
        });
        const managers = await marketManagerIds(tx, latest.market_id);
        await notifyUsers(tx, {
          userIds: managers,
          marketId: latest.market_id,
          title: previousStatus === 'rejected'
            ? 'Hồ sơ tiểu thương được chỉnh sửa và gửi lại'
            : 'Hồ sơ tiểu thương đã được bổ sung',
          content: `${updated.full_name} đã ${previousStatus === 'rejected' ? 'chỉnh sửa' : 'bổ sung'} và gửi lại hồ sơ đăng ký tại ${latest.markets.name}.`,
          type: 'application',
          refType: 'merchant_application',
          refId: updated.id,
        });
        return updated;
      });
      ok(res, app);
    } catch (e) {
      next(e);
    }
  },
);

// POST /my/merchant-application/cancel
applicationsRouter.post('/my/merchant-application/cancel', ...appGuard, async (req, res, next) => {
  try {
    const latest = await prisma.merchant_applications.findFirst({
      where: { user_id: req.user!.id },
      orderBy: { created_at: 'desc' },
    });
    if (!latest) throw notFound('Bạn chưa có hồ sơ nào');
    if (!OPEN_STATUSES.includes(latest.status as any))
      throw conflict('STATE_INVALID', 'Hồ sơ đã được xử lý, không thể hủy');
    const app = await prisma.merchant_applications.update({
      where: { id: latest.id },
      data: { status: 'cancelled' },
    });
    ok(res, app);
  } catch (e) {
    next(e);
  }
});
