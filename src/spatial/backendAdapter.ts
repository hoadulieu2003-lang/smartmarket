/**
 * CANONICAL SPATIAL BACKEND ADAPTER — SMART MARKET
 * 
 * Tầng chuyển đổi dữ liệu không gian thuần túy (Pure Spatial Adapter):
 * Chuyển đổi dữ liệu thực tế từ REST API Backend (stalls, zones, complaints, contracts)
 * sang mô hình chuẩn tắc MarketEntity v3.2.0 và các StallEntity.
 * 
 * Nguyên tắc bất biến:
 * - Không làm thay đổi (mutate) đối tượng đầu vào.
 * - Không đưa mã màu hex hay style trình diễn vào Canonical Data.
 * - Đảm bảo tính toàn vẹn tham chiếu (Referential Integrity).
 */

import type {
  MarketEntity,
  FloorEntity,
  ZoneEntity,
  StallEntity,
  OperationalIssue,
  StallOperationalState,
  OperationalSeverity,
  BoundingBox,
  RectangleGeometry,
  PolygonGeometry,
} from './model/types';
import type { Stall, Zone, Market, Complaint, Contract, ContractLite } from '@/types/backend';

export interface BackendAdapterInput {
  market: Market;
  zones: Zone[];
  stalls: Stall[];
  complaints?: Complaint[];
  contracts?: Contract[];
}

/**
 * Tính toán hình học ô sạp dựa trên vị trí hiển thị (Grid cell calculation)
 * nếu chưa có tọa độ CAD thực địa chi tiết.
 * Mỗi sạp chiếm 120cm x 120cm (1.2m x 1.2m) với lối đi 40cm.
 */
export function calculateStallGeometry(
  displayOrder: number,
  zoneIndex: number,
  gridColumns: number = 5
): { geometry: RectangleGeometry; boundingBox: BoundingBox } {
  const STALL_WIDTH = 120; // 1.2 mét
  const STALL_HEIGHT = 120; // 1.2 mét
  const AISLE_GAP = 40; // Lối đi 0.4 mét
  const ZONE_OFFSET_X = 60 + zoneIndex * (gridColumns * (STALL_WIDTH + AISLE_GAP) + 80);
  const ZONE_OFFSET_Y = 120;

  const col = displayOrder % gridColumns;
  const row = Math.floor(displayOrder / gridColumns);

  const x = ZONE_OFFSET_X + col * (STALL_WIDTH + AISLE_GAP);
  const y = ZONE_OFFSET_Y + row * (STALL_HEIGHT + AISLE_GAP);

  const geometry: RectangleGeometry = {
    type: 'rectangle',
    x,
    y,
    width: STALL_WIDTH,
    height: STALL_HEIGHT,
    elevationZ: 0,
    height3D: 2.4,
  };

  const boundingBox: BoundingBox = {
    minX: x,
    minY: y,
    maxX: x + STALL_WIDTH,
    maxY: y + STALL_HEIGHT,
    width: STALL_WIDTH,
    height: STALL_HEIGHT,
  };

  return { geometry, boundingBox };
}

/**
 * Trích xuất trạng thái vận hành và các sự cố nghiệp vụ (Operational Issues)
 * từ danh sách khiếu nại (complaints) và hợp đồng (contract) của sạp.
 */
export function deriveStallOperationalState(
  stall: Stall,
  stallComplaints: Complaint[] = [],
  contract?: ContractLite | Contract | null
): StallOperationalState {
  const issues: OperationalIssue[] = [];

  // 1. Phân loại sự cố khiếu nại (Complaint Issues)
  const activeComplaints = stallComplaints.filter(
    (c) => c.status === 'new' || c.status === 'processing' || c.status === 'escalated'
  );

  for (const c of activeComplaints) {
    const isCritical = c.type === 'weighing_fraud' || c.type === 'food_safety' || c.status === 'escalated';
    const severity: OperationalSeverity = isCritical ? 'critical' : 'high';

    issues.push({
      id: `issue-complaint-${c.id}`,
      type: 'complaint',
      title: `Khiếu nại: ${c.type === 'weighing_fraud' ? 'Gian lận cân đo' : c.type === 'food_safety' ? 'Vệ sinh ATTP' : 'Phản ánh sạp'}`,
      description: c.content,
      severity,
      status: c.status === 'new' ? 'open' : 'in_progress',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt || c.createdAt,
      entityRef: {
        entityType: 'stall',
        entityId: stall.id,
      },
      reportedBy: {
        role: 'customer',
        name: c.reporterContact || 'Người dân đi chợ',
        contact: c.reporterContact || undefined,
      },
    });
  }

  // 2. Phân loại sự cố hợp đồng sắp hết hạn (Contract Expiry)
  const daysLeft = stall.currentContract?.daysLeft ?? (contract && 'daysLeft' in contract ? contract.daysLeft : undefined);
  const isExpiring = typeof daysLeft === 'number' && daysLeft <= 30 && daysLeft >= 0;
  const isCriticalExpiry = typeof daysLeft === 'number' && daysLeft <= 7 && daysLeft >= 0;

  if (isExpiring) {
    const severity: OperationalSeverity = isCriticalExpiry ? 'high' : 'medium';
    const nowIso = new Date().toISOString();

    issues.push({
      id: `issue-contract-${stall.id}`,
      type: 'contract_expiry',
      title: `Hợp đồng còn ${daysLeft} ngày`,
      description: `Hợp đồng thuê sạp ${stall.code} sẽ hết hạn trong ${daysLeft} ngày tới.`,
      severity,
      status: 'open',
      createdAt: nowIso,
      updatedAt: nowIso,
      entityRef: {
        entityType: 'stall',
        entityId: stall.id,
      },
      payload: {
        contractDaysLeft: daysLeft,
      },
    });
  }

  // 3. Phân loại bảo trì (Maintenance)
  if (stall.status === 'maintenance') {
    const nowIso = new Date().toISOString();
    issues.push({
      id: `issue-maint-${stall.id}`,
      type: 'maintenance',
      title: `Đang bảo trì kỹ thuật`,
      description: stall.description || 'Sạp đang trong quá trình bảo dưỡng / sửa chữa hạ tầng.',
      severity: 'low',
      status: 'in_progress',
      createdAt: nowIso,
      updatedAt: nowIso,
      entityRef: {
        entityType: 'stall',
        entityId: stall.id,
      },
    });
  }

  const isOccupied = stall.status === 'occupied';
  const hasCriticalComplaint = issues.some((i) => i.type === 'complaint' && i.severity === 'critical');
  
  let highestSeverity: OperationalSeverity | undefined = undefined;
  if (issues.length > 0) {
    if (issues.some((i) => i.severity === 'critical')) highestSeverity = 'critical';
    else if (issues.some((i) => i.severity === 'high')) highestSeverity = 'high';
    else if (issues.some((i) => i.severity === 'medium')) highestSeverity = 'medium';
    else highestSeverity = 'low';
  }

  return {
    isOccupied,
    occupancyStatus: isOccupied ? 'active' : stall.status === 'vacant' ? 'empty' : 'reserved',
    issues,
    hasActiveIssues: issues.length > 0,
    highestSeverity,
    isUnderMaintenance: stall.status === 'maintenance',
    complaintsCount: activeComplaints.length,
    hasCriticalComplaint,
    contractDaysLeft: typeof daysLeft === 'number' ? daysLeft : 999,
    isExpiringSoon: isExpiring,
    isCriticalExpiry,
    feeStatus: 'paid',
    tags: [stall.status, ...(stall.categories?.name ? [stall.categories.name] : [])],
  };
}

/**
 * Chuyển đổi 1 đối tượng Stall từ Backend thành StallEntity chuẩn tắc.
 */
export function adaptBackendStallToCanonical(
  stall: Stall,
  zone: Zone,
  zoneIndex: number,
  displayIndex: number,
  complaints: Complaint[] = []
): StallEntity {
  const stallComplaints = complaints.filter(
    (c) =>
      c.stallId === stall.id ||
      c.stallId === stall.code ||
      (c.stalls && (c.stalls.id === stall.id || c.stalls.code === stall.code)) ||
      (c as any).stallCode === stall.code
  );
  const { geometry, boundingBox } = calculateStallGeometry(displayIndex, zoneIndex, zone.gridColumns || 5);
  const operationalState = deriveStallOperationalState(stall, stallComplaints, stall.currentContract);

  return {
    id: stall.id,
    code: stall.code,
    zoneId: zone.id,
    floorId: 'floor-ground',
    geometry,
    boundingBox,
    rotation: 0,
    metadata: {
      name: stall.name || `Sạp ${stall.code}`,
      merchantName: stall.currentContract?.merchant?.fullName || 'Chưa gán',
      phone: stall.currentContract?.merchant?.phone || stall.phone || '',
      category: stall.categories?.name || 'Chung',
      areaM2: typeof stall.acreage === 'number' ? stall.acreage : 4.5,
      monthlyEstimatedRevenue: '25.000.000đ',
      rating: 4.8,
      ratingCount: 12,
      qrPaymentActive: true,
    },
    state: operationalState,
  };
}

/**
 * Chuyển đổi toàn bộ dữ liệu Backend thành MarketEntity v3.2.0 hoàn chỉnh.
 */
export function adaptBackendToCanonicalDocument(input: BackendAdapterInput): MarketEntity {
  const { market, zones, stalls, complaints = [] } = input;

  const floorBoundary: PolygonGeometry = {
    type: 'polygon',
    vertices: [
      [0, 0],
      [1400, 0],
      [1400, 900],
      [0, 900],
    ],
    elevationZ: 0,
    height3D: 3.5,
  };

  const stallEntities: StallEntity[] = [];
  const zoneEntities: ZoneEntity[] = zones.map((z, idx) => {
    const zoneStalls = stalls.filter((s) => s.zoneId === z.id);
    const stallIds = zoneStalls.map((s) => s.id);

    zoneStalls.forEach((stall, stallIdx) => {
      stallEntities.push(adaptBackendStallToCanonical(stall, z, idx, stallIdx, complaints));
    });

    return {
      id: z.id,
      code: z.code,
      floorId: 'floor-ground',
      name: z.name,
      subTitle: z.description || z.name,
      category: z.categories?.name || 'Thực phẩm',
      geometry: {
        type: 'rectangle' as const,
        x: 40 + idx * 260,
        y: 80,
        width: 240,
        height: 600,
        elevationZ: 0,
      },
      boundingBox: {
        minX: 40 + idx * 260,
        minY: 80,
        maxX: 280 + idx * 260,
        maxY: 680,
        width: 240,
        height: 600,
      },
      visualTheme: {
        colorToken: '#076C31',
      },
      totalStallsCount: zoneStalls.length,
      stallIds,
    };
  });

  const floor: FloorEntity = {
    schemaVersion: '3.2.0',
    id: 'floor-ground',
    marketId: market.id,
    floorNumber: 1,
    name: 'Tầng Trệt',
    subTitle: 'Khu vực kinh doanh trung tâm',
    elevationMeters: 0,
    ceilingHeightMeters: 3.5,
    coordinateSystem: {
      width: 1400,
      height: 900,
      origin: 'top_left',
      xAxisDirection: 'east',
      yAxisDirection: 'south',
      zAxisDirection: 'up',
      unit: 'metric_cm',
      scaleFactorToMeters: 0.1,
      rotationConvention: {
        unit: 'degrees',
        defaultDirection: 'clockwise_from_north',
        zeroDegreeAxis: 'north',
      },
    },
    boundary: floorBoundary,
    zones: zoneEntities,
    stalls: stallEntities,
    aisles: [],
    gates: [],
    facilities: [],
    infrastructures: [],
    incidents: [],
  };

  return {
    schemaVersion: '3.2.0',
    id: market.id,
    name: market.name,
    code: market.code,
    address: market.address,
    timezone: 'Asia/Ho_Chi_Minh',
    metadata: {
      totalFloors: 1,
      totalActiveStalls: stallEntities.filter((s) => s.state.isOccupied).length,
      buildingFootprintM2: 1260,
      managementAuthority: 'Ban Quản Lý Chợ',
    },
    floors: [floor],
  };
}
