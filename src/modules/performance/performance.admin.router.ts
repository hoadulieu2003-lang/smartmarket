import { Router } from 'express';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';
import { prisma } from '../../shared/prisma';
import { ok } from '../../shared/response';
import { assertMarketInScope, marketFilter, marketIdsForScope } from '../../shared/scope';

export const performanceAdminRouter = Router(); // mount tại /admin/performance

const periodSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Tháng phải có dạng YYYY-MM');

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function ratio(value: number, total: number) {
  return total ? round((value / total) * 100) : 0;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

async function scopedMarketIds(req: any, marketId?: string) {
  let ids = await marketIdsForScope(req.scope);
  if (marketId) {
    await assertMarketInScope(req.scope, marketId);
    ids = [marketId];
  }
  return ids;
}

type MerchantMetric = {
  id: string;
  fullName: string;
  avatar: string | null;
  categoryId: string;
  categoryName: string;
  stallCode: string | null;
  ratingSum: number;
  reviewCount: number;
  orderCount: number;
  completedOrders: number;
  deliveryOrders: number;
  complaintCount: number;
  productCount: number;
  traceableProducts: number;
  score: number;
};

function finalizeScore(metric: MerchantMetric) {
  const rating = metric.reviewCount ? (metric.ratingSum / metric.reviewCount) * 20 : 0;
  const completion = ratio(metric.completedOrders, metric.orderCount);
  const onlineSelling = metric.orderCount > 0 ? 100 : 0;
  const delivery = ratio(metric.deliveryOrders, metric.completedOrders);
  const traceability = ratio(metric.traceableProducts, metric.productCount);
  const complaintFree = clamp(100 - metric.complaintCount * 15);
  metric.score = round(
    rating * 0.3 +
      completion * 0.2 +
      onlineSelling * 0.15 +
      delivery * 0.1 +
      traceability * 0.15 +
      complaintFree * 0.1,
  );
  return { rating, completion, onlineSelling, delivery, traceability, complaintFree };
}

// GET /admin/performance/summary — tổng hợp xếp hạng và hiệu quả theo tháng.
performanceAdminRouter.get(
  '/summary',
  validate({
    query: z.object({
      marketId: z.string().uuid().optional(),
      period: periodSchema.default(dayjs().format('YYYY-MM')),
    }),
  }),
  async (req, res, next) => {
    try {
      const marketId = req.query.marketId as string | undefined;
      const period = req.query.period as string;
      const periodStart = dayjs(`${period}-01`).startOf('month').toDate();
      const periodEnd = dayjs(`${period}-01`).endOf('month').toDate();
      const [marketIds, stallScope] = await Promise.all([
        scopedMarketIds(req, marketId),
        marketFilter(req.scope!, marketId),
      ]);
      const merchantWhere: Prisma.usersWhereInput = {
        role: 'user',
        merchant_status: { not: null },
        ...(marketIds
          ? { merchant_market_id: { in: marketIds } }
          : { merchant_market_id: { not: null } }),
      };

      const [merchants, contracts, products, orders, complaints, reviews] = await Promise.all([
        prisma.users.findMany({
          where: merchantWhere,
          select: {
            id: true,
            full_name: true,
            avatar: true,
            categories: { select: { id: true, name: true } },
          },
        }),
        prisma.contracts.findMany({
          where: { ended_at: null, stalls: stallScope },
          orderBy: { start_date: 'desc' },
          select: {
            merchant_id: true,
            stalls: {
              select: {
                id: true,
                code: true,
                categories: { select: { id: true, name: true } },
              },
            },
          },
        }),
        prisma.products.findMany({
          where: { deleted_at: null, stalls: stallScope },
          select: {
            id: true,
            owner_merchant_id: true,
            stall_id: true,
            traceability: { select: { id: true } },
          },
        }),
        prisma.orders.findMany({
          where: {
            created_at: { gte: periodStart, lte: periodEnd },
            ...(marketIds ? { market_id: { in: marketIds } } : {}),
          },
          select: { merchant_id: true, stall_id: true, status: true, receive_type: true },
        }),
        prisma.complaints.findMany({
          where: {
            created_at: { gte: periodStart, lte: periodEnd },
            ...(marketIds ? { market_id: { in: marketIds } } : {}),
          },
          select: { stall_id: true, product_id: true },
        }),
        prisma.reviews.findMany({
          where: {
            created_at: { lte: periodEnd },
            products: { deleted_at: null, stalls: stallScope },
          },
          select: {
            rating: true,
            products: { select: { owner_merchant_id: true, stall_id: true } },
          },
        }),
      ]);

      const merchantIds = new Set(merchants.map((merchant) => merchant.id));
      const merchantByStall = new Map<string, string>();
      const stallByMerchant = new Map<
        string,
        { code: string; category: { id: string; name: string } | null }
      >();
      for (const contract of contracts) {
        if (!merchantIds.has(contract.merchant_id)) continue;
        merchantByStall.set(contract.stalls.id, contract.merchant_id);
        if (!stallByMerchant.has(contract.merchant_id)) {
          stallByMerchant.set(contract.merchant_id, {
            code: contract.stalls.code,
            category: contract.stalls.categories,
          });
        }
      }

      const metrics = new Map<string, MerchantMetric>();
      for (const merchant of merchants) {
        const stall = stallByMerchant.get(merchant.id);
        const category = merchant.categories ?? stall?.category ?? null;
        metrics.set(merchant.id, {
          id: merchant.id,
          fullName: merchant.full_name,
          avatar: merchant.avatar,
          categoryId: category?.id ?? 'uncategorized',
          categoryName: category?.name ?? 'Chưa phân loại',
          stallCode: stall?.code ?? null,
          ratingSum: 0,
          reviewCount: 0,
          orderCount: 0,
          completedOrders: 0,
          deliveryOrders: 0,
          complaintCount: 0,
          productCount: 0,
          traceableProducts: 0,
          score: 0,
        });
      }

      const productOwner = new Map<string, string>();
      for (const product of products) {
        const ownerId = product.owner_merchant_id ?? merchantByStall.get(product.stall_id);
        if (!ownerId || !metrics.has(ownerId)) continue;
        productOwner.set(product.id, ownerId);
        const metric = metrics.get(ownerId)!;
        metric.productCount += 1;
        if (product.traceability) metric.traceableProducts += 1;
      }

      const assessedMerchantIds = new Set<string>();
      const starCounts = new Map<number, number>([1, 2, 3, 4, 5].map((star) => [star, 0]));
      for (const review of reviews) {
        const ownerId =
          review.products.owner_merchant_id ?? merchantByStall.get(review.products.stall_id);
        const metric = ownerId ? metrics.get(ownerId) : undefined;
        if (!metric) continue;
        metric.ratingSum += review.rating;
        metric.reviewCount += 1;
        assessedMerchantIds.add(metric.id);
        starCounts.set(review.rating, (starCounts.get(review.rating) ?? 0) + 1);
      }

      for (const order of orders) {
        const ownerId = order.merchant_id ?? merchantByStall.get(order.stall_id);
        const metric = ownerId ? metrics.get(ownerId) : undefined;
        if (!metric) continue;
        metric.orderCount += 1;
        if (order.status === 'completed') {
          metric.completedOrders += 1;
          if (order.receive_type === 'delivery') metric.deliveryOrders += 1;
        }
      }

      for (const complaint of complaints) {
        const ownerId =
          (complaint.product_id ? productOwner.get(complaint.product_id) : undefined) ??
          (complaint.stall_id ? merchantByStall.get(complaint.stall_id) : undefined);
        const metric = ownerId ? metrics.get(ownerId) : undefined;
        if (metric) metric.complaintCount += 1;
      }

      const merchantRows = [...metrics.values()];
      const components = new Map<string, ReturnType<typeof finalizeScore>>();
      for (const metric of merchantRows) components.set(metric.id, finalizeScore(metric));

      const totalOrders = merchantRows.reduce((sum, row) => sum + row.orderCount, 0);
      const completedOrders = merchantRows.reduce((sum, row) => sum + row.completedOrders, 0);
      const deliveryOrders = merchantRows.reduce((sum, row) => sum + row.deliveryOrders, 0);
      const onlineMerchants = merchantRows.filter((row) => row.orderCount > 0).length;
      const complainedMerchants = merchantRows.filter((row) => row.complaintCount > 0).length;
      const traceableMerchants = merchantRows.filter((row) => row.traceableProducts > 0).length;
      const totalReviews = merchantRows.reduce((sum, row) => sum + row.reviewCount, 0);
      const totalRating = merchantRows.reduce((sum, row) => sum + row.ratingSum, 0);
      const averageRating = totalReviews ? round(totalRating / totalReviews) : 0;
      const averageSmartScore = merchantRows.length
        ? round(merchantRows.reduce((sum, row) => sum + row.score, 0) / merchantRows.length)
        : 0;

      const categoryMap = new Map<string, MerchantMetric[]>();
      for (const merchant of merchantRows) {
        const rows = categoryMap.get(merchant.categoryId) ?? [];
        rows.push(merchant);
        categoryMap.set(merchant.categoryId, rows);
      }
      const categoryStats = [...categoryMap.entries()]
        .map(([categoryId, rows]) => {
          const orderCount = rows.reduce((sum, row) => sum + row.orderCount, 0);
          const completed = rows.reduce((sum, row) => sum + row.completedOrders, 0);
          const delivered = rows.reduce((sum, row) => sum + row.deliveryOrders, 0);
          const reviewCount = rows.reduce((sum, row) => sum + row.reviewCount, 0);
          const ratingSum = rows.reduce((sum, row) => sum + row.ratingSum, 0);
          return {
            category_id: categoryId,
            name: rows[0]?.categoryName ?? 'Chưa phân loại',
            merchant_count: rows.length,
            smart_score: round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length),
            order_completion: ratio(completed, orderCount),
            online_selling: ratio(rows.filter((row) => row.orderCount > 0).length, rows.length),
            delivery: ratio(delivered, completed),
            rating: reviewCount ? round((ratingSum / reviewCount) * 20) : 0,
            complaint_free: ratio(rows.filter((row) => row.complaintCount === 0).length, rows.length),
            traceability: ratio(rows.filter((row) => row.traceableProducts > 0).length, rows.length),
          };
        })
        .sort((a, b) => b.smart_score - a.smart_score);

      const rankings = [...merchantRows]
        .sort((a, b) => b.score - a.score || b.reviewCount - a.reviewCount)
        .slice(0, 20)
        .map((row, index) => ({
          rank: index + 1,
          id: row.id,
          full_name: row.fullName,
          avatar: row.avatar,
          stall_code: row.stallCode,
          category_name: row.categoryName,
          average_rating: row.reviewCount ? round(row.ratingSum / row.reviewCount) : 0,
          review_count: row.reviewCount,
          smart_score: row.score,
        }));

      const bestScoreCategory = categoryStats[0];
      const bestOnlineCategory = [...categoryStats].sort(
        (a, b) => b.online_selling - a.online_selling,
      )[0];
      const bestDeliveryCategory = [...categoryStats].sort((a, b) => b.delivery - a.delivery)[0];
      const bestTrader = rankings[0];
      const activities = [
        bestScoreCategory && `${bestScoreCategory.name} có Smart Score cao nhất (${bestScoreCategory.smart_score} điểm)`,
        bestOnlineCategory && `${bestOnlineCategory.name} có tỷ lệ bán hàng online cao nhất (${bestOnlineCategory.online_selling}%)`,
        bestDeliveryCategory && `${bestDeliveryCategory.name} có tỷ lệ giao hàng cao nhất (${bestDeliveryCategory.delivery}%)`,
        bestTrader && `${bestTrader.full_name} dẫn đầu bảng xếp hạng (${bestTrader.smart_score} điểm)`,
      ].filter((item): item is string => Boolean(item));

      ok(res, {
        period,
        total_merchants: merchantRows.length,
        average_smart_score: averageSmartScore,
        order_completion_rate: ratio(completedOrders, totalOrders),
        completed_orders: completedOrders,
        total_orders: totalOrders,
        online_selling_rate: ratio(onlineMerchants, merchantRows.length),
        online_merchants: onlineMerchants,
        delivery_rate: ratio(deliveryOrders, completedOrders),
        delivery_orders: deliveryOrders,
        complaint_rate: ratio(complainedMerchants, merchantRows.length),
        complained_merchants: complainedMerchants,
        traceability_rate: ratio(traceableMerchants, merchantRows.length),
        traceable_merchants: traceableMerchants,
        average_rating: averageRating,
        total_reviews: totalReviews,
        evaluated_merchants: assessedMerchantIds.size,
        star_distribution: [5, 4, 3, 2, 1].map((star) => ({
          star,
          count: starCounts.get(star) ?? 0,
          rate: ratio(starCounts.get(star) ?? 0, totalReviews),
        })),
        criteria: [
          { code: 'completion', name: 'Hoàn tất đơn', value: ratio(completedOrders, totalOrders), detail: `${completedOrders}/${totalOrders} đơn` },
          { code: 'online', name: 'Bán hàng online', value: ratio(onlineMerchants, merchantRows.length), detail: `${onlineMerchants}/${merchantRows.length} tiểu thương` },
          { code: 'delivery', name: 'Giao hàng', value: ratio(deliveryOrders, completedOrders), detail: `${deliveryOrders}/${completedOrders} đơn hoàn tất` },
          { code: 'rating', name: 'Đánh giá sao', value: round(averageRating * 20), detail: `${averageRating}/5 điểm` },
          { code: 'complaint', name: 'Tỷ lệ bị phản ánh', value: ratio(complainedMerchants, merchantRows.length), detail: `${complainedMerchants}/${merchantRows.length} tiểu thương`, negative: true },
          { code: 'traceability', name: 'Truy xuất nguồn gốc', value: ratio(traceableMerchants, merchantRows.length), detail: `${traceableMerchants}/${merchantRows.length} tiểu thương` },
        ],
        radar_categories: [...categoryStats]
          .sort((a, b) => b.merchant_count - a.merchant_count)
          .slice(0, 4),
        category_heatmap: categoryStats,
        rankings,
        activities,
      });
    } catch (error) {
      next(error);
    }
  },
);
