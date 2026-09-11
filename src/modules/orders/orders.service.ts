import { Prisma, order_status, orders } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma, Tx } from '../../shared/prisma';
import { badRequest, conflict, notFound } from '../../shared/errors';
import { genOrderCode } from '../../shared/order-code';
import { finalPrice } from '../../shared/pricing';
import { notifyUsers } from '../../shared/notification.helper';
import { ensureOperationsSchema } from '../operations/operations.schema';
import {
  assertOrderPaymentPaid,
  createMockPayment,
  findOrderPayment,
  markPaymentOnOrderCancelled,
  settleSellerOrderPayment,
} from '../payments/mock-payment.service';

export type CheckoutInput = {
  marketId: string;
  receiveType: 'pickup' | 'delivery';
  receiverName: string;
  receiverPhone: string;
  note?: string | null;
  tableToken?: string | null;
  items: { productId: string; quantity: number; expectedUnitPrice: number }[];
};

export type PosCheckoutInput = {
  stallId: string;
  marketId: string;
  receiverName: string;
  receiverPhone: string;
  note?: string | null;
  paymentMethod: 'cash' | 'mock_qr';
  items: { productId: string; quantity: number; expectedUnitPrice: number }[];
};

type LockedProduct = {
  id: string;
  stall_id: string;
  name: string;
  images: any;
  price: any;
  unit: string;
  quantity: any;
  is_hidden: boolean;
  deleted_at: Date | null;
  discount_type: 'percent' | 'fixed_price' | null;
  discount_value: any;
  discount_start_at: Date | null;
  discount_end_at: Date | null;
};

/** Checkout: khóa dòng sản phẩm, validate, trừ kho, tách đơn theo sạp (PRD 10.9). */
export async function checkout(userId: string, input: CheckoutInput) {
  if (input.receiveType === 'delivery')
    throw badRequest('MVP chưa hỗ trợ giao hàng — vui lòng chọn nhận tại chợ');
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  if (productIds.length !== input.items.length)
    throw badRequest('Danh sách sản phẩm có mã trùng nhau');

  await ensureOperationsSchema();
  let tableId: string | null = null;
  let tableStallId: string | null = null;
  if (input.tableToken) {
    const tableRows = await prisma.$queryRaw<any[]>`
      SELECT id, market_id, stall_id
      FROM market_tables
      WHERE qr_token=${input.tableToken} AND status='active'
      LIMIT 1
    `;
    if (!tableRows[0] || tableRows[0].market_id !== input.marketId)
      throw badRequest('TABLE_QR_INVALID', 'Mã bàn không hợp lệ hoặc không thuộc chợ đang chọn');
    tableId = tableRows[0].id;
    tableStallId = tableRows[0].stall_id;
  }
  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Khóa dòng theo thứ tự id để tránh deadlock
      const sortedIds = [...productIds].sort();
      const locked = await tx.$queryRaw<LockedProduct[]>`
        SELECT id, stall_id, name, images, price, unit, quantity, is_hidden, deleted_at,
               discount_type, discount_value, discount_start_at, discount_end_at
        FROM products WHERE id = ANY(${sortedIds}::uuid[])
        ORDER BY id FOR UPDATE`;
      const byId = new Map(locked.map((p) => [p.id, p]));
      const now = new Date();

      // 2. Validate từng item
      const stallIds = [...new Set(locked.map((p) => p.stall_id))];
      const stalls = await tx.stalls.findMany({
        where: { id: { in: stallIds } },
        include: { markets: { select: { id: true, name: true, status: true } } },
      });
      const stallById = new Map(stalls.map((s) => [s.id, s]));

      const priceChanged: any[] = [];
      const stockIssues: any[] = [];
      for (const item of input.items) {
        const p = byId.get(item.productId);
        const stall = p ? stallById.get(p.stall_id) : null;
        if (
          !p ||
          p.deleted_at ||
          p.is_hidden ||
          !stall ||
          stall.status !== 'occupied' ||
          stall.markets.status !== 'active' ||
          stall.market_id !== input.marketId
        )
          throw conflict('PRODUCT_UNAVAILABLE', `Sản phẩm không còn khả dụng hoặc không thuộc chợ này`, {
            productId: item.productId,
          });
        const fp = finalPrice(p as any, now);
        if (fp !== item.expectedUnitPrice)
          priceChanged.push({ productId: p.id, name: p.name, currentPrice: fp });
        if (Number(p.quantity) < item.quantity)
          stockIssues.push({ productId: p.id, name: p.name, available: Number(p.quantity) });
      }
      if (priceChanged.length)
        throw conflict('PRICE_CHANGED', 'Giá một số sản phẩm đã thay đổi, vui lòng kiểm tra lại giỏ hàng', {
          items: priceChanged,
        });
      if (stockIssues.length)
        throw conflict('STOCK_NOT_ENOUGH', 'Một số sản phẩm không đủ số lượng', { items: stockIssues });

      // 3. Trừ kho
      for (const item of input.items) {
        await tx.products.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // 4. Group theo sạp → tạo đơn
      const groups = new Map<string, typeof input.items>();
      for (const item of input.items) {
        const stallId = byId.get(item.productId)!.stall_id;
        if (!groups.has(stallId)) groups.set(stallId, []);
        groups.get(stallId)!.push(item);
      }
      if (tableId && (groups.size !== 1 || !groups.has(tableStallId!)))
        throw badRequest('TABLE_STALL_MISMATCH', 'Các món trong đơn không thuộc sạp của bàn đã quét');
      const checkoutGroupId = randomUUID();
      const createdOrders: orders[] = [];
      for (const [stallId, items] of groups) {
        let order: orders | null = null;
        for (let attempt = 0; attempt < 3 && !order; attempt++) {
          try {
            order = await tx.orders.create({
              data: {
                code: genOrderCode(now),
                customer_id: userId,
                market_id: input.marketId,
                stall_id: stallId,
                checkout_group_id: checkoutGroupId,
                status: 'pending',
                receive_type: input.receiveType,
                receiver_name: input.receiverName,
                receiver_phone: input.receiverPhone,
                note: input.note ?? null,
                total_amount: items.reduce(
                  (sum, it) => sum + Math.round(finalPrice(byId.get(it.productId)! as any, now) * it.quantity),
                  0,
                ),
              },
            });
          } catch (e: any) {
            if (e?.code !== 'P2002' || attempt === 2) throw e;
          }
        }
        await tx.order_items.createMany({
          data: items.map((it) => {
            const p = byId.get(it.productId)!;
            const unitPrice = finalPrice(p as any, now);
            const image = Array.isArray(p.images) && p.images[0]?.url ? p.images[0].url : null;
            return {
              order_id: order!.id,
              product_id: p.id,
              product_name: p.name,
              product_image: image,
              unit: p.unit,
              original_price: Number(p.price),
              unit_price: unitPrice,
              quantity: it.quantity,
              line_total: Math.round(unitPrice * it.quantity),
            };
          }),
        });
        // 5. Báo seller
        const contract = await tx.contracts.findFirst({ where: { stall_id: stallId, ended_at: null } });
        if (contract)
          await notifyUsers(tx, {
            userIds: [contract.merchant_id],
            marketId: input.marketId,
            title: 'Bạn có đơn hàng mới',
            content: `Đơn ${order!.code} — ${items.length} sản phẩm, tổng ${Number(order!.total_amount).toLocaleString('vi-VN')}đ. Người nhận: ${input.receiverName}.`,
            type: 'order',
            refType: 'order',
            refId: order!.id,
          });
        createdOrders.push(order!);
      }
      const payments = [];
      for (const order of createdOrders) {
        if (tableId) await tx.$executeRaw`UPDATE orders SET table_id=${tableId}::uuid WHERE id=${order.id}::uuid`;
        payments.push(await createMockPayment(tx, {
          marketId: input.marketId,
          stallId: order.stall_id,
          orderId: order.id,
          amount: Number(order.total_amount),
        }));
      }
      return { checkoutGroupId, orders: createdOrders, payments };
    },
    { timeout: 20_000 },
  );

  // Trả kèm items
  const withItems = await prisma.orders.findMany({
    where: { id: { in: result.orders.map((o) => o.id) } },
    include: { order_items: true, stalls: { select: { id: true, code: true, name: true } } },
  });
  const payments = await Promise.all(withItems.map((order) => findOrderPayment(order.id)));
  return {
    checkout_group_id: result.checkoutGroupId,
    orders: withItems.map((order, index) => ({ ...order, payment: payments[index] })),
  };
}

/** Bán tại quầy cho tiểu thương dùng mô hình POS; không gắn khách hàng cuối vào đơn. */
export async function posCheckout(userId: string, input: PosCheckoutInput) {
  await ensureOperationsSchema();
  const productIds = [...new Set(input.items.map((item) => item.productId))];
  if (productIds.length !== input.items.length) throw badRequest('POS_ITEMS_DUPLICATE', 'Danh sách sản phẩm POS có mã trùng nhau');
  const owned = await prisma.products.count({
    where: { id: { in: productIds }, stall_id: input.stallId, deleted_at: null },
  });
  if (owned !== productIds.length) throw badRequest('POS_PRODUCT_SCOPE', 'Sản phẩm không thuộc sạp POS đang đăng nhập');

  const result = await checkout(userId, {
    marketId: input.marketId,
    receiveType: 'pickup',
    receiverName: input.receiverName,
    receiverPhone: input.receiverPhone,
    note: input.note ?? 'Đơn bán tại quầy POS',
    items: input.items,
  });
  const orderIds = result.orders.map((order) => order.id);
  await prisma.$executeRaw`
    UPDATE orders SET customer_id=NULL, note=COALESCE(note, 'Đơn bán tại quầy POS'), updated_at=now()
    WHERE id=ANY(${orderIds}::uuid[]) AND stall_id=${input.stallId}::uuid
  `;
  if (input.paymentMethod === 'cash') {
    for (const orderId of orderIds) await settleSellerOrderPayment(orderId, userId, 'POS_CASH');
  }
  return {
    ...result,
    orders: await Promise.all(result.orders.map(async (order) => ({
      ...order,
      customer_id: null,
      payment: await findOrderPayment(order.id),
    }))),
  };
}

/** Máy trạng thái đơn (PRD 10.9). */
const SELLER_FLOW: Record<string, order_status> = {
  confirmed: 'pending',
  preparing: 'confirmed',
  ready: 'preparing',
  completed: 'ready',
};
const TIMESTAMP_FIELD: Record<string, string> = {
  confirmed: 'confirmed_at',
  preparing: 'preparing_at',
  ready: 'ready_at',
  completed: 'completed_at',
};

export async function sellerUpdateStatus(order: orders, to: order_status, sellerId: string) {
  const from = SELLER_FLOW[to];
  if (!from)
    throw conflict('STATE_INVALID', `Trạng thái "${to}" không hợp lệ`);
  if (order.status !== from)
    throw conflict('STATE_INVALID', `Đơn đang ở trạng thái "${order.status}", không thể chuyển sang "${to}"`);
  if (to === 'confirmed') await assertOrderPaymentPaid(order.id);
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.orders.updateMany({
      where: { id: order.id, status: from },
      data: { status: to, [TIMESTAMP_FIELD[to]]: new Date() },
    });
    if (count === 0)
      throw conflict('STATE_INVALID', 'Đơn hàng vừa được cập nhật bởi thao tác khác, hãy tải lại');
    const LABEL: Record<string, string> = {
      confirmed: 'đã được xác nhận',
      preparing: 'đang được chuẩn bị',
      ready: 'đã sẵn sàng, mời bạn đến nhận',
      completed: 'đã hoàn tất',
    };
    await notifyUsers(tx, {
      userIds: order.customer_id ? [order.customer_id] : [],
      marketId: order.market_id,
      title: `Đơn hàng ${order.code} ${LABEL[to]}`,
      content: `Đơn hàng ${order.code} của bạn ${LABEL[to]}.`,
      type: 'order',
      refType: 'order',
      refId: order.id,
    });
    return tx.orders.findUnique({ where: { id: order.id } });
  });
}

/** Hủy đơn + hoàn kho + thông báo (dùng cho buyer/seller/admin). */
export async function cancelOrder(args: {
  order: orders;
  by: 'buyer' | 'seller' | 'admin';
  reason: string | null;
  notifyUserIds: string[];
}) {
  const { order, by } = args;
  const allowed: Record<string, order_status[]> = {
    buyer: ['pending', 'confirmed'],
    seller: ['pending', 'confirmed', 'preparing'],
    admin: ['pending', 'confirmed', 'preparing', 'ready'],
  };
  if (!allowed[by].includes(order.status))
    throw conflict('STATE_INVALID', `Không thể hủy đơn đang ở trạng thái "${order.status}"`);
  const result = await prisma.$transaction(async (tx) => {
    const { count } = await tx.orders.updateMany({
      where: { id: order.id, status: order.status },
      data: {
        status: 'cancelled',
        cancelled_by: by,
        cancel_reason: args.reason,
        cancelled_at: new Date(),
      },
    });
    if (count === 0)
      throw conflict('STATE_INVALID', 'Đơn hàng vừa được cập nhật bởi thao tác khác, hãy tải lại');
    // Hoàn kho
    const items = await tx.order_items.findMany({ where: { order_id: order.id } });
    for (const it of items) {
      await tx.products.updateMany({
        where: { id: it.product_id, deleted_at: null },
        data: { quantity: { increment: Number(it.quantity) } },
      });
    }
    const BY_LABEL = { buyer: 'người mua', seller: 'tiểu thương', admin: 'ban quản lý' } as const;
    await notifyUsers(tx, {
      userIds: args.notifyUserIds,
      marketId: order.market_id,
      title: `Đơn hàng ${order.code} đã bị hủy`,
      content: `Đơn ${order.code} bị hủy bởi ${BY_LABEL[by]}.${args.reason ? ` Lý do: ${args.reason}` : ''}`,
      type: 'order',
      refType: 'order',
      refId: order.id,
    });
    return tx.orders.findUnique({ where: { id: order.id } });
  });
  await markPaymentOnOrderCancelled(order.id);
  return result;
}

export async function merchantOfStall(stallId: string): Promise<string | null> {
  const contract = await prisma.contracts.findFirst({ where: { stall_id: stallId, ended_at: null } });
  return contract?.merchant_id ?? null;
}
