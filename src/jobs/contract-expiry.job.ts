import cron from 'node-cron';
import dayjs from 'dayjs';
import { prisma } from '../shared/prisma';
import { getSetting, SETTING_KEYS } from '../shared/settings';
import { marketManagerIds, notifyUsers } from '../shared/notification.helper';
import { env } from '../config/env';
import { runMockPaymentExpiryJob } from './mock-payment-expiry.job';

/**
 * Quét hợp đồng sắp hết hạn và gửi thông báo (idempotent — không gửi trùng trong 30 ngày).
 * PRD mục 12.1.
 */
export async function runContractExpiryJob(): Promise<{ scanned: number; sent: number }> {
  const threshold = await getSetting<number>(SETTING_KEYS.expiryWarningDays, 30);
  const contracts = await prisma.contracts.findMany({
    where: {
      ended_at: null,
      end_date: {
        gte: dayjs().startOf('day').toDate(),
        lte: dayjs().add(threshold, 'day').endOf('day').toDate(),
      },
    },
    include: { stalls: { include: { markets: { select: { id: true, name: true } } } } },
  });
  let sent = 0;
  for (const c of contracts) {
    const already = await prisma.notifications.findFirst({
      where: {
        ref_type: 'contract',
        ref_id: c.id,
        type: 'fee',
        created_at: { gte: dayjs().subtract(30, 'day').toDate() },
      },
    });
    if (already) continue;
    const daysLeft = dayjs(c.end_date).diff(dayjs().startOf('day'), 'day');
    await prisma.$transaction(async (tx) => {
      const managers = await marketManagerIds(tx, c.stalls.market_id);
      await notifyUsers(tx, {
        userIds: [c.merchant_id, ...managers],
        marketId: c.stalls.market_id,
        title: `Hợp đồng sạp ${c.stalls.code} sắp hết hạn`,
        content: `Hợp đồng thuê sạp ${c.stalls.code} tại ${c.stalls.markets.name} sẽ hết hạn sau ${daysLeft} ngày (${dayjs(c.end_date).format('DD/MM/YYYY')}). Vui lòng liên hệ gia hạn.`,
        type: 'fee',
        priority: 'important',
        refType: 'contract',
        refId: c.id,
      });
    });
    sent += 1;
  }
  return { scanned: contracts.length, sent };
}

export function scheduleJobs() {
  if (!env.ENABLE_CRON) return;
  // 07:00 hằng ngày giờ VN (TZ đặt ở env)
  cron.schedule('0 7 * * *', async () => {
    try {
      await runContractExpiryJob();
    } catch (e) {
      console.error('[cron] contract-expiry failed', e);
    }
  });
  cron.schedule('*/5 * * * *', async () => {
    try {
      await runMockPaymentExpiryJob();
    } catch (e) {
      console.error('[cron] mock-payment-expiry failed', e);
    }
  });
}
