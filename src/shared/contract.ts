import type { Prisma } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * Điều kiện "hợp đồng đang hiệu lực" — DÙNG CHUNG cho seller guard, catalog, đơn hàng,
 * thông báo. Trước đây mỗi nơi tự viết `{ ended_at: null }` nên hợp đồng đã quá hạn mà
 * chưa ai bấm kết thúc thì tiểu thương vẫn giữ nguyên quyền.
 *
 * Đủ 3 vế: đã tới ngày bắt đầu · chưa qua ngày hết hạn · chưa bị kết thúc thủ công.
 *
 * `start_date`/`end_date` là kiểu DATE — Prisma trả về nửa đêm **UTC** của đúng ngày đó.
 * Vì vậy phải so với nửa đêm UTC của NGÀY HÔM NAY (theo lịch máy chủ), chứ không so với
 * mốc giờ địa phương: máy chủ ở múi giờ âm (vd UTC-5) sẽ khoá hợp đồng sớm mất một ngày.
 * Cách này cho kết quả giống nhau ở mọi múi giờ:
 *  - hợp đồng bắt đầu hôm nay → có hiệu lực ngay từ 0h
 *  - hợp đồng hết hạn hôm nay → dùng được HẾT NGÀY CUỐI, sang hôm sau mới mất
 */
export function effectiveContractWhere(now: Date = new Date()): Prisma.contractsWhereInput {
  const d = dayjs(now);
  const today = new Date(Date.UTC(d.year(), d.month(), d.date()));
  return {
    ended_at: null,
    start_date: { lte: today },
    OR: [{ end_date: null }, { end_date: { gte: today } }],
  };
}

/**
 * ⚠️ Object trả về có key `OR`. Khi spread vào một `where` mà call-site ĐÃ có `OR` riêng
 * thì một trong hai sẽ bị ghi đè im lặng. Hiện mọi call-site đều an toàn (hoặc không có
 * `OR` cùng cấp, hoặc dùng qua `occupiedStallWhere` nên `OR` nằm lồng bên trong
 * `contracts.some`). Thêm call-site mới thì kiểm lại điểm này.
 */

/** Sạp đang có người thuê hợp lệ — dùng cho catalog công khai. */
export function occupiedStallWhere(now: Date = new Date()): Prisma.stallsWhereInput {
  return { status: 'occupied', contracts: { some: effectiveContractWhere(now) } };
}
