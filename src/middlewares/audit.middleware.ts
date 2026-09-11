import type { NextFunction, Request, Response } from 'express';
import { writeAudit } from '../shared/audit.helper';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Tự ghi system_audits cho các thao tác ghi dưới /admin/* (sau khi response thành công). */
export function auditAdminWrites(req: Request, res: Response, next: NextFunction) {
  if (!WRITE_METHODS.has(req.method)) return next();
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const path = req.originalUrl.split('?')[0];
      const seg = path.split('/').filter(Boolean); // api,v1,admin,<resource>,...
      const resource = seg[3] ?? 'unknown';
      const uuidInPath = seg.find((s) => /^[0-9a-f-]{36}$/i.test(s)) ?? null;
      writeAudit({
        userId: req.user?.id,
        action: `${req.method} ${path}`.slice(0, 100),
        tableName: resource,
        recordId: uuidInPath,
        description: `Thao tác quản trị: ${req.method} ${path}`,
        ip: req.ip,
      });
    }
  });
  next();
}
