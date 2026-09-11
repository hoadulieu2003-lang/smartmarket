import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { haversineKm } from '../../shared/distance';
import { finalPrice, isOnSale, withPricing } from '../../shared/pricing';
import { notFound } from '../../shared/errors';

const num = (v: any) => (v === null || v === undefined ? null : Number(v));

/** Thống kê cơ bản theo danh sách chợ. */
export async function marketStats(marketIds: string[]) {
  if (marketIds.length === 0) return new Map<string, any>();
  const [stallGroups, traders] = await Promise.all([
    prisma.stalls.groupBy({
      by: ['market_id', 'status'],
      where: { market_id: { in: marketIds } },
      _count: { _all: true },
    }),
    prisma.users.groupBy({
      by: ['merchant_market_id'],
      where: { merchant_market_id: { in: marketIds }, merchant_status: 'active' },
      _count: { _all: true },
    }),
  ]);
  const ratings = await marketRatings(marketIds);
  const map = new Map<string, any>();
  for (const id of marketIds)
    map.set(id, {
      stall_count: 0,
      occupied_stall_count: 0,
      vacant_stall_count: 0,
      trader_count: 0,
      rating_avg: ratings.get(id) ?? 0,
    });
  for (const g of stallGroups) {
    const s = map.get(g.market_id)!;
    s.stall_count += g._count._all;
    if (g.status === 'occupied') s.occupied_stall_count = g._count._all;
    if (g.status === 'vacant') s.vacant_stall_count = g._count._all;
  }
  for (const t of traders) {
    if (t.merchant_market_id) map.get(t.merchant_market_id)!.trader_count = t._count._all;
  }
  return map;
}

/** Điểm đánh giá trung bình theo chợ (weight theo review_count). */
async function marketRatings(marketIds: string[]) {
  const rows = await prisma.$queryRaw<{ market_id: string; rating: number | null }[]>`
    SELECT s.market_id,
           SUM(p.rating_avg * p.review_count) / NULLIF(SUM(p.review_count), 0) AS rating
    FROM products p
    JOIN stalls s ON s.id = p.stall_id
    WHERE s.market_id = ANY(${marketIds}::uuid[]) AND p.deleted_at IS NULL
    GROUP BY s.market_id`;
  return new Map(rows.map((r) => [r.market_id, r.rating ? Math.round(Number(r.rating) * 10) / 10 : 0]));
}

/** Rating + số sản phẩm + có khuyến mãi theo danh sách sạp. */
export async function stallAggregates(stallIds: string[]) {
  const map = new Map<
    string,
    { rating_avg: number; review_count: number; product_count: number; has_promotion: boolean }
  >();
  if (stallIds.length === 0) return map;
  const rows = await prisma.$queryRaw<
    { stall_id: string; rating: number | null; reviews: bigint; products: bigint; promos: bigint }[]
  >`
    SELECT p.stall_id,
           SUM(p.rating_avg * p.review_count) / NULLIF(SUM(p.review_count), 0) AS rating,
           COALESCE(SUM(p.review_count), 0)::bigint AS reviews,
           COUNT(*) FILTER (WHERE p.is_hidden = false)::bigint AS products,
           COUNT(*) FILTER (
             WHERE p.is_hidden = false AND p.discount_type IS NOT NULL
               AND (p.discount_start_at IS NULL OR p.discount_start_at <= now())
               AND (p.discount_end_at IS NULL OR p.discount_end_at >= now())
           )::bigint AS promos
    FROM products p
    WHERE p.stall_id = ANY(${stallIds}::uuid[]) AND p.deleted_at IS NULL
    GROUP BY p.stall_id`;
  for (const id of stallIds)
    map.set(id, { rating_avg: 0, review_count: 0, product_count: 0, has_promotion: false });
  for (const r of rows) {
    map.set(r.stall_id, {
      rating_avg: r.rating ? Math.round(Number(r.rating) * 10) / 10 : 0,
      review_count: Number(r.reviews),
      product_count: Number(r.products),
      has_promotion: Number(r.promos) > 0,
    });
  }
  return map;
}

export async function nearbyMarkets(lat: number, lng: number, limit: number) {
  const markets = await prisma.markets.findMany({
    where: { status: 'active', latitude: { not: null }, longitude: { not: null } },
    include: { provinces: { select: { id: true, name: true } } },
  });
  const withDist = markets
    .map((m) => ({
      ...m,
      distance_km:
        Math.round(haversineKm(lat, lng, Number(m.latitude), Number(m.longitude)) * 10) / 10,
    }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);
  const stats = await marketStats(withDist.map((m) => m.id));
  return withDist.map((m) => ({ ...m, ...stats.get(m.id) }));
}

export async function listMarkets(q: {
  provinceId?: string;
  search?: string;
  page: number;
  limit: number;
}) {
  const where: Prisma.marketsWhereInput = {
    status: 'active',
    province_id: q.provinceId,
    ...(q.search
      ? { OR: [{ name: { contains: q.search, mode: 'insensitive' } }, { address: { contains: q.search, mode: 'insensitive' } }] }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.markets.count({ where }),
    prisma.markets.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: { provinces: { select: { id: true, name: true } } },
    }),
  ]);
  const stats = await marketStats(rows.map((m) => m.id));
  return { total, rows: rows.map((m) => ({ ...m, ...stats.get(m.id) })) };
}

export async function marketDetail(id: string) {
  const market = await prisma.markets.findUnique({
    where: { id },
    include: { provinces: { select: { id: true, name: true } } },
  });
  if (!market || market.status !== 'active') throw notFound('Chợ không tồn tại hoặc đã ngừng hoạt động');
  const [stats, zoneCount] = await Promise.all([
    marketStats([id]),
    prisma.zones.count({ where: { market_id: id, is_active: true } }),
  ]);
  return { ...market, ...stats.get(id), zone_count: zoneCount };
}

/** Danh sách tiểu thương (sạp đang kinh doanh) trong chợ — cho app. */
export async function marketTraders(
  marketId: string,
  q: {
    categoryId?: string;
    zoneId?: string;
    hasPromotion?: boolean;
    minRating?: number;
    search?: string;
    page: number;
    limit: number;
  },
) {
  const market = await prisma.markets.findUnique({ where: { id: marketId } });
  if (!market || market.status !== 'active') throw notFound('Chợ không tồn tại hoặc đã ngừng hoạt động');
  const where: Prisma.stallsWhereInput = {
    market_id: marketId,
    status: 'occupied',
    category_id: q.categoryId,
    zone_id: q.zoneId,
    ...(q.search ? { OR: [{ name: { contains: q.search, mode: 'insensitive' } }, { code: { contains: q.search, mode: 'insensitive' } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.stalls.count({ where }),
    prisma.stalls.findMany({
      where,
      orderBy: [{ display_order: 'asc' }],
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: {
        zones: { select: { id: true, code: true, name: true } },
        categories: { select: { id: true, name: true } },
        contracts: {
          where: { ended_at: null },
          take: 1,
          include: { users_contracts_merchant_idTousers: { select: { id: true, full_name: true, avatar: true } } },
        },
      },
    }),
  ]);
  const aggs = await stallAggregates(rows.map((r) => r.id));
  let list = rows.map(({ contracts, ...s }) => ({
    ...s,
    merchant: contracts[0]?.users_contracts_merchant_idTousers ?? null,
    ...aggs.get(s.id),
  }));
  if (q.hasPromotion) list = list.filter((s) => s.has_promotion);
  if (q.minRating) list = list.filter((s) => (s.rating_avg ?? 0) >= q.minRating!);
  return { total, rows: list };
}

/** Dữ liệu trang chủ theo chợ. */
export async function marketHome(marketId: string) {
  const market = await prisma.markets.findUnique({ where: { id: marketId } });
  if (!market || market.status !== 'active') throw notFound('Chợ không tồn tại hoặc đã ngừng hoạt động');
  const now = new Date();
  const visible: Prisma.productsWhereInput = {
    deleted_at: null,
    is_hidden: false,
    stalls: { market_id: marketId, status: 'occupied' },
  };
  const [topProducts, saleCandidates, occupiedStalls] = await Promise.all([
    prisma.products.findMany({
      where: visible,
      orderBy: [{ review_count: 'desc' }, { rating_avg: 'desc' }],
      take: 10,
      include: {
        stalls: { select: { id: true, name: true, code: true } },
        traceability: { select: { id: true } },
      },
    }),
    prisma.products.findMany({
      where: {
        ...visible,
        discount_type: { not: null },
        AND: [
          { OR: [{ discount_start_at: null }, { discount_start_at: { lte: now } }] },
          { OR: [{ discount_end_at: null }, { discount_end_at: { gte: now } }] },
        ],
      },
      orderBy: { updated_at: 'desc' },
      take: 10,
      include: {
        stalls: { select: { id: true, name: true, code: true } },
        traceability: { select: { id: true } },
      },
    }),
    prisma.stalls.findMany({
      where: { market_id: marketId, status: 'occupied' },
      select: { id: true, name: true, code: true, images: true },
    }),
  ]);
  const aggs = await stallAggregates(occupiedStalls.map((s) => s.id));
  const featuredTraders = occupiedStalls
    .map((s) => ({ ...s, ...aggs.get(s.id) }))
    .sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0) || (b.review_count ?? 0) - (a.review_count ?? 0))
    .slice(0, 10);
  return {
    featured_traders: featuredTraders,
    featured_products: topProducts.map(({ traceability, ...product }) => ({
      ...withPricing(product, now),
      has_traceability: !!traceability,
    })),
    sale_products: saleCandidates
      .filter((p) => isOnSale(p, now))
      .map(({ traceability, ...product }) => ({
        ...withPricing(product, now),
        has_traceability: !!traceability,
      })),
  };
}

export const marketNum = num;
export { finalPrice };
