/**
 * SMART MARKET LIVE API CLIENT & SYNC SERVICE
 * Backend Base URL: https://ql.chothongminh.top/api/v1
 * Đồng bộ hóa dữ liệu trực tiếp giữa Production/Staging API và Operational Command Center
 */

import marketsFallback from '@/data/live_synced/markets.json';
import zonesFallback from '@/data/live_synced/zones.json';
import stallsFallback from '@/data/live_synced/stalls.json';
import complaintsFallback from '@/data/live_synced/complaints_list.json';
import complaintsMetricsFallback from '@/data/live_synced/complaints_metrics.json';
import tradersFallback from '@/data/live_synced/traders.json';
import productsFallback from '@/data/live_synced/products.json';
import ordersFallback from '@/data/live_synced/orders.json';
import billingFallback from '@/data/live_synced/billing_summary.json';
import overviewFallback from '@/data/live_synced/dashboard_overview.json';
import chartsFallback from '@/data/live_synced/dashboard_charts.json';
import autoLayoutFallback from '@/data/live_synced/auto_map_layout.json';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ql.chothongminh.top/api/v1';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
  };
  scope: {
    markets: Array<{ id: string; name: string }>;
  };
}

class SmartMarketApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const storedAuth = localStorage.getItem('sm-cms-auth');
        if (storedAuth) {
          const parsed = JSON.parse(storedAuth);
          this.token = parsed?.state?.accessToken || null;
        }
      } catch {
        // ignore
      }
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }

    return res.json();
  }

  // 1. Auth
  async login(identifier = 'mm.dongxuan@smartmarket.vn', password = 'Manager@123'): Promise<AuthSession> {
    const res = await this.request<{ success: boolean; data: AuthSession }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    this.token = res.data.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sm-cms-auth', JSON.stringify({ state: res.data, version: 0 }));
    }
    return res.data;
  }

  // 2. Markets
  async getMarkets() {
    try {
      const res = await this.request<{ success: boolean; data: any[] }>('/admin/markets?limit=100');
      return res.data;
    } catch {
      return marketsFallback.data;
    }
  }

  // 3. Zones
  async getZones(marketId = '30000000-0000-4000-8000-000000000002') {
    try {
      const res = await this.request<{ success: boolean; data: any[] }>(`/admin/markets/${marketId}/zones`);
      return res.data;
    } catch {
      return zonesFallback.data;
    }
  }

  // 4. Stalls
  async getStalls(marketId = '30000000-0000-4000-8000-000000000002') {
    try {
      const res = await this.request<{ success: boolean; data: any[] }>(`/admin/stalls?marketId=${marketId}&page=1&limit=100`);
      return res.data;
    } catch {
      return stallsFallback.data;
    }
  }

  // 5. Map Layout
  async getMapLayout(marketId = '30000000-0000-4000-8000-000000000002') {
    try {
      const res = await this.request<{ success: boolean; data: any }>(`/admin/markets/${marketId}/map-layout`);
      if (res.data?.positions?.length > 0) return res.data;
      return autoLayoutFallback.data;
    } catch {
      return autoLayoutFallback.data;
    }
  }

  // 6. Complaints
  async getComplaints(marketId = '30000000-0000-4000-8000-000000000002', status = 'all') {
    try {
      const query = status === 'all' ? '' : `?status=${status}`;
      const res = await this.request<{ success: boolean; data: any[] }>(`/admin/complaints${query}&marketId=${marketId}`);
      return res.data;
    } catch {
      return complaintsFallback.data;
    }
  }

  // 7. Dashboard
  async getDashboardOverview(marketId = '30000000-0000-4000-8000-000000000002') {
    try {
      const res = await this.request<{ success: boolean; data: any }>(`/admin/dashboard/overview?marketId=${marketId}`);
      return res.data;
    } catch {
      return overviewFallback.data;
    }
  }
}

export const marketApi = new SmartMarketApiClient();
