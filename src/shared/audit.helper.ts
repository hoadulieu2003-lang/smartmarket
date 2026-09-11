import { prisma } from './prisma';

/** Ghi audit — không bao giờ làm fail request chính. */
export function writeAudit(args: {
  userId?: string | null;
  action: string;
  tableName?: string | null;
  recordId?: string | null;
  description?: string | null;
  ip?: string | null;
}) {
  prisma.system_audits
    .create({
      data: {
        user_id: args.userId ?? null,
        action: args.action.slice(0, 100),
        table_name: args.tableName ?? null,
        record_id: args.recordId ?? null,
        description: args.description ?? null,
        ip_address: args.ip ?? null,
      },
    })
    .catch((e) => console.error('audit_write_failed', e.message));
}
