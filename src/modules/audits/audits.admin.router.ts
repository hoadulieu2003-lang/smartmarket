import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';

export const auditsAdminRouter = Router(); // mount tại /admin/audits

/**
 * SA xem tất cả; PA/MM chỉ xem thao tác của chính mình
 * (audit không gắn market nên không scope theo chợ được — ghi chú PRD 10.16).
 */
auditsAdminRouter.get(
  '/',
  validate({
    query: pageQuery.extend({
      tableName: z.string().max(100).optional(),
      recordId: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const me = req.user!;
      const where: Prisma.system_auditsWhereInput = {
        table_name: q.tableName,
        record_id: q.recordId,
        user_id: me.role === 'super_admin' ? q.userId : me.id,
        ...(q.from || q.to ? { created_at: { gte: q.from, lte: q.to } } : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.system_audits.count({ where }),
        prisma.system_audits.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: { users: { select: { id: true, full_name: true, role: true } } },
        }),
      ]);
      paginated(
        res,
        rows.map(({ users, ...a }) => ({ ...a, actor: users })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);
