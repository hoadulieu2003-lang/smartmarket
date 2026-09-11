import { randomUUID } from 'crypto';
import { prisma, Tx } from '../../shared/prisma';
import { conflict, notFound } from '../../shared/errors';
import { ensureOperationsSchema } from '../operations/operations.schema';

export type MockPaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';

export type PaymentView = {
  id: string;
  orderId: string;
  code: string;
  amount: number;
  provider: 'mock';
  method: 'mock_qr';
  status: MockPaymentStatus;
  qrPayload: string;
  expiresAt: Date | null;
  referenceCode: string | null;
  failureReason: string | null;
};

function mockCode() {
  return `MOCK-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function qrPayload(code: string, amount: number) {
  return `mockpay://pay?code=${encodeURIComponent(code)}&amount=${amount}`;
}

export async function createMockPayment(
  tx: Tx,
  input: { marketId: string; stallId: string; orderId: string; amount: number },
) {
  const code = mockCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const rows = await tx.$queryRaw<any[]>`
    INSERT INTO payment_transactions
      (market_id, stall_id, order_id, code, amount, method, provider, status, qr_payload, expires_at, metadata)
    VALUES
      (${input.marketId}::uuid, ${input.stallId}::uuid, ${input.orderId}::uuid, ${code}, ${input.amount},
       'mock_qr', 'mock', 'pending', ${qrPayload(code, input.amount)}, ${expiresAt},
       ${JSON.stringify({ mode: 'sandbox', createdBy: 'checkout' })}::jsonb)
    RETURNING id, order_id, code, amount, provider, method, status, qr_payload, expires_at, reference_code, failure_reason
  `;
  return rows[0] as PaymentView;
}

export async function findOrderPayment(orderId: string): Promise<PaymentView | null> {
  await ensureOperationsSchema();
  const rows = await prisma.$queryRaw<any[]>`
    SELECT id, order_id, code, amount, provider, method, status, qr_payload, expires_at, reference_code, failure_reason
    FROM payment_transactions
    WHERE order_id=${orderId}::uuid
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return (rows[0] as PaymentView | undefined) ?? null;
}

export async function simulateOrderPayment(
  orderId: string,
  userId: string,
  status: Exclude<MockPaymentStatus, 'pending'>,
  failureReason?: string,
) {
  await ensureOperationsSchema();
  const order = await prisma.orders.findUnique({ where: { id: orderId }, select: { id: true, customer_id: true } });
  if (!order || order.customer_id !== userId) throw notFound('Không tìm thấy đơn hàng');
  return updatePaymentStatus(orderId, status, failureReason);
}

export async function simulatePublicOrderPayment(
  orderId: string,
  tableToken: string,
  status: Exclude<MockPaymentStatus, 'pending'>,
  failureReason?: string,
) {
  await ensureOperationsSchema();
  const order = await prisma.$queryRaw<any[]>`
    SELECT o.id
    FROM orders o JOIN market_tables mt ON mt.id=o.table_id
    WHERE o.id=${orderId}::uuid AND mt.qr_token=${tableToken} AND mt.status='active'
    LIMIT 1
  `;
  if (!order[0]) throw notFound('Không tìm thấy đơn tại bàn');
  return updatePaymentStatus(orderId, status, failureReason);
}

async function updatePaymentStatus(
  orderId: string,
  status: Exclude<MockPaymentStatus, 'pending'>,
  failureReason?: string,
  referenceCode?: string,
) {

  const current = await prisma.$queryRaw<any[]>`
    SELECT id, status, expires_at
    FROM payment_transactions
    WHERE order_id=${orderId}::uuid AND provider='mock'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!current[0]) throw notFound('Đơn hàng chưa có giao dịch thanh toán');
  if (status === 'paid' && current[0].expires_at && new Date(current[0].expires_at) < new Date())
    throw conflict('PAYMENT_EXPIRED', 'Mã thanh toán thử nghiệm đã hết hạn');
  if (current[0].status === 'paid' && status !== 'refunded')
    throw conflict('PAYMENT_STATE_INVALID', 'Giao dịch đã thanh toán rồi');
  if (current[0].status === 'refunded')
    throw conflict('PAYMENT_STATE_INVALID', 'Giao dịch đã hoàn tiền');

  const updated = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<any[]>`
      UPDATE payment_transactions
      SET status=${status},
          reference_code=COALESCE(reference_code, ${status === 'paid' ? referenceCode ?? `MOCK-REF-${randomUUID().slice(0, 10).toUpperCase()}` : null}),
          failure_reason=${status === 'failed' || status === 'expired' ? failureReason ?? 'Mock payment failed' : null},
          confirmed_at=CASE WHEN ${status}='paid' THEN now() ELSE confirmed_at END,
          updated_at=now()
      WHERE id=${current[0].id}::uuid AND status <> 'refunded'
      RETURNING id, order_id, code, amount, provider, method, status, qr_payload, expires_at, reference_code, failure_reason
    `;
    if (!rows[0]) throw conflict('PAYMENT_STATE_INVALID', 'Giao dịch vừa được cập nhật, vui lòng tải lại');
    return rows[0] as PaymentView;
  });
  return updated;
}

export async function assertOrderPaymentPaid(orderId: string) {
  await ensureOperationsSchema();
  const rows = await prisma.$queryRaw<{ status: MockPaymentStatus; provider: string }[]>`
    SELECT status, provider
    FROM payment_transactions
    WHERE order_id=${orderId}::uuid
    ORDER BY created_at DESC
    LIMIT 1
  `;
  // Legacy seeded orders have no payment row and remain operable.
  if (!rows[0] || rows[0].provider !== 'mock') return;
  if (rows[0].status !== 'paid')
    throw conflict('PAYMENT_REQUIRED', 'Đơn hàng chưa được thanh toán trong môi trường thử nghiệm');
}

export async function markPaymentOnOrderCancelled(orderId: string) {
  await ensureOperationsSchema();
  await prisma.$executeRaw`
    UPDATE payment_transactions
    SET status=CASE WHEN status='paid' THEN 'refunded' ELSE 'expired' END, updated_at=now()
    WHERE order_id=${orderId}::uuid AND status IN ('pending','paid')
  `;
}

export async function settleSellerOrderPayment(orderId: string, sellerId: string, referenceCode = 'POS_CASH') {
  const order = await prisma.orders.findUnique({ where: { id: orderId }, select: { id: true, stall_id: true } });
  if (!order) throw notFound('Không tìm thấy đơn hàng');
  const contract = await prisma.contracts.findFirst({ where: { merchant_id: sellerId, stall_id: order.stall_id, ended_at: null }, select: { id: true } });
  if (!contract) throw notFound('Đơn hàng không thuộc sạp của bạn');
  return updatePaymentStatus(orderId, 'paid', undefined, referenceCode);
}
