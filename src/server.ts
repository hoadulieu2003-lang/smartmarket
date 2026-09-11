import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './shared/prisma';
import { scheduleJobs } from './jobs/contract-expiry.job';

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`Smart Market API chạy tại http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

scheduleJobs();

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return; // tránh chạy shutdown 2 lần khi nhận nhiều tín hiệu
  shuttingDown = true;
  console.log(`${signal} nhận được — đang tắt server...`);
  // Ngừng nhận request mới, nhưng không treo quá lâu vì keep-alive.
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
    setTimeout(resolve, 8_000).unref();
  });
  // Luôn nhả kết nối DB — dù đóng server sạch hay hết giờ chờ — để không rò connection khi restart.
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
