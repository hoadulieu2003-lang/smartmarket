import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiGet } from '@/services/api';
import { useAuth } from '@/stores';
import type { Category, MePayload, Province, PublicSettings, Stall } from '@/types';

export { toast } from '@/components/ui/toast';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<Category[]>('/categories'),
    staleTime: 10 * 60_000,
  });
}

/** Loại mặt hàng (subcategory) thuộc một ngành hàng — dùng cho form sản phẩm. */
export function useSubcategories(parentId?: string) {
  return useQuery({
    queryKey: ['categories', 'sub', parentId],
    queryFn: () => apiGet<Category[]>(`/categories?parentId=${parentId}`),
    enabled: !!parentId,
    staleTime: 10 * 60_000,
  });
}

/** Quầy của tiểu thương đang đăng nhập (kèm ngành hàng của quầy). */
export function useSellerStall() {
  return useQuery({ queryKey: ['seller-stall'], queryFn: () => apiGet<Stall>('/seller/stall') });
}

export function useProvinces() {
  return useQuery({
    queryKey: ['provinces'],
    queryFn: () => apiGet<Province[]>('/provinces'),
    staleTime: 10 * 60_000,
  });
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: () => apiGet<PublicSettings>('/settings/public'),
    staleTime: 10 * 60_000,
  });
}

/** Đồng bộ lại /auth/me (khi mở lại app, sau khi đổi trạng thái hồ sơ...). */
export function useRefreshMe() {
  const token = useAuth((s) => s.accessToken);
  const setMe = useAuth((s) => s.setMe);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const me = await apiGet<MePayload>('/auth/me');
      setMe(me);
      return me;
    },
    enabled: !!token,
    staleTime: 30_000,
  });
}

export function useDebounce<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
