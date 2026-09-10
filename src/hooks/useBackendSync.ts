'use client';

/**
 * USE BACKEND SYNC HOOK
 * Hook đồng bộ dữ liệu thời gian thực giữa Web CMS và Core Backend API.
 * Hỗ trợ chuyển đổi tự động sang MarketEntity v3.2.0,
 * và tự động fallback sang client data nếu Backend đang ở trạng thái offline.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiClientError } from '@/lib/api-client';
import type { Stall, Zone, Market, Complaint, Application } from '@/types/backend';
import { adaptBackendToCanonicalDocument } from '@/spatial/backendAdapter';
import type { MarketEntity } from '@/spatial/model/types';
import { CLIENT_MARKETS, CLIENT_ZONES, CLIENT_STALLS, CLIENT_COMPLAINTS } from '@/data/clientCmsData';

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
  });

  const syncData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. Kiểm tra kết nối Backend
      await api.get('/settings/public').catch(() => null);

      // 2. Tải dữ liệu song song từ Backend (lấy limit=100 để đồng bộ trọn vẹn 100% dữ liệu các chợ)
      const [marketsData, stallsData, complaintsData, applicationsData] = await Promise.allSettled([
        api.get<Market[]>('/admin/markets'),
        api.get<Stall[]>('/admin/stalls?limit=100'),
        api.get<Complaint[]>('/admin/complaints?limit=100'),
        api.get<Application[]>('/admin/merchant-approvals?limit=100'),
      ]);

      const markets: Market[] =
        marketsData.status === 'fulfilled' && Array.isArray(marketsData.value) ? marketsData.value : (CLIENT_MARKETS as Market[]);
      const stalls: Stall[] =
        stallsData.status === 'fulfilled' && Array.isArray(stallsData.value) ? stallsData.value : (CLIENT_STALLS as Stall[]);
      const complaints: Complaint[] =
        complaintsData.status === 'fulfilled' && Array.isArray(complaintsData.value) ? complaintsData.value : (CLIENT_COMPLAINTS as Complaint[]);
      const applications: Application[] =
        applicationsData.status === 'fulfilled' && Array.isArray(applicationsData.value) ? applicationsData.value : [];

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

      // Cập nhật state cục bộ ngay lập tức
      setState((prev) => {
        const updatedComplaints = prev.complaints.map((c) =>
          c.id === realId || c.code === complaintIdOrCode
            ? { ...c, status: 'resolved' as const, resolutionNote, resolvedAt: new Date().toISOString() }
            : c
        );
        const currentMarket = prev.markets[0] || (CLIENT_MARKETS[0] as Market);
        const canonicalDoc = adaptBackendToCanonicalDocument({
          market: currentMarket,
          zones: prev.zones,
          stalls: prev.stalls,
          complaints: updatedComplaints,
        });

        return {
          ...prev,
          complaints: updatedComplaints,
          canonicalDoc,
        };
      });
    },
    [state.isConnected, state.complaints]
  );

  // Hành động phê duyệt hồ sơ tiểu thương (kết nối Backend API POST /admin/merchant-approvals/:id/approve)
  const approveApplication = useCallback(
    async (applicationId: string, stallId?: string, adminNote: string = 'BQL Chợ đã phê duyệt hồ sơ') => {
      let targetStallId = stallId;
      if (!targetStallId) {
        const app = state.applications.find((a) => a.id === applicationId);
        const marketStalls = state.stalls.filter((s) => !app?.marketId || s.marketId === app.marketId);
        const candidateStall = marketStalls.find((s) => s.status === 'vacant') || marketStalls[0];
        targetStallId = candidateStall?.id || state.stalls[0]?.id;
      }

      if (state.isConnected && targetStallId) {
        try {
          await api.post(`/admin/merchant-approvals/${applicationId}/approve`, {
            stallId: targetStallId,
            adminNote,
          });
        } catch (e) {
          console.warn('[useBackendSync] Không thể duyệt hồ sơ lên backend:', e);
        }
      }

      // Cập nhật state cục bộ ngay lập tức
      setState((prev) => ({
        ...prev,
        applications: prev.applications.map((a) =>
          a.id === applicationId ? { ...a, status: 'approved' as const, adminNote } : a
        ),
      }));
    },
    [state.isConnected, state.applications, state.stalls]
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

