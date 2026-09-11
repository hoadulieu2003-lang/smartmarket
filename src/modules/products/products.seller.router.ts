import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { prisma } from '../../shared/prisma';
import { ok, paginated } from '../../shared/response';
import { pageQuery } from '../../shared/pagination';
import { validate } from '../../middlewares/validate.middleware';
import { auth, requireActiveSeller } from '../../middlewares/auth.middleware';
import { badRequest, notFound } from '../../shared/errors';
import { withPricing, isOnSale, finalPrice } from '../../shared/pricing';
import { getSetting, SETTING_KEYS } from '../../shared/settings';
import { stallAggregates } from '../markets/markets.service';

export const sellerRouter = Router(); // mount tại /seller
sellerRouter.use(auth, requireActiveSeller);

const idParam = z.object({ id: z.string().uuid() });
const imageArr = z.array(z.object({ url: z.string().url() }));
const traceabilityBody = z.object({
  producerName: z.string().trim().min(1, 'Nhập đơn vị sản xuất hoặc cung cấp').max(255),
  productionAddress: z.string().trim().max(2000).nullish(),
  batchCode: z.string().trim().max(100).nullish(),
  productionDate: z.coerce.date().nullish(),
  harvestDate: z.coerce.date().nullish(),
  expiryDate: z.coerce.date().nullish(),
  certificateName: z.string().trim().max(255).nullish(),
  certificateNumber: z.string().trim().max(100).nullish(),
  documents: imageArr.max(6).default([]),
  externalUrl: z.string().trim().url('URL truy xuất không hợp lệ').max(2048)
    .refine((value) => /^https?:\/\//i.test(value), 'URL phải bắt đầu bằng http:// hoặc https://')
    .nullish(),
  notes: z.string().trim().max(5000).nullish(),
}).superRefine((value, ctx) => {
  const sourceDate = [value.productionDate, value.harvestDate]
    .filter((date): date is Date => !!date)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  if (sourceDate && value.expiryDate && value.expiryDate < sourceDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['expiryDate'],
      message: 'Hạn sử dụng phải sau ngày sản xuất hoặc thu hoạch',
    });
  }
});
const productCategoryBody = z.object({
  name: z.string().trim().min(1, 'Nhập tên loại mặt hàng').max(100)
    .transform((value) => value.replace(/\s+/g, ' ')),
});

// ===== SẠP CỦA TÔI =====

sellerRouter.get('/stall', async (req, res, next) => {
  try {
    const s = req.seller!;
    const stall = await prisma.stalls.findUnique({
      where: { id: s.stallId },
      include: {
        zones: { select: { id: true, code: true, name: true } },
        markets: { select: { id: true, name: true, address: true } },
        categories: { select: { id: true, name: true } },
      },
    });
    const contract = await prisma.contracts.findUnique({ where: { id: s.contractId } });
    const aggs = await stallAggregates([s.stallId]);
    const daysLeft = contract?.end_date
      ? dayjs(contract.end_date).diff(dayjs().startOf('day'), 'day')
      : null;
    ok(res, {
      ...stall,
      ...aggs.get(s.stallId),
      contract: contract
        ? { id: contract.id, start_date: contract.start_date, end_date: contract.end_date, fee: contract.fee, days_left: daysLeft }
        : null,
    });
  } catch (e) {
    next(e);
  }
});

sellerRouter.put(
  '/stall',
  validate({
    body: z.object({
      name: z.string().trim().max(255).optional(),
      description: z.string().max(2000).optional(),
      images: imageArr.optional(),
      phone: z.string().max(20).optional(),
      openHours: z.string().max(100).optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const b = req.body;
      const stall = await prisma.stalls.update({
        where: { id: req.seller!.stallId },
        data: {
          name: b.name,
          description: b.description,
          images: b.images,
          phone: b.phone,
          open_hours: b.openHours,
        },
      });
      ok(res, stall);
    } catch (e) {
      next(e);
    }
  },
);

// ===== DASHBOARD =====

sellerRouter.get('/dashboard', async (req, res, next) => {
  try {
    const stallId = req.seller!.stallId;
    const now = new Date();
    const startOfDay = dayjs().startOf('day').toDate();
    const [newOrders, preparing, products, aggs, todayRevenue, recentOrders] = await Promise.all([
      prisma.orders.count({ where: { stall_id: stallId, status: 'pending' } }),
      prisma.orders.count({ where: { stall_id: stallId, status: { in: ['confirmed', 'preparing'] } } }),
      prisma.products.findMany({ where: { stall_id: stallId, deleted_at: null } }),
      stallAggregates([stallId]),
      prisma.orders.aggregate({
        where: { stall_id: stallId, status: 'completed', completed_at: { gte: startOfDay } },
        _sum: { total_amount: true },
      }),
      prisma.orders.findMany({
        where: { stall_id: stallId },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { id: true, code: true, status: true, total_amount: true, receiver_name: true, created_at: true },
      }),
    ]);
    ok(res, {
      new_order_count: newOrders,
      processing_order_count: preparing,
      selling_product_count: products.filter((p) => !p.is_hidden && Number(p.quantity) > 0).length,
      out_of_stock_count: products.filter((p) => Number(p.quantity) <= 0).length,
      on_sale_count: products.filter((p) => !p.is_hidden && isOnSale(p, now)).length,
      rating_avg: aggs.get(stallId)?.rating_avg ?? 0,
      today_revenue: todayRevenue._sum.total_amount ?? 0,
      recent_orders: recentOrders,
    });
  } catch (e) {
    next(e);
  }
});

// ===== SẢN PHẨM =====

sellerRouter.post(
  '/product-categories',
  validate({ body: productCategoryBody }),
  async (req, res, next) => {
    try {
      const stall = await prisma.stalls.findUnique({
        where: { id: req.seller!.stallId },
        select: { category_id: true },
      });
      if (!stall?.category_id)
        throw badRequest('Quầy chưa có ngành hàng — liên hệ quản lý chợ để cập nhật');

      const existing = await prisma.categories.findFirst({
        where: {
          parent_id: stall.category_id,
          name: { equals: req.body.name, mode: 'insensitive' },
        },
      });
      if (existing) return ok(res, existing);

      const last = await prisma.categories.aggregate({
        where: { parent_id: stall.category_id },
        _max: { display_order: true },
      });
      const created = await prisma.categories.create({
        data: {
          name: req.body.name,
          parent_id: stall.category_id,
          display_order: (last._max.display_order ?? -1) + 1,
        },
      });
      ok(res, created, 201);
    } catch (e) {
      next(e);
    }
  },
);

async function ownProduct(req: any, id: string) {
  const product = await prisma.products.findUnique({ where: { id } });
  if (!product || product.deleted_at || product.stall_id !== req.seller.stallId)
    throw notFound('Không tìm thấy sản phẩm trong sạp của bạn');
  return product;
}

sellerRouter.get(
  '/products',
  validate({
    query: pageQuery.extend({
      tab: z.enum(['all', 'selling', 'hidden', 'out_of_stock', 'on_sale']).default('all'),
      search: z.string().trim().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const q = req.query as any;
      const now = new Date();
      const base: Prisma.productsWhereInput = {
        stall_id: req.seller!.stallId,
        deleted_at: null,
        ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
      };
      const tabWhere: Prisma.productsWhereInput =
        q.tab === 'selling'
          ? { is_hidden: false, quantity: { gt: 0 } }
          : q.tab === 'hidden'
            ? { is_hidden: true }
            : q.tab === 'out_of_stock'
              ? { quantity: { lte: 0 } }
              : q.tab === 'on_sale'
                ? {
                    discount_type: { not: null },
                    AND: [
                      { OR: [{ discount_start_at: null }, { discount_start_at: { lte: now } }] },
                      { OR: [{ discount_end_at: null }, { discount_end_at: { gte: now } }] },
                    ],
                  }
                : {};
      const where = { ...base, ...tabWhere };
      const [total, rows] = await Promise.all([
        prisma.products.count({ where }),
        prisma.products.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          include: {
            categories: { select: { id: true, name: true } },
            traceability: { select: { id: true } },
          },
        }),
      ]);
      paginated(
        res,
        rows.map(({ traceability, ...product }) => ({
          ...withPricing(product, now),
          has_traceability: !!traceability,
        })),
        { page: q.page, limit: q.limit, total },
      );
    } catch (e) {
      next(e);
    }
  },
);

const productBody = z.object({
  name: z.string().trim().min(1).max(255),
  images: imageArr.min(1, 'Sản phẩm cần tối thiểu 1 ảnh'),
  categoryId: z.string().uuid(),
  price: z.number().int().positive('Giá bán phải lớn hơn 0').max(1_000_000_000),
  unit: z.string().trim().min(1).max(20),
  quantity: z.number().min(0).max(1_000_000),
  origin: z.string().max(255).nullish(),
  description: z.string().max(5000).nullish(),
  isHidden: z.boolean().default(false),
  traceability: traceabilityBody.nullable().optional(),
});

function traceabilityData(value: z.infer<typeof traceabilityBody>) {
  return {
    producer_name: value.producerName,
    production_address: value.productionAddress || null,
    batch_code: value.batchCode || null,
    production_date: value.productionDate ?? null,
    harvest_date: value.harvestDate ?? null,
    expiry_date: value.expiryDate ?? null,
    certificate_name: value.certificateName || null,
    certificate_number: value.certificateNumber || null,
    documents: value.documents,
    external_url: value.externalUrl || null,
    notes: value.notes || null,
  };
}

async function assertUnit(unit: string) {
  const units = await getSetting<string[]>(SETTING_KEYS.productUnits, []);
  if (units.length && !units.includes(unit))
    throw badRequest(`Đơn vị bán "${unit}" không hợp lệ. Chọn một trong: ${units.join(', ')}`);
}

/** Product phải gán một LOẠI MẶT HÀNG (subcategory) thuộc đúng NGÀNH HÀNG của quầy. */
async function assertProductCategory(categoryId: string, stallId: string) {
  const [cat, stall] = await Promise.all([
    prisma.categories.findUnique({ where: { id: categoryId }, select: { parent_id: true } }),
    prisma.stalls.findUnique({ where: { id: stallId }, select: { category_id: true } }),
  ]);
  if (!cat) throw badRequest('Loại mặt hàng không tồn tại');
  if (!cat.parent_id) throw badRequest('Phải chọn loại mặt hàng (thuộc một ngành hàng), không phải ngành hàng chính');
  if (!stall?.category_id) throw badRequest('Quầy chưa có ngành hàng — liên hệ quản lý chợ để cập nhật');
  if (cat.parent_id !== stall.category_id) throw badRequest('Loại mặt hàng không thuộc ngành hàng của quầy');
}

sellerRouter.post('/products', validate({ body: productBody }), async (req, res, next) => {
  try {
    const b = req.body;
    await assertUnit(b.unit);
    await assertProductCategory(b.categoryId, req.seller!.stallId);
    const product = await prisma.products.create({
      data: {
        stall_id: req.seller!.stallId,
        category_id: b.categoryId,
        name: b.name,
        images: b.images,
        price: b.price,
        unit: b.unit,
        quantity: b.quantity,
        origin: b.origin ?? null,
        description: b.description ?? null,
        is_hidden: b.isHidden,
        traceability: b.traceability
          ? { create: traceabilityData(b.traceability) }
          : undefined,
      },
      include: { traceability: true },
    });
    ok(res, { ...withPricing(product), has_traceability: !!product.traceability }, 201);
  } catch (e) {
    next(e);
  }
});

sellerRouter.get('/products/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    const product = await ownProduct(req, req.params.id);
    const traceability = await prisma.product_traceability.findUnique({
      where: { product_id: product.id },
    });
    ok(res, { ...withPricing(product), has_traceability: !!traceability, traceability });
  } catch (e) {
    next(e);
  }
});

sellerRouter.put(
  '/products/:id',
  validate({ params: idParam, body: productBody.partial() }),
  async (req, res, next) => {
    try {
      const product = await ownProduct(req, req.params.id);
      const b = req.body;
      if (b.unit) await assertUnit(b.unit);
      if (b.categoryId) await assertProductCategory(b.categoryId, product.stall_id);
      // Giá mới không được thấp hơn giá-sau-giảm cố định đang cài
      if (
        b.price !== undefined &&
        product.discount_type === 'fixed_price' &&
        product.discount_value &&
        Number(product.discount_value) > b.price
      )
        throw badRequest('Giá bán mới thấp hơn giá khuyến mãi đang cài — hãy gỡ/sửa khuyến mãi trước');
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.products.update({
          where: { id: product.id },
          data: {
            name: b.name,
            images: b.images,
            category_id: b.categoryId,
            price: b.price,
            unit: b.unit,
            quantity: b.quantity,
            origin: b.origin,
            description: b.description,
            is_hidden: b.isHidden,
          },
        });
        if (b.traceability === null) {
          await tx.product_traceability.deleteMany({ where: { product_id: product.id } });
        } else if (b.traceability) {
          const data = traceabilityData(b.traceability);
          await tx.product_traceability.upsert({
            where: { product_id: product.id },
            create: { product_id: product.id, ...data },
            update: data,
          });
        }
        const traceability = await tx.product_traceability.findUnique({
          where: { product_id: product.id },
        });
        return { updated, traceability };
      });
      ok(res, {
        ...withPricing(result.updated),
        has_traceability: !!result.traceability,
        traceability: result.traceability,
      });
    } catch (e) {
      next(e);
    }
  },
);

sellerRouter.patch(
  '/products/:id/visibility',
  validate({ params: idParam, body: z.object({ isHidden: z.boolean() }) }),
  async (req, res, next) => {
    try {
      const product = await ownProduct(req, req.params.id);
      const updated = await prisma.products.update({
        where: { id: product.id },
        data: { is_hidden: req.body.isHidden },
      });
      ok(res, withPricing(updated));
    } catch (e) {
      next(e);
    }
  },
);

sellerRouter.delete('/products/:id', validate({ params: idParam }), async (req, res, next) => {
  try {
    const product = await ownProduct(req, req.params.id);
    await prisma.products.update({
      where: { id: product.id },
      data: { deleted_at: new Date(), is_hidden: true },
    });
    ok(res, { message: 'Đã xóa sản phẩm' });
  } catch (e) {
    next(e);
  }
});

// ===== KHUYẾN MÃI =====

sellerRouter.put(
  '/products/:id/promotion',
  validate({
    params: idParam,
    body: z
      .object({
        type: z.enum(['percent', 'fixed_price']),
        value: z.number().positive().or(z.number().min(0)),
        startAt: z.coerce.date().nullish(),
        endAt: z.coerce.date().nullish(),
      })
      .refine((b) => !(b.startAt && b.endAt) || b.startAt < b.endAt, {
        message: 'Thời gian bắt đầu phải trước thời gian kết thúc',
      }),
  }),
  async (req, res, next) => {
    try {
      const product = await ownProduct(req, req.params.id);
      const b = req.body;
      if (b.type === 'percent') {
        if (!Number.isInteger(b.value) || b.value < 1 || b.value > 100)
          throw badRequest('Phần trăm giảm phải là số nguyên từ 1 đến 100');
      } else {
        // fixed_price: value = GIÁ SAU GIẢM
        if (b.value < 0 || b.value > Number(product.price))
          throw badRequest('Giá sau giảm phải từ 0 đến giá gốc');
      }
      const updated = await prisma.products.update({
        where: { id: product.id },
        data: {
          discount_type: b.type,
          discount_value: b.value,
          discount_start_at: b.startAt ?? null,
          discount_end_at: b.endAt ?? null,
        },
      });
      ok(res, { ...withPricing(updated), preview_final_price: finalPrice(updated) });
    } catch (e) {
      next(e);
    }
  },
);

sellerRouter.delete('/products/:id/promotion', validate({ params: idParam }), async (req, res, next) => {
  try {
    const product = await ownProduct(req, req.params.id);
    const updated = await prisma.products.update({
      where: { id: product.id },
      data: { discount_type: null, discount_value: null, discount_start_at: null, discount_end_at: null },
    });
    ok(res, withPricing(updated));
  } catch (e) {
    next(e);
  }
});
