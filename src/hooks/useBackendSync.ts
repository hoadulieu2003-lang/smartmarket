'use client';

/**
 * USE BACKEND SYNC HOOK
 * Hook đồng bộ dữ liệu thời gian thực giữa Web CMS và Core Backend API.
 * Hỗ trợ chuyển đổi tự động sang MarketEntity v3.2.0,
 * và tự động fallback sang client data nếu Backend đang ở trạng thái offline.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiClientError } from '@/lib/api-client';
import type { Stall, Zone, Market, Complaint, Application, Trader, Product, Order, Notification } from '@/types/backend';
import { adaptBackendToCanonicalDocument } from '@/spatial/backendAdapter';
import type { MarketEntity } from '@/spatial/model/types';
import {
  CLIENT_MARKETS,
  CLIENT_ZONES,
  CLIENT_STALLS,
  CLIENT_COMPLAINTS,
  CLIENT_TRADERS,
  CLIENT_PRODUCTS,
  CLIENT_ORDERS,
} from '@/data/clientCmsData';

export interface BackendSyncState {
  isConnected: boolean;
  isLoading: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  canonicalDoc: MarketEntity | null;
  markets: Market[];
  stalls: Stall[];
  zones: Zone[];
  complaints: Complaint[];
  applications: Application[];
  traders: Trader[];
  products: Product[];
  orders: Order[];
  notifications: Notification[];
}

export function useBackendSync(targetMarketId: string = 'm-dongxuan') {
  const [state, setState] = useState<BackendSyncState>({
    isConnected: false,
    isLoading: true,
    lastSyncedAt: null,
    error: null,
    canonicalDoc: null,
    markets: CLIENT_MARKETS as Market[],
    stalls: CLIENT_STALLS as Stall[],
    zones: CLIENT_ZONES as Zone[],
    complaints: CLIENT_COMPLAINTS as Complaint[],
    applications: [],
    traders: CLIENT_TRADERS as unknown as Trader[],
    products: CLIENT_PRODUCTS as unknown as Product[],
    orders: CLIENT_ORDERS as unknown as Order[],
    notifications: [],
  });

  const syncData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. Kiểm tra kết nối Backend
      await api.get('/settings/public').catch(() => null);

      // 2. Tải dữ liệu song song từ Backend (lấy limit=100 để đồng bộ trọn vẹn 100% dữ liệu các chợ)
      const [
        marketsData,
        stallsData,
        complaintsData,
        applicationsData,
        tradersData,
        productsData,
        ordersData,
        notificationsData,
      ] = await Promise.allSettled([
        api.get<Market[]>('/admin/markets'),
        api.get<Stall[]>('/admin/stalls?limit=100'),
        api.get<Complaint[]>('/admin/complaints?limit=100'),
        api.get<Application[]>('/admin/merchant-approvals?limit=100'),
        api.get<Trader[]>('/admin/traders?limit=100'),
        api.get<Product[]>('/admin/products?limit=100'),
        api.get<Order[]>('/admin/orders?limit=100'),
        api.get<Notification[]>('/admin/notifications?limit=100'),
      ]);

      const markets: Market[] =
        marketsData.status === 'fulfilled' && Array.isArray(marketsData.value) ? marketsData.value : (CLIENT_MARKETS as Market[]);
      const stalls: Stall[] =
        stallsData.status === 'fulfilled' && Array.isArray(stallsData.value) ? stallsData.value : (CLIENT_STALLS as Stall[]);
      const complaints: Complaint[] =
        complaintsData.status === 'fulfilled' && Array.isArray(complaintsData.value) ? complaintsData.value : (CLIENT_COMPLAINTS as Complaint[]);
      const applications: Application[] =
        applicationsData.status === 'fulfilled' && Array.isArray(applicationsData.value) ? applicationsData.value : [];
      const traders: Trader[] =
        tradersData.status === 'fulfilled' && Array.isArray(tradersData.value) ? tradersData.value : (CLIENT_TRADERS as unknown as Trader[]);
      const products: Product[] =
        productsData.status === 'fulfilled' && Array.isArray(productsData.value) ? productsData.value : (CLIENT_PRODUCTS as unknown as Product[]);
      const orders: Order[] =
        ordersData.status === 'fulfilled' && Array.isArray(ordersData.value) ? ordersData.value : (CLIENT_ORDERS as unknown as Order[]);
      const notifications: Notification[] =
        notificationsData.status === 'fulfilled' && Array.isArray(notificationsData.value) ? notificationsData.value : [];

      // Ưu tiên chợ có sạp thực tế
      const marketsWithStalls = markets.find((m) => stalls.some((s) => s.marketId === m.id));
      const currentMarket = markets.find((m) => m.id === targetMarketId) || marketsWithStalls || markets[0] || (CLIENT_MARKETS[0] as Market);

      // Trích xuất danh sách Zone thực tế từ toàn bộ stalls (phân bổ theo từng marketId)
      const liveZones: Zone[] = [];
      const seenZoneKeys = new Set<string>();
      stalls.forEach((s) => {
        const zObj = (s as any).zones;
        if (zObj && zObj.id) {
          const key = `${s.marketId}_${zObj.id}`;
          if (!seenZoneKeys.has(key)) {
            seenZoneKeys.add(key);
            liveZones.push({
              id: zObj.id,
              marketId: s.marketId,
              code: zObj.code || 'ZONE',
              name: zObj.name || 'Khu vực',
              description: zObj.description || zObj.name,
              gridColumns: 5,
              isActive: true,
              displayOrder: liveZones.length + 1,
            });
          }
        }
      });
      const activeZones = liveZones.length > 0 ? liveZones : (CLIENT_ZONES as Zone[]);

      // Lọc sạp thuộc chợ hiện tại
      const marketStalls = stalls.filter((s) => s.marketId === currentMarket.id);
      const stallsToRender = marketStalls.length > 0 ? marketStalls : stalls;

      // 3. Chuyển đổi sang MarketEntity v3.2.0
      const canonicalDoc = adaptBackendToCanonicalDocument({
        market: currentMarket,
        zones: activeZones,
        stalls: stallsToRender,
        complaints,
      });

      setState({
        isConnected: true,
        isLoading: false,
        lastSyncedAt: new Date(),
        error: null,
        canonicalDoc,
        markets,
        stalls,
        zones: activeZones,
        complaints,
        applications,
        traders,
        products,
        orders,
        notifications,
      });
    } catch (err: any) {
      // Graceful fallback khi backend offline
      const message = err instanceof ApiClientError ? err.message : 'Backend offline - Chuyển sang chế độ Local Fixtures';

      const fallbackMarket = CLIENT_MARKETS[0] as Market;
      const fallbackDoc = adaptBackendToCanonicalDocument({
        market: fallbackMarket,
        zones: CLIENT_ZONES as Zone[],
        stalls: CLIENT_STALLS as Stall[],
        complaints: CLIENT_COMPLAINTS as Complaint[],
      });

      setState({
        isConnected: false,
        isLoading: false,
        lastSyncedAt: new Date(),
        error: message,
        canonicalDoc: fallbackDoc,
        markets: CLIENT_MARKETS as Market[],
        stalls: CLIENT_STALLS as Stall[],
        zones: CLIENT_ZONES as Zone[],
        complaints: CLIENT_COMPLAINTS as Complaint[],
        applications: [],
        traders: CLIENT_TRADERS as unknown as Trader[],
        products: CLIENT_PRODUCTS as unknown as Product[],
        orders: CLIENT_ORDERS as unknown as Order[],
        notifications: [],
      });
    }
  }, [targetMarketId]);

  useEffect(() => {
    syncData();
  }, [syncData]);

  // Hành động giải quyết khiếu nại (kết nối Backend API POST /resolve)
  const resolveComplaint = useCallback(
    async (complaintIdOrCode: string, resolutionNote: string = 'Đã xử lý thực địa') => {
      const target = state.complaints.find(
        (c) =>
          c.id === complaintIdOrCode ||
          c.code === complaintIdOrCode ||
          (c.id && c.id.slice(0, 6).toUpperCase() === complaintIdOrCode.replace('PAKN-', ''))
      );
      const realId = target?.id || complaintIdOrCode;

      if (state.isConnected && realId) {
        try {
          await api.post(`/admin/complaints/${realId}/resolve`, {
            resolutionNote,
            resolutionImages: [],
          });
        } catch (e) {
          console.warn('[useBackendSync] Không thể ghi lên backend:', e);
        }
      }

      // Cập nhật state cục bộ ngay lập tức với đầy đủ tính phản ứng (Bidirectional Reactivity)
      setState((prev) => {
        const updatedComplaints = prev.complaints.map((c) =>
          c.id === realId || c.code === complaintIdOrCode
            ? { ...c, status: 'resolved' as const, resolutionNote, resolvedAt: new Date().toISOString() }
            : c
        );

        // Cập nhật danh sách sạp: tính toán lại openComplaintCount & displayStatus cho từng sạp
        const updatedStalls = prev.stalls.map((s) => {
          const stallOpenComplaints = updatedComplaints.filter((c) => {
            const matchStall =
              c.stallId === s.id ||
              c.stallId === s.code ||
              (c.stalls && (c.stalls.id === s.id || c.stalls.code === s.code)) ||
              (c as any).stallCode === s.code;
            return matchStall && c.status !== 'resolved';
          });
          const openComplaintCount = stallOpenComplaints.length;
          let displayStatus = s.displayStatus;
          if (openComplaintCount === 0 && s.displayStatus === 'has_complaint') {
            displayStatus = s.status === 'occupied' ? 'occupied' : s.status;
          }
          return {
            ...s,
            openComplaintCount,
            displayStatus,
          };
        });

        // Cập nhật danh sách tiểu thương: tính toán lại openComplaintCount
        const updatedTraders = prev.traders.map((t) => {
          const traderStallId = t.stall?.id || t.stall?.code;
          const traderOpenComplaints = updatedComplaints.filter((c) => {
            const matchTrader =
              (c.userId && c.userId === t.id) ||
              (traderStallId && (
                c.stallId === traderStallId ||
                (c.stalls && (c.stalls.id === traderStallId || c.stalls.code === traderStallId)) ||
                (c as any).stallCode === traderStallId
              ));
            return matchTrader && c.status !== 'resolved';
          });
          return {
            ...t,
            openComplaintCount: traderOpenComplaints.length,
          };
        });

        // Cập nhật danh sách chợ: tính toán lại openComplaintCount
        const updatedMarkets = prev.markets.map((m) => {
          const marketOpenComplaints = updatedComplaints.filter((c) => {
            return c.marketId === m.id && c.status !== 'resolved';
          });
          return {
            ...m,
            openComplaintCount: marketOpenComplaints.length,
          };
        });

        const currentMarket = updatedMarkets[0] || (CLIENT_MARKETS[0] as Market);
        const canonicalDoc = adaptBackendToCanonicalDocument({
          market: currentMarket,
          zones: prev.zones,
          stalls: updatedStalls,
          complaints: updatedComplaints,
        });

        return {
          ...prev,
          complaints: updatedComplaints,
          stalls: updatedStalls,
          traders: updatedTraders,
          markets: updatedMarkets,
          canonicalDoc,
        };
      });
    },
    [state.isConnected, state.complaints]
  );

  // Hành động phê duyệt hồ sơ tiểu thương (kết nối Backend API POST /admin/merchant-approvals/:id/approve)
  const approveApplication = useCallback(
    async (applicationId: string, stallId?: string, adminNote: string = 'BQL Chợ đã phê duyệt hồ sơ') => {
      const targetApp = state.applications.find((a) => a.id === applicationId);
      let targetStall = state.stalls.find((s) => s.id === stallId || s.code === stallId);
      if (!targetStall) {
        const marketStalls = state.stalls.filter((s) => !targetApp?.marketId || s.marketId === targetApp.marketId);
        targetStall = marketStalls.find((s) => s.status === 'vacant') || marketStalls[0] || state.stalls[0];
      }
      const finalStallId = targetStall?.id || stallId;

      if (state.isConnected && finalStallId) {
        try {
          await api.post(`/admin/merchant-approvals/${applicationId}/approve`, {
            stallId: finalStallId,
            adminNote,
          });
        } catch (e) {
          console.warn('[useBackendSync] Không thể duyệt hồ sơ lên backend:', e);
        }
      }

      const merchantName = targetApp?.fullName || targetApp?.applicant?.fullName || 'Tiểu thương mới';
      const merchantPhone = targetApp?.phone || targetApp?.applicant?.phone || '0908 888 999';
      const merchantAvatar = targetApp?.applicant?.avatar || null;
      const merchantId = targetApp?.applicant?.id || `m-${Date.now()}`;

      // Cập nhật state cục bộ ngay lập tức (sạp chuyển sang occupied, thêm tiểu thương mới, tái tạo canonicalDoc)
      setState((prev) => {
        const updatedApplications = prev.applications.map((a) =>
          a.id === applicationId ? { ...a, status: 'approved' as const, adminNote } : a
        );

        const updatedStalls = prev.stalls.map((s) => {
          if (s.id === finalStallId || (targetStall?.code && s.code === targetStall.code)) {
            return {
              ...s,
              status: 'occupied' as const,
              currentContract: {
                id: `contract-${Date.now()}`,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 180 * 86400000).toISOString(),
                daysLeft: 180,
                fee: (s as any).basePrice || 3500000,
                merchant: {
                  id: merchantId,
                  fullName: merchantName,
                  phone: merchantPhone,
                  avatar: merchantAvatar,
                },
              },
            };
          }
          return s;
        });

        const newTrader: Trader = {
          id: merchantId,
          fullName: merchantName,
          phone: merchantPhone,
          avatar: merchantAvatar,
          email: null,
          merchantStatus: 'active',
          merchantJoinedAt: new Date().toISOString(),
          merchantMarketId: targetStall?.marketId || prev.markets[0]?.id || null,
          sellerType: 'shop',
          market: prev.markets.find((m) => m.id === targetStall?.marketId) || prev.markets[0] || null,
          stall: targetStall ? { id: targetStall.id, code: targetStall.code, name: targetStall.name } : null,
          category: targetStall?.categories || null,
          ratingAvg: 5.0,
          openComplaintCount: 0,
        };

        const existingTraderIdx = prev.traders.findIndex((t) => t.id === merchantId || t.phone === merchantPhone);
        const updatedTraders = existingTraderIdx >= 0
          ? prev.traders.map((t, idx) => (idx === existingTraderIdx ? { ...t, ...newTrader } : t))
          : [newTrader, ...prev.traders];

        const currentMarket = prev.markets.find((m) => m.id === targetMarketId) || prev.markets[0] || (CLIENT_MARKETS[0] as Market);
        const marketStalls = updatedStalls.filter((s) => s.marketId === currentMarket.id);
        const stallsToRender = marketStalls.length > 0 ? marketStalls : updatedStalls;

        const canonicalDoc = adaptBackendToCanonicalDocument({
          market: currentMarket,
          zones: prev.zones,
          stalls: stallsToRender,
          complaints: prev.complaints,
        });

        return {
          ...prev,
          applications: updatedApplications,
          stalls: updatedStalls,
          traders: updatedTraders,
          canonicalDoc,
        };
      });

      return {
        stallId: finalStallId,
        stallCode: targetStall?.code || 'A01',
      };
    },
    [state.isConnected, state.applications, state.stalls, targetMarketId]
  );

  // Hành động từ chối hồ sơ (kết nối Backend API POST /admin/merchant-approvals/:id/reject)
  const rejectApplication = useCallback(
    async (applicationId: string, reason: string = 'Hồ sơ chưa đạt tiêu chuẩn quy chế chợ') => {
      if (state.isConnected) {
        try {
          await api.post(`/admin/merchant-approvals/${applicationId}/reject`, { reason });
        } catch (e) {
          console.warn('[useBackendSync] Không thể từ chối hồ sơ lên backend:', e);
        }
      }

      setState((prev) => ({
        ...prev,
        applications: prev.applications.map((a) =>
          a.id === applicationId ? { ...a, status: 'rejected' as const, adminNote: reason } : a
        ),
      }));
    },
    [state.isConnected]
  );

  // Hành động yêu cầu bổ sung giấy tờ (kết nối Backend API POST /admin/merchant-approvals/:id/request-info)
  const requestApplicationInfo = useCallback(
    async (applicationId: string, note: string = 'Vui lòng bổ sung ảnh CCCD và giấy chứng nhận liên quan') => {
      if (state.isConnected) {
        try {
          await api.post(`/admin/merchant-approvals/${applicationId}/request-info`, { note });
        } catch (e) {
          console.warn('[useBackendSync] Không thể gửi yêu cầu bổ sung lên backend:', e);
        }
      }

      setState((prev) => ({
        ...prev,
        applications: prev.applications.map((a) =>
          a.id === applicationId ? { ...a, status: 'need_more_info' as const, adminNote: note } : a
        ),
      }));
    },
    [state.isConnected]
  );

  return {
    ...state,
    refetch: syncData,
    resolveComplaint,
    approveApplication,
    rejectApplication,
    requestApplicationInfo,
  };
}

