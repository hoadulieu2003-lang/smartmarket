import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { prisma } from '../../shared/prisma';
import { getSetting, SETTING_KEYS } from '../../shared/settings';

export type DisplayStatus =
  | 'vacant'
  | 'occupied'
  | 'maintenance'
  | 'reserved'
  | 'expiring_soon'
  | 'has_complaint';

/**
 * Enrich danh sách sạp với hợp đồng hiệu lực + displayStatus (PRD 7.4):
 * has_complaint > expiring_soon > trạng thái gốc.
 */
export async function enrichStalls<T extends { id: string; status: string }>(stalls: T[]) {
  if (stalls.length === 0) return [] as (T & any)[];
  const ids = stalls.map((s) => s.id);
  const threshold = await getSetting<number>(SETTING_KEYS.expiryWarningDays, 30);
  const [contracts, openComplaints] = await Promise.all([
    prisma.contracts.findMany({
      where: { stall_id: { in: ids }, ended_at: null },
      include: {
        users_contracts_merchant_idTousers: {
          select: { id: true, full_name: true, phone: true, avatar: true, merchant_status: true },
        },
      },
    }),
    prisma.complaints.groupBy({
      by: ['stall_id'],
      where: { stall_id: { in: ids }, status: { in: ['new', 'processing', 'escalated'] } },
      _count: { _all: true },
    }),
  ]);
  const contractMap = new Map(contracts.map((c) => [c.stall_id, c]));
  const complaintMap = new Map(
    openComplaints.filter((c) => c.stall_id).map((c) => [c.stall_id as string, c._count._all]),
  );
  const today = dayjs().startOf('day');
  return stalls.map((s) => {
    const contract = contractMap.get(s.id) ?? null;
    const openCount = complaintMap.get(s.id) ?? 0;
    let display: DisplayStatus = s.status as DisplayStatus;
    let daysLeft: number | null = null;
    if (contract?.end_date) {
      daysLeft = dayjs(contract.end_date).diff(today, 'day');
    }
    if (s.status === 'occupied') {
      if (openCount > 0) display = 'has_complaint';
      else if (daysLeft !== null && daysLeft <= threshold) display = 'expiring_soon';
    }
    return {
      ...s,
      display_status: display,
      open_complaint_count: openCount,
      current_contract: contract
        ? {
            id: contract.id,
            start_date: contract.start_date,
            end_date: contract.end_date,
            days_left: daysLeft,
            fee: contract.fee,
            merchant: contract.users_contracts_merchant_idTousers,
          }
        : null,
    };
  });
}

/** Sinh mã sạp hàng loạt. */
export function buildBulkCodes(args: {
  prefix: string;
  startNumber: number;
  count: number;
  digits: number;
  separator: string;
}) {
  const codes: string[] = [];
  for (let i = 0; i < args.count; i++) {
    const n = String(args.startNumber + i).padStart(args.digits, '0');
    codes.push(`${args.prefix}${args.separator}${n}`);
  }
  return codes;
}

/** Filter buyer-visible cho products (dùng chung nhiều module). */
export const visibleProductWhere = (extra?: Prisma.productsWhereInput): Prisma.productsWhereInput => ({
  deleted_at: null,
  is_hidden: false,
  stalls: { status: 'occupied', markets: { status: 'active' } },
  ...extra,
});
