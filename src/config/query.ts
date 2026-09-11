import type { QueryClient } from '@tanstack/react-query';

/**
 * Ngưỡng "còn tươi" theo độ biến động của dữ liệu.
 * Vào lại một trang TRONG khoảng staleTime của nó → React Query ĐỌC CACHE, KHÔNG gọi API.
 * (Đây là cách giảm call khi "tab qua tab lại" mà vẫn giữ đồng bộ, thay vì tự bê sang store.)
 */
export const STALE = {
  /** Taxonomy/cấu hình gần như bất biến trong phiên. */
  config: 10 * 60_000,
  /** Catalog tĩnh: chợ/sạp/sản phẩm — hiếm đổi giữa phiên (checkout còn re-validate giá/tồn ở server). */
  static: 3 * 60_000,
  /** List bị đổi bởi mutation của chính người dùng — đã có invalidateQueries giữ đúng. */
  semi: 60_000,
} as const;

/** Giữ cache trong RAM 30 phút kể cả khi rời trang → quay lại đọc ngay, không refetch. */
export const GC_TIME = 30 * 60_000;

/**
 * Đặt staleTime mặc định theo TIỀN TỐ queryKey (khớp phần tử đầu tiên) — không phải sửa từng call-site.
 * Call-site nào tự set staleTime vẫn được ưu tiên (vd các hook dùng chung).
 * Query KHÔNG liệt kê ở đây là DYNAMIC (unread-count, seller-dashboard, seller-orders/seller-order,
 * order, notifications) → giữ nguyên staleTime mặc định (30s) để luôn tươi.
 */
export function applyQueryDefaults(qc: QueryClient): void {
  const set = (key: string, staleTime: number) => qc.setQueryDefaults([key], { staleTime });

  // Config/taxonomy (đa số hook dùng chung đã set 10' — thêm ở đây cho các key cùng họ).
  (['categories', 'provinces', 'public-settings'] as const).forEach((k) => set(k, STALE.config));

  // Catalog tĩnh trong phiên.
  ([
    'market-home', 'markets', 'market', 'traders', 'stall', 'stall-products',
    'products', 'product', 'product-reviews', 'search-products', 'search-traders',
    'seller-stall', 'seller-product',
  ] as const).forEach((k) => set(k, STALE.static));

  // Semi — đã có invalidation sau mutation giữ đúng.
  ([
    'orders', 'order', 'my-complaints', 'complaint', 'my-merchant-application',
    'my-reviews', 'seller-products', 'seller-promotions',
  ] as const).forEach((k) => set(k, STALE.semi));
}
