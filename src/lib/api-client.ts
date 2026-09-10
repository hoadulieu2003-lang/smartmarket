/**
 * SMART MARKET API CLIENT
 * HTTP Client bọc native fetch hỗ trợ Base URL, Bearer Auth token,
 * Envelope parsing ({ success, data, meta? }), và gracefully fallback.
 */

import type { Envelope, ApiError } from '@/types/backend';

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export class ApiClientError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(status: number, error: ApiError) {
    super(error.message || `API error with status ${status}`);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = error.code || 'UNKNOWN_ERROR';
    this.details = error.details;
  }
}

export async function ensureAdminAuth(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh) {
    const existing = getAuthToken();
    if (existing) return existing;
  }
  try {
    const res = await fetch(`${DEFAULT_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@smartmarket.vn', password: 'Admin@12345' }),
    });
    const json = await res.json();
    if (json?.data?.accessToken) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('smartmarket_auth_token', json.data.accessToken);
        if (json.data.user) {
          localStorage.setItem('smartmarket_user_session', JSON.stringify(json.data.user));
        }
      }
      return json.data.accessToken;
    }
  } catch (err) {
    console.warn('[ApiClient] Failed to auto-login admin:', err);
  }
  return null;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('smartmarket_auth_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = getAuthToken();
  if (!token && !endpoint.includes('/auth/')) {
    token = await ensureAdminAuth();
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${DEFAULT_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && !(options.headers as any)?._retry && !endpoint.includes('/auth/')) {
      if (typeof window !== 'undefined') localStorage.removeItem('smartmarket_auth_token');
      const newToken = await ensureAdminAuth(true);
      if (newToken) {
        return request<T>(endpoint, {
          ...options,
          headers: { ...(options.headers as Record<string, string>), Authorization: `Bearer ${newToken}`, _retry: 'true' },
        });
      }
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const errPayload = await response.json();
        const errObj: ApiError = errPayload.error || {
          code: `HTTP_${response.status}`,
          message: response.statusText,
        };
        throw new ApiClientError(response.status, errObj);
      }
      throw new ApiClientError(response.status, {
        code: `HTTP_${response.status}`,
        message: response.statusText,
      });
    }

    if (!isJson) {
      return (await response.text()) as unknown as T;
    }

    const json = (await response.json()) as Envelope<T>;
    if (json && typeof json === 'object' && 'success' in json) {
      if (!json.success) {
        throw new ApiClientError(response.status, (json as any).error || { code: 'API_ERROR', message: 'API request failed' });
      }
      return json.data;
    }

    return json as unknown as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    // Network error hoặc backend offline
    console.warn(`[ApiClient] Network request failed for ${url}:`, error);
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'DELETE', ...options }),
};

export default api;
