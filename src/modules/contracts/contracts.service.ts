import dayjs from 'dayjs';
import { prisma, Tx } from '../../shared/prisma';
import { badRequest, conflict, notFound } from '../../shared/errors';
import { getSetting, SETTING_KEYS } from '../../shared/settings';
import { notifyUsers } from '../../shared/notification.helper';
import { invalidateUserCache } from '../../middlewares/auth.middleware';

export type AssignInput = {
  stallId: string;
  merchantId: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  fee?: number;
  categoryId?: string | null;
  note?: string | null;
  createdBy: string;
};

/**
 * Gán sạp cho tiểu thương (dùng chung cho màn sạp hàng + duyệt hồ sơ).
 * Chạy TRONG transaction truyền vào. Trả về contract.
 */
export async function assignStallTx(tx: Tx, input: AssignInput) {
  const stall = await tx.stalls.findUnique({
    where: { id: input.stallId },
    include: { markets: { select: { id: true, name: true, status: true } } },
  });
  if (!stall) throw notFound('Không tìm thấy sạp');
  if (stall.status === 'occupied')
    throw conflict('STALL_OCCUPIED', 'Sạp đang có tiểu thương thuê — hãy kết thúc thuê trước');
  if (stall.status === 'maintenance')
    throw conflict('STATE_INVALID', 'Sạp đang bảo trì, không thể gán');

  const merchant = await tx.users.findUnique({ where: { id: input.merchantId } });
  if (!merchant || merchant.role !== 'user')
    throw badRequest('Tài khoản được gán không hợp lệ');
  if (merchant.merchant_status !== 'active')
    throw conflict('STATE_INVALID', 'Chỉ tiểu thương đã duyệt (đang hoạt động) mới được gán sạp'); // R5

  const existing = await tx.contracts.findFirst({
    where: { merchant_id: input.merchantId, ended_at: null },
  });
  if (existing)
    throw conflict('STATE_INVALID', 'Tiểu thương này đang thuê một sạp khác (MVP: 1 người 1 sạp)');

  const start = dayjs(input.startDate);
  if (!start.isValid()) throw badRequest('Ngày bắt đầu không hợp lệ');
  let end = input.endDate ? dayjs(input.endDate) : null;
  if (!end) {
    const months = await getSetting<number>(SETTING_KEYS.defaultDurationMonths, 24);
    end = start.add(months, 'month');
  }
  if (end.isBefore(start)) throw badRequest('Ngày hết hạn phải sau ngày bắt đầu'); // R11

  let contract;
  try {
    contract = await tx.contracts.create({
      data: {
        stall_id: stall.id,
        merchant_id: input.merchantId,
        start_date: start.toDate(),
        end_date: end.toDate(),
        fee: input.fee ?? 0,
        content: input.note ?? null,
        created_by: input.createdBy,
      },
    });
  } catch (e: any) {
    if (e?.code === 'P2002') throw conflict('STALL_OCCUPIED', 'Sạp vừa được gán cho người khác'); // R6 race
    throw e;
  }
  await tx.stalls.update({
    where: { id: stall.id },
    data: { status: 'occupied', category_id: input.categoryId ?? stall.category_id },
  });
  await tx.users.update({
    where: { id: input.merchantId },
    data: { merchant_market_id: stall.market_id },
  });
  await notifyUsers(tx, {
    userIds: [input.merchantId],
    marketId: stall.market_id,
    title: 'Bạn đã được gán sạp',
    content: `Bạn được gán sạp ${stall.code} tại ${stall.markets.name}. Thời hạn thuê đến ${end.format('DD/MM/YYYY')}.`,
    type: 'general',
    refType: 'stall',
    refId: stall.id,
  });
  invalidateUserCache(input.merchantId);
  return contract;
}

/** Kết thúc thuê sạp: end contract + sạp về vacant + ẩn sản phẩm. */
export async function unassignStall(stallId: string, reason: string, _byUserId: string) {
  return prisma.$transaction(async (tx) => {
    const contract = await tx.contracts.findFirst({
      where: { stall_id: stallId, ended_at: null },
      include: { stalls: { include: { markets: { select: { id: true, name: true } } } } },
    });
    if (!contract) throw conflict('STATE_INVALID', 'Sạp này không có hợp đồng đang hiệu lực');
    await tx.contracts.update({
      where: { id: contract.id },
      data: { ended_at: new Date(), end_reason: reason },
    });
    await tx.stalls.update({ where: { id: stallId }, data: { status: 'vacant' } });
    await tx.products.updateMany({
      where: { stall_id: stallId, deleted_at: null },
      data: { is_hidden: true },
    });
    await notifyUsers(tx, {
      userIds: [contract.merchant_id],
      marketId: contract.stalls.market_id,
      title: 'Hợp đồng thuê sạp đã kết thúc',
      content: `Hợp đồng thuê sạp ${contract.stalls.code} tại ${contract.stalls.markets.name} đã kết thúc. Lý do: ${reason}`,
      type: 'general',
      refType: 'stall',
      refId: stallId,
    });
    invalidateUserCache(contract.merchant_id);
    return contract;
  });
}
