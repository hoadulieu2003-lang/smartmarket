import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';
import { pageQuery } from '../../shared/pagination';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { assertMarketInScope, marketFilter, marketIdsForScope } from '../../shared/scope';

export const traceabilityAdminRouter = Router(); // mount tại /admin/traceability

const marketQuery = z.object({ marketId: z.string().uuid().optional() });
const UNCATEGORIZED = 'uncategorized';
const categoryQuery = z.union([z.string().uuid(), z.literal(UNCATEGORIZED)]).optional();

async function scopedMarketIds(req: any, marketId?: string) {
  let marketIds = await marketIdsForScope(req.scope);
  if (marketId) {
    await assertMarketInScope(req.scope, marketId);
    marketIds = [marketId];
  }
  return marketIds;
}

function merchantMarketWhere(marketIds: string[] | null): Prisma.usersWhereInput {
  return marketIds
    ? { merchant_market_id: { in: marketIds } }
    : { merchant_market_id: { not: null } };
}

function ratio(traceable: number, total: number) {
  return total ? Math.round((traceable / total) * 1000) / 10 : 0;
}

// GET /admin/traceability/summary — KPI và tỷ lệ truy xuất theo ngành hàng.
traceabilityAdminRouter.get(
  '/summary',
  validate({ query: marketQuery }),
  async (req, res, next) => {
    try {
      const marketId = req.query.marketId as string | undefined;
      const [marketIds, stallScope] = await Promise.all([
        scopedMarketIds(req, marketId),
        marketFilter(req.scope!, marketId),
      ]);
      const merchantWhere: Prisma.usersWhereInput = {
        role: 'user',
        merchant_status: { not: null },
        ...merchantMarketWhere(marketIds),
      };
      const productWhere: Prisma.productsWhereInput = {
        deleted_at: null,
        stalls: stallScope,
      };
      const traceableWhere: Prisma.productsWhereInput = {
        ...productWhere,
        traceability: { isNot: null },
      };

      const [merchants, stalls, productGroups, traceableProductGroups, traceableOwners] =
        await Promise.all([
          prisma.users.findMany({
            where: merchantWhere,
            select: { id: true, merchant_category_id: true },
          }),
          prisma.stalls.findMany({
            where: stallScope,
            select: { id: true, category_id: true },
          }),
          prisma.products.groupBy({
            by: ['stall_id'],
            where: productWhere,
            _count: { _all: true },
          }),
          prisma.products.groupBy({
            by: ['stall_id'],
            where: traceableWhere,
            _count: { _all: true },
          }),
          prisma.products.findMany({
            where: { ...traceableWhere, owner_merchant_id: { not: null } },
            distinct: ['owner_merchant_id'],
            select: { owner_merchant_id: true },
          }),
        ]);

      const traceableOwnerIds = new Set(
        traceableOwners
          .map((row) => row.owner_merchant_id)
          .filter((id): id is string => Boolean(id)),
      );
      const merchantByCategory = new Map<string, { total: number; traceable: number }>();
      for (const merchant of merchants) {
        const categoryId = merchant.merchant_category_id ?? UNCATEGORIZED;
        const current = merchantByCategory.get(categoryId) ?? { total: 0, traceable: 0 };
        current.total += 1;
        if (traceableOwnerIds.has(merchant.id)) current.traceable += 1;
        merchantByCategory.set(categoryId, current);
      }

      const categoryByStall = new Map(
        stalls.map((stall) => [stall.id, stall.category_id ?? UNCATEGORIZED]),
      );
      const productByCategory = new Map<string, { total: number; traceable: number }>();
      for (const row of productGroups) {
        const categoryId = categoryByStall.get(row.stall_id) ?? UNCATEGORIZED;
        const current = productByCategory.get(categoryId) ?? { total: 0, traceable: 0 };
        current.total += row._count._all;
        productByCategory.set(categoryId, current);
      }
      for (const row of traceableProductGroups) {
        const categoryId = categoryByStall.get(row.stall_id) ?? UNCATEGORIZED;
        const current = productByCategory.get(categoryId) ?? { total: 0, traceable: 0 };
        current.traceable += row._count._all;
        productByCategory.set(categoryId, current);
      }

      const categoryIds = [
        ...new Set(
          [...merchantByCategory.keys(), ...productByCategory.keys()].filter(
            (id) => id !== UNCATEGORIZED,
          ),
        ),
      ];
      const categories = categoryIds.length
        ? await prisma.categories.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, display_order: true },
          })
        : [];
      const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
      const categoryOrder = new Map(
        categories.map((category) => [category.id, category.display_order]),
      );
      const presentStats = (stats: Map<string, { total: number; traceable: number }>) =>
        [...stats.entries()]
          .map(([categoryId, value]) => ({
            category_id: categoryId,
            name:
              categoryId === UNCATEGORIZED
                ? 'Chưa phân loại'
                : (categoryNames.get(categoryId) ?? 'Ngành hàng khác'),
            total: value.total,
            traceable: value.traceable,
            rate: ratio(value.traceable, value.total),
          }))
          .sort(
            (a, b) =>
              (categoryOrder.get(a.category_id) ?? Number.MAX_SAFE_INTEGER) -
                (categoryOrder.get(b.category_id) ?? Number.MAX_SAFE_INTEGER) ||
              b.total - a.total,
          );

      const totalProducts = productGroups.reduce((sum, row) => sum + row._count._all, 0);
      const traceableProducts = traceableProductGroups.reduce(
        (sum, row) => sum + row._count._all,
        0,
      );
      const scopedMerchantIds = new Set(merchants.map((merchant) => merchant.id));
      const traceableMerchants = [...traceableOwnerIds].filter((id) =>
        scopedMerchantIds.has(id),
      ).length;

      ok(res, {
        total_merchants: merchants.length,
        traceable_merchants: traceableMerchants,
        merchant_rate: ratio(traceableMerchants, merchants.length),
        total_products: totalProducts,
        traceable_products: traceableProducts,
        product_rate: ratio(traceableProducts, totalProducts),
        merchant_category_stats: presentStats(merchantByCategory),
        product_category_stats: presentStats(productByCategory),
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /admin/traceability/traders — tiểu thương đang có ít nhất một sản phẩm truy xuất.
traceabilityAdminRouter.get(
  '/traders',
  validate({
    query: pageQuery.extend({
      marketId: z.string().uuid().optional(),
      categoryId: categoryQuery,
      search: z.string().trim().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const [marketIds, stallScope] = await Promise.all([
        scopedMarketIds(req, q.marketId),
        marketFilter(req.scope!, q.marketId),
      ]);
      const traceableOwnedProduct: Prisma.productsWhereInput = {
        deleted_at: null,
        stalls: stallScope,
        traceability: { isNot: null },
      };
      const where: Prisma.usersWhereInput = {
        role: 'user',
        merchant_status: { not: null },
        ...merchantMarketWhere(marketIds),
        ...(q.categoryId && q.categoryId !== UNCATEGORIZED
          ? { merchant_category_id: q.categoryId }
          : q.categoryId === UNCATEGORIZED
            ? { merchant_category_id: null }
            : {}),
        products_owned: { some: traceableOwnedProduct },
        ...(q.search
          ? {
              OR: [
                { full_name: { contains: q.search, mode: 'insensitive' } },
                { phone: { contains: q.search } },
                { categories: { name: { contains: q.search, mode: 'insensitive' } } },
                {
                  contracts_contracts_merchant_idTousers: {
                    some: {
                      ended_at: null,
                      stalls: {
                        ...stallScope,
                        OR: [
                          { code: { contains: q.search, mode: 'insensitive' } },
                          { name: { contains: q.search, mode: 'insensitive' } },
                        ],
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.users.count({ where }),
        prisma.users.findMany({
          where,
          orderBy: { full_name: 'asc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          select: {
            id: true,
            full_name: true,
            avatar: true,
            phone: true,
            categories: { select: { id: true, name: true } },
            contracts_contracts_merchant_idTousers: {
              where: { ended_at: null, stalls: stallScope },
              orderBy: { start_date: 'desc' },
              take: 1,
              select: { stalls: { select: { id: true, code: true, name: true } } },
            },
          },
        }),
      ]);
      const merchantIds = rows.map((row) => row.id);
      const [allProducts, traceableProducts] = merchantIds.length
        ? await Promise.all([
            prisma.products.groupBy({
              by: ['owner_merchant_id'],
              where: {
                deleted_at: null,
                stalls: stallScope,
                owner_merchant_id: { in: merchantIds },
              },
              _count: { _all: true },
            }),
            prisma.products.groupBy({
              by: ['owner_merchant_id'],
              where: {
                ...traceableOwnedProduct,
                owner_merchant_id: { in: merchantIds },
              },
              _count: { _all: true },
            }),
          ])
        : [[], []];
      const totalByMerchant = new Map(
        allProducts.map((row) => [row.owner_merchant_id as string, row._count._all]),
      );
      const traceableByMerchant = new Map(
        traceableProducts.map((row) => [row.owner_merchant_id as string, row._count._all]),
      );

      paginated(
        res,
        rows.map(({ contracts_contracts_merchant_idTousers, categories, ...merchant }) => {
          const productTotal = totalByMerchant.get(merchant.id) ?? 0;
          const traceableTotal = traceableByMerchant.get(merchant.id) ?? 0;
          return {
            ...merchant,
            category: categories,
            stall: contracts_contracts_merchant_idTousers[0]?.stalls ?? null,
            product_total: productTotal,
            traceable_product_total: traceableTotal,
            traceability_rate: ratio(traceableTotal, productTotal),
          };
        }),
        { page: q.page, limit: q.limit, total },
      );
    } catch (error) {
      next(error);
    }
  },
);

// GET /admin/traceability/products — các mặt hàng đã khai báo thông tin truy xuất.
traceabilityAdminRouter.get(
  '/products',
  validate({
    query: pageQuery.extend({
      marketId: z.string().uuid().optional(),
      categoryId: categoryQuery,
      merchantId: z.string().uuid().optional(),
      search: z.string().trim().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const stallScope = await marketFilter(req.scope!, q.marketId);
      const where: Prisma.productsWhereInput = {
        deleted_at: null,
        stalls: {
          ...stallScope,
          ...(q.categoryId && q.categoryId !== UNCATEGORIZED
            ? { category_id: q.categoryId }
            : q.categoryId === UNCATEGORIZED
              ? { category_id: null }
              : {}),
        },
        owner_merchant_id: q.merchantId,
        traceability: { isNot: null },
        ...(q.search
          ? {
              OR: [
                { name: { contains: q.search, mode: 'insensitive' } },
                { origin: { contains: q.search, mode: 'insensitive' } },
                { owner_merchant: { full_name: { contains: q.search, mode: 'insensitive' } } },
                { traceability: { is: { batch_code: { contains: q.search, mode: 'insensitive' } } } },
                { traceability: { is: { producer_name: { contains: q.search, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.products.count({ where }),
        prisma.products.findMany({
          where,
          orderBy: { updated_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          select: {
            id: true,
            name: true,
            images: true,
            origin: true,
            updated_at: true,
            categories: { select: { id: true, name: true } },
            stalls: {
              select: {
                id: true,
                code: true,
                name: true,
                category_id: true,
                categories: { select: { id: true, name: true } },
              },
            },
            owner_merchant: { select: { id: true, full_name: true, avatar: true } },
            traceability: {
              select: {
                id: true,
                producer_name: true,
                production_address: true,
                batch_code: true,
                production_date: true,
                harvest_date: true,
                expiry_date: true,
                certificate_name: true,
                certificate_number: true,
                external_url: true,
                notes: true,
              },
            },
          },
        }),
      ]);
      paginated(res, rows, { page: q.page, limit: q.limit, total });
    } catch (error) {
      next(error);
    }
  },
);
