import type {
  notification_priority,
  notification_target,
  notification_type,
} from '@prisma/client';
import { prisma, Tx } from './prisma';

type Db = Tx | typeof prisma;

export type CreateNotificationInput = {
  marketId?: string | null;
  createdBy?: string | null;
  title: string;
  content: string;
  type: notification_type;
  priority?: notification_priority;
  targetType: notification_target;
  targetId?: string | null;
  attachment?: string | null;
  refType?: string | null;
  refId?: string | null;
  send?: boolean;
  /** Ghi đè danh sách người nhận (dùng cho thông báo hệ thống gửi nhiều người). */
  recipientUserIds?: string[];
};

/** Resolve danh sách user nhận theo target (PRD 10.12). */
export async function resolveRecipients(
  db: Db,
  targetType: notification_target,
  targetId: string | null | undefined,
  marketId: string | null | undefined,
): Promise<string[]> {
  if (targetType === 'user') return targetId ? [targetId] : [];
  if (!marketId) return [];
  if (targetType === 'market') {
    const rows = await db.contracts.findMany({
      where: { ended_at: null, stalls: { market_id: marketId } },
      select: { merchant_id: true },
      distinct: ['merchant_id'],
    });
    return rows.map((r) => r.merchant_id);
  }
  if (targetType === 'zone') {
    const rows = await db.contracts.findMany({
      where: { ended_at: null, stalls: { market_id: marketId, zone_id: targetId ?? undefined } },
      select: { merchant_id: true },
      distinct: ['merchant_id'],
    });
    return rows.map((r) => r.merchant_id);
  }
  // category: tiểu thương trong chợ có ngành hàng = targetId
  const rows = await db.users.findMany({
    where: {
      merchant_market_id: marketId,
      merchant_category_id: targetId ?? undefined,
      merchant_status: 'active',
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** Tạo thông báo (+fan-out nếu send). Gọi trong cùng transaction với nghiệp vụ gốc. */
export async function createNotification(db: Db, input: CreateNotificationInput) {
  const send = input.send !== false;
  const noti = await db.notifications.create({
    data: {
      market_id: input.marketId ?? null,
      created_by: input.createdBy ?? null,
      title: input.title,
      content: input.content,
      type: input.type,
      priority: input.priority ?? 'normal',
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      attachment: input.attachment ?? null,
      ref_type: input.refType ?? null,
      ref_id: input.refId ?? null,
      sent_at: send ? new Date() : null,
    },
  });
  if (send) {
    const userIds =
      input.recipientUserIds ??
      (await resolveRecipients(db, input.targetType, input.targetId, input.marketId));
    const unique = [...new Set(userIds)];
    // Fan-out theo lô 500
    for (let i = 0; i < unique.length; i += 500) {
      await db.notification_recipients.createMany({
        data: unique.slice(i, i + 500).map((user_id) => ({ notification_id: noti.id, user_id })),
        skipDuplicates: true,
      });
    }
  }
  return noti;
}

/** Thông báo hệ thống gửi đích danh 1..n user. */
export async function notifyUsers(
  db: Db,
  args: {
    userIds: string[];
    marketId?: string | null;
    title: string;
    content: string;
    type: notification_type;
    priority?: notification_priority;
    refType?: string | null;
    refId?: string | null;
  },
) {
  const unique = [...new Set(args.userIds)].filter(Boolean);
  if (unique.length === 0) return null;
  return createNotification(db, {
    marketId: args.marketId ?? null,
    title: args.title,
    content: args.content,
    type: args.type,
    priority: args.priority,
    targetType: 'user',
    targetId: unique.length === 1 ? unique[0] : null,
    refType: args.refType,
    refId: args.refId,
    send: true,
    recipientUserIds: unique,
  });
}

/** User id của các quản lý chợ (để báo hồ sơ mới, phản ánh mới...). */
export async function marketManagerIds(db: Db, marketId: string): Promise<string[]> {
  const rows = await db.market_managers.findMany({
    where: { market_id: marketId },
    select: { user_id: true },
  });
  return rows.map((r) => r.user_id);
}
