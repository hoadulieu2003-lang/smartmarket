import { prisma } from '../shared/prisma';
import { ensureOperationsSchema } from '../modules/operations/operations.schema';

/** Expires pending sandbox payments and releases stock reserved by their orders. */
export async function runMockPaymentExpiryJob(): Promise<{ scanned: number; expired: number; released: number }> {
  await ensureOperationsSchema();
  const pending = await prisma.$queryRaw<{ id: string; order_id: string | null }[]>`
    SELECT id, order_id
    FROM payment_transactions
    WHERE provider='mock' AND status='pending' AND expires_at IS NOT NULL AND expires_at < now()
    ORDER BY expires_at ASC
    LIMIT 500
  `;
  let expired = 0;
  let released = 0;
  for (const payment of pending) {
    const result = await prisma.$transaction(async (tx) => {
      const changed = await tx.$queryRaw<{ order_id: string | null }[]>`
        UPDATE payment_transactions
        SET status='expired', failure_reason='Hết thời gian thanh toán sandbox', updated_at=now()
        WHERE id=${payment.id}::uuid AND provider='mock' AND status='pending'
        RETURNING order_id
      `;
      if (!changed[0]?.order_id) return { changed: false, released: false };
      const order = await tx.orders.findUnique({ where: { id: changed[0].order_id }, select: { id: true, status: true } });
      if (!order || order.status !== 'pending') return { changed: true, released: false };
      const items = await tx.order_items.findMany({ where: { order_id: order.id } });
      await tx.orders.update({ where: { id: order.id }, data: { status: 'cancelled', cancelled_by: 'admin', cancel_reason: 'Hết thời gian thanh toán sandbox', cancelled_at: new Date() } });
      for (const item of items) {
        await tx.products.updateMany({ where: { id: item.product_id, deleted_at: null }, data: { quantity: { increment: Number(item.quantity) } } });
      }
      return { changed: true, released: true };
    });
    if (result.changed) expired += 1;
    if (result.released) released += 1;
  }
  return { scanned: pending.length, expired, released };
}
