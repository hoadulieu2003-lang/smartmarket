import type { Scope } from '../types/express';
import { prisma } from './prisma';
import { forbidden } from './errors';

/** Danh sách market id trong scope. null = không giới hạn (super_admin). */
export async function marketIdsForScope(scope: Scope): Promise<string[] | null> {
  if ('all' in scope) return null;
  if ('marketIds' in scope) return scope.marketIds;
  const rows = await prisma.markets.findMany({
    where: { province_id: scope.provinceId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function assertMarketInScope(scope: Scope, marketId: string): Promise<void> {
  if ('all' in scope) return;
  if ('marketIds' in scope) {
    if (scope.marketIds.includes(marketId)) return;
    throw forbidden('PERM_OUT_OF_SCOPE', 'Chợ này không thuộc phạm vi quản lý của bạn');
  }
  const market = await prisma.markets.findUnique({
    where: { id: marketId },
    select: { province_id: true },
  });
  if (market && market.province_id === scope.provinceId) return;
  throw forbidden('PERM_OUT_OF_SCOPE', 'Chợ này không thuộc phạm vi quản lý của bạn');
}

/** Where fragment lọc theo market_id cho các bảng con (orders, stalls, complaints...). */
export async function marketFilter(scope: Scope, marketId?: string) {
  if (marketId) {
    await assertMarketInScope(scope, marketId);
    return { market_id: marketId };
  }
  const ids = await marketIdsForScope(scope);
  return ids === null ? {} : { market_id: { in: ids } };
}
