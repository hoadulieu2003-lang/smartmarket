import { describe, it, expect } from 'vitest';
import {
  deriveStallOperationalState,
  adaptBackendStallToCanonical,
  adaptBackendToCanonicalDocument,
} from './backendAdapter';
import type { Stall, Zone, Market, Complaint } from '@/types/backend';
import type { RectangleGeometry } from './model/types';

describe('Canonical Spatial Backend Adapter', () => {
  const mockMarket: Market = {
    id: 'market-1',
    provinceId: 'prov-1',
    code: 'DX-HN',
    name: 'Chợ Đồng Xuân',
    address: 'Hoàn Kiếm, Hà Nội',
    latitude: 21.037,
    longitude: 105.85,
    phone: '02438281530',
    email: 'bql@smartmarket.vn',
    description: 'Chợ trung tâm',
    images: [],
    openHours: '06:00 - 21:00',
    mapLink: null,
    googleMapsUrl: null,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockZone: Zone = {
    id: 'zone-a',
    marketId: 'market-1',
    code: 'KHU-A',
    name: 'Khu A - Hải sản',
    description: 'Khu vực tươi sống',
    displayOrder: 1,
    gridColumns: 5,
    isActive: true,
  };

  const mockStallNormal: Stall = {
    id: 'stall-1',
    marketId: 'market-1',
    zoneId: 'zone-a',
    code: 'A-01',
    name: 'Sạp Tươi Sống Mai Hoa',
    description: 'Chuyên cá biển',
    images: [],
    acreage: 4.5,
    phone: '0912345678',
    openHours: '06:00 - 18:00',
    status: 'occupied',
    displayOrder: 0,
    currentContract: {
      id: 'contract-1',
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      daysLeft: 120,
      fee: 2500000,
      merchant: {
        id: 'merchant-1',
        fullName: 'Nguyễn Thị Mai',
        phone: '0912345678',
        avatar: null,
      },
    },
  };

  it('xử lý sạp bình thường (Normal) không có sự cố', () => {
    const opState = deriveStallOperationalState(mockStallNormal, []);
    expect(opState.isOccupied).toBe(true);
    expect(opState.occupancyStatus).toBe('active');
    expect(opState.hasActiveIssues).toBe(false);
    expect(opState.hasCriticalComplaint).toBe(false);
    expect(opState.isExpiringSoon).toBe(false);
    expect(opState.issues).toHaveLength(0);
  });

  it('xử lý sạp trống (Vacant / Empty)', () => {
    const vacantStall: Stall = {
      ...mockStallNormal,
      id: 'stall-2',
      code: 'A-02',
      status: 'vacant',
      currentContract: null,
    };
    const opState = deriveStallOperationalState(vacantStall, []);
    expect(opState.isOccupied).toBe(false);
    expect(opState.occupancyStatus).toBe('empty');
    expect(opState.hasActiveIssues).toBe(false);
  });

  it('xử lý sạp có khiếu nại khẩn cấp P0 (Weighing Fraud Complaint)', () => {
    const fraudComplaint: Complaint = {
      id: 'comp-1',
      marketId: 'market-1',
      stallId: 'stall-1',
      type: 'weighing_fraud',
      content: 'Cân thiếu 200g mực tươi',
      images: [],
      status: 'new',
      createdAt: '2026-09-09T10:00:00Z',
    };

    const opState = deriveStallOperationalState(mockStallNormal, [fraudComplaint]);
    expect(opState.hasActiveIssues).toBe(true);
    expect(opState.hasCriticalComplaint).toBe(true);
    expect(opState.highestSeverity).toBe('critical');
    expect(opState.issues).toHaveLength(1);
    expect(opState.issues[0].severity).toBe('critical');
    expect(opState.issues[0].type).toBe('complaint');
  });

  it('xử lý sạp hợp đồng sắp hết hạn (Expiring Contract <= 30 days)', () => {
    const expiringStall: Stall = {
      ...mockStallNormal,
      currentContract: {
        ...mockStallNormal.currentContract!,
        daysLeft: 14,
      },
    };

    const opState = deriveStallOperationalState(expiringStall, []);
    expect(opState.hasActiveIssues).toBe(true);
    expect(opState.isExpiringSoon).toBe(true);
    expect(opState.contractDaysLeft).toBe(14);
    expect(opState.issues).toHaveLength(1);
    expect(opState.issues[0].type).toBe('contract_expiry');
    expect(opState.issues[0].severity).toBe('medium');
  });

  it('xử lý sạp đa sự cố (Multi-Status: P0 Complaint + Expiring Contract)', () => {
    const multiStall: Stall = {
      ...mockStallNormal,
      currentContract: {
        ...mockStallNormal.currentContract!,
        daysLeft: 5,
      },
    };

    const fraudComplaint: Complaint = {
      id: 'comp-1',
      marketId: 'market-1',
      stallId: 'stall-1',
      type: 'weighing_fraud',
      content: 'Cân thiếu cân',
      images: [],
      status: 'new',
      createdAt: '2026-09-09T10:00:00Z',
    };

    const opState = deriveStallOperationalState(multiStall, [fraudComplaint]);
    expect(opState.hasActiveIssues).toBe(true);
    expect(opState.issues).toHaveLength(2);
    expect(opState.highestSeverity).toBe('critical');
    expect(opState.hasCriticalComplaint).toBe(true);
    expect(opState.isExpiringSoon).toBe(true);
  });

  it('chuyển đổi 1 Stall sang StallEntity với tọa độ hình học chuẩn xác', () => {
    const stallEntity = adaptBackendStallToCanonical(mockStallNormal, mockZone, 0, 0, []);
    expect(stallEntity.id).toBe('stall-1');
    expect(stallEntity.code).toBe('A-01');
    expect(stallEntity.zoneId).toBe('zone-a');
    expect(stallEntity.geometry.type).toBe('rectangle');
    const rect = stallEntity.geometry as RectangleGeometry;
    expect(rect.width).toBe(120);
    expect(rect.height).toBe(120);
    expect(stallEntity.metadata.merchantName).toBe('Nguyễn Thị Mai');
  });

  it('chuyển đổi toàn bộ dữ liệu Backend thành MarketEntity v3.2.0', () => {
    const doc = adaptBackendToCanonicalDocument({
      market: mockMarket,
      zones: [mockZone],
      stalls: [mockStallNormal],
      complaints: [],
    });

    expect(doc.schemaVersion).toBe('3.2.0');
    expect(doc.id).toBe('market-1');
    expect(doc.floors).toHaveLength(1);
    expect(doc.floors[0].zones).toHaveLength(1);
    expect(doc.floors[0].stalls).toHaveLength(1);
    expect(doc.floors[0].stalls[0].zoneId).toBe(doc.floors[0].zones[0].id);
  });
});
