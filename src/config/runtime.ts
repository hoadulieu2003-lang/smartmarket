/**
 * Nhận biết app đang chạy ở môi trường nào.
 *
 * Đặt ở `config/` chứ không nằm trong `services/zalo` để `services/api` dùng được mà không
 * tạo vòng import (services/zalo vốn đã import services/api).
 *
 * Chỉ hostname chính xác `h5.zdn.vn` là Zalo Mini App. Mọi hostname còn lại
 * là bản Web; không dùng user agent hay biến môi trường để đổi auth flow.
 */
export function isZaloRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.toLowerCase() === 'h5.zdn.vn';
}

/**
 * Địa chỉ gốc của API.
 *
 * Hai kiểu triển khai KHÁC HẲN nhau, đừng gộp:
 *
 *  1. Zalo Mini App — chạy trên `h5.zdn.vn`, KHÔNG đi qua Nginx của mình nên không dùng được
 *     đường dẫn tương đối. Bắt buộc `VITE_API_URL` là URL tuyệt đối của API production, và
 *     `CORS_ORIGINS` phía backend phải chứa `https://h5.zdn.vn`.
 *
 *  2. Bản web tự host (container app-zalo) — Nginx đã proxy `/api/v1` sang backend nên dùng
 *     đường dẫn tương đối là gọn nhất, không cần CORS.
 */
export function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (isZaloRuntime()) {
    try {
      if (!configured) throw new Error('missing');
      const url = new URL(configured);
      if (url.protocol !== 'https:' || !url.host) throw new Error('not-https');
      return configured;
    } catch {
      console.error(
        '[cấu hình] Bản chạy trong Zalo bắt buộc có VITE_API_URL là URL HTTPS tuyệt đối, ' +
          'ví dụ VITE_API_URL=https://api.example.com/api/v1',
      );
      return '';
    }
  }
  return configured || '/api/v1';
}
