import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuth } from '@/stores';
import type { ApiError, Envelope, Meta } from '@/types';

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const http = axios.create({ baseURL: API_BASE, timeout: 30000 });

http.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;
async function tryRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuth.getState();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
    const data = res.data?.data;
    if (data?.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken as string;
    }
  } catch {
    logout();
  }
  return null;
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ error?: ApiError }>) => {
    const original = error.config as AxiosRequestConfig & { _retried?: boolean };
    const code = (error.response?.data as any)?.error?.code;
    if (
      error.response?.status === 401 &&
      code === 'AUTH_TOKEN_EXPIRED' &&
      !original._retried &&
      useAuth.getState().refreshToken
    ) {
      original._retried = true;
      refreshing = refreshing ?? tryRefresh();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return http(original);
      }
    }
    if (error.response?.status === 401) useAuth.getState().logout();
    return Promise.reject(error);
  },
);

/** Message lỗi tiếng Việt từ response API. */
export function errMsg(e: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại'): string {
  const ax = e as AxiosError<{ error?: ApiError }>;
  return ax?.response?.data?.error?.message ?? (e instanceof Error ? e.message : fallback);
}
export function errCode(e: unknown): string | undefined {
  const ax = e as AxiosError<{ error?: ApiError }>;
  return ax?.response?.data?.error?.code;
}
export function errDetails(e: unknown): any {
  const ax = e as AxiosError<{ error?: ApiError }>;
  return ax?.response?.data?.error?.details;
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await http.get<Envelope<T>>(url, { params });
  return res.data.data;
}
export async function apiGetPaged<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<{ data: T[]; meta: Meta }> {
  const res = await http.get<any>(url, { params });
  const raw = res.data;
  const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  const meta: Meta = raw?.meta || { page: 1, limit: 20, total: list.length, totalPages: 1 };
  return { data: list, meta };
}
export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.post<Envelope<T>>(url, body, config);
  return res.data.data;
}
export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.put<Envelope<T>>(url, body);
  return res.data.data;
}
export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.patch<Envelope<T>>(url, body);
  return res.data.data;
}
export async function apiDelete<T>(url: string): Promise<T> {
  const res = await http.delete<Envelope<T>>(url);
  return res.data.data;
}

/** Upload ảnh (multipart field `files`, tối đa 6, ≤5MB, jpg/png/webp) → danh sách URL. */
export async function uploadImages(files: File[]): Promise<{ url: string }[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  const res = await http.post<Envelope<{ files: { url: string }[] }>>('/uploads', fd);
  return res.data.data.files;
}
