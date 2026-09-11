import dayjs from 'dayjs';
import type {
  ApplicationStatus, ComplaintStatus, ComplaintType, OrderStatus,
} from '@/types';

export const formatMoney = (v?: number | null) => {
  if (v === null || v === undefined) return '—';
  const num = Number(v);
  if (isNaN(num)) return '0đ';
  return `${num.toLocaleString('vi-VN')}đ`;
};

export const formatMoneyInput = (value: string | number) => {
  const digits = String(value).replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const formatDate = (v?: string | Date | null) => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
export const formatDateTime = (v?: string | Date | null) =>
  v ? dayjs(v).format('HH:mm DD/MM/YYYY') : '—';

export const truncate = (s: string | null | undefined, n = 80) =>
  !s ? '' : s.length > n ? `${s.slice(0, n)}…` : s;

/** "x phút trước" đơn giản. */
export function timeAgo(v?: string | null): string {
  if (!v) return '';
  const d = dayjs(v);
  const mins = dayjs().diff(d, 'minute');
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return d.format('DD/MM/YYYY');
}

type ChipTone = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: ChipTone }> = {
  pending: { label: 'Chờ xác nhận', tone: 'warning' },
  confirmed: { label: 'Đã xác nhận', tone: 'info' },
  preparing: { label: 'Đang chuẩn bị', tone: 'info' },
  ready: { label: 'Sẵn sàng lấy', tone: 'primary' },
  completed: { label: 'Hoàn tất', tone: 'success' },
  cancelled: { label: 'Đã hủy', tone: 'error' },
};

/** Các bước tiến trình đơn (seller đẩy tuyến tính). */
export const ORDER_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
export const NEXT_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'completed',
};

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: ChipTone }> = {
  pending: { label: 'Chờ duyệt', tone: 'warning' },
  reviewing: { label: 'Đang xem xét', tone: 'info' },
  need_more_info: { label: 'Cần bổ sung', tone: 'warning' },
  approved: { label: 'Đã duyệt', tone: 'success' },
  rejected: { label: 'Bị từ chối', tone: 'error' },
  cancelled: { label: 'Đã hủy', tone: 'default' },
};

export const COMPLAINT_STATUS: Record<ComplaintStatus, { label: string; tone: ChipTone }> = {
  new: { label: 'Đã tiếp nhận', tone: 'warning' },
  processing: { label: 'Đang xử lý', tone: 'info' },
  resolved: { label: 'Đã xử lý', tone: 'success' },
  rejected: { label: 'Không hợp lệ', tone: 'default' },
  escalated: { label: 'Chuyển cấp trên', tone: 'error' },
};

export const COMPLAINT_TYPE: Record<ComplaintType, string> = {
  product_quality: 'Chất lượng hàng hóa',
  price_issue: 'Giá cả',
  food_safety: 'Vệ sinh ATTP',
  service_attitude: 'Thái độ phục vụ',
  weighing_fraud: 'Cân đo gian lận',
  infrastructure: 'Hạ tầng chợ',
  order_issue: 'Đơn hàng',
  other: 'Khác',
};

/** Giá hiển thị: ưu tiên finalPrice (đã tính khuyến mãi). */
export const displayPrice = (p: { finalPrice?: number; price: number }) => p.finalPrice ?? p.price;

/** Map tone → màu MUI cho Chip. */
export const toneColor: Record<ChipTone, any> = {
  default: 'default', success: 'success', warning: 'warning', error: 'error', info: 'info', primary: 'primary',
};
