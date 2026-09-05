import type { FloorEntity } from '../model/types';
import { SAMPLE_FLOOR_1_DATA } from '../model/sampleFloorData';
import { 
  MEGA_FLOOR_DONG_XUAN, 
  MEGA_FLOOR_DONG_XUAN_STANDARD, 
  buildMegaFloorDongXuan, 
  type MapDensityMode 
} from '../../data/megaMarketData';

import { REALISTIC_FLOOR_DATA } from '../../data/realisticMarketData';
import { LIVE_FLOOR_DONG_XUAN } from './liveMarketFixture';

/**
 * ============================================================================
 * FIXTURE A: CHỢ ĐỒNG XUÂN TẦNG 1 (160 SẠP HÀNG • 5 PHÂN KHU CHỨC NĂNG)
 * ============================================================================
 */
export const FIXTURE_A_DONG_XUAN: FloorEntity = MEGA_FLOOR_DONG_XUAN;
export { MEGA_FLOOR_DONG_XUAN_STANDARD, buildMegaFloorDongXuan, type MapDensityMode, REALISTIC_FLOOR_DATA };

/**
 * ============================================================================
 * FIXTURE B: CHỢ BẾN THÀNH PHÂN KHU L (MẶT BẰNG ĐA GIÁC BẤT QUY TẮC L-SHAPE)
 * ============================================================================
 * Đặc điểm kiến trúc:
 * - Đường bao sàn hình chữ L (800 x 800)
 * - 2 Phân khu Zone L1 & Zone L2
 * - Sạp bố trí xoay chéo 30° và 45°
 * - Lối đi bẻ góc 90 độ
 */
export const FIXTURE_B_L_SHAPED_MARKET: FloorEntity = {
  schemaVersion: '3.2.0',
  id: 'floor_ben_thanh_L',
  marketId: 'market_ben_thanh',
  floorNumber: 1,
  name: 'Khu Nhà Lồng Chữ L',
  subTitle: 'Chợ Bến Thành — Cánh Đông & Cánh Bắc',
  elevationMeters: 0.0,
  ceilingHeightMeters: 4.5,
  coordinateSystem: {
    width: 800,
    height: 800,
    origin: 'top_left',
    xAxisDirection: 'east',
    yAxisDirection: 'south',
    zAxisDirection: 'up',
    unit: 'metric_cm',
    scaleFactorToMeters: 0.1,
    rotationConvention: {
      unit: 'degrees',
      defaultDirection: 'clockwise_from_north',
      zeroDegreeAxis: 'north'
    }
  },
  // Chu vi sàn hình L-Shape (Đa giác 6 đỉnh)
  boundary: {
    type: 'polygon',
    vertices: [
      [50, 50],
      [750, 50],
      [750, 380],
      [380, 380],
      [380, 750],
      [50, 750]
    ],
    elevationZ: 0,
    height3D: 4.5
  },
  zones: [
    {
      id: 'zone_L_north',
      code: 'L-BAC',
      floorId: 'floor_ben_thanh_L',
      name: 'Phân khu Cánh Bắc (Lưu niệm & Thủ công mỹ nghệ)',
      subTitle: 'Dọc Trục Hàng Điểm',
      category: 'Hàng thủ công',
      geometry: {
        type: 'rectangle',
        x: 80,
        y: 80,
        width: 640,
        height: 260
      },
      boundingBox: { minX: 80, minY: 80, maxX: 720, maxY: 340, width: 640, height: 260 },
      visualTheme: { colorToken: '#0284c7' },
      totalStallsCount: 8,
      stallIds: ['stall_L01', 'stall_L02_ROTATED', 'stall_L03']
    },
    {
      id: 'zone_L_west',
      code: 'L-TAY',
      floorId: 'floor_ben_thanh_L',
      name: 'Phân khu Cánh Tây (Vải vóc & May mặc)',
      subTitle: 'Dọc Trục Phan Chu Trinh',
      category: 'May mặc & Vải',
      geometry: {
        type: 'rectangle',
        x: 80,
        y: 370,
        width: 270,
        height: 350
      },
      boundingBox: { minX: 80, minY: 370, maxX: 350, maxY: 720, width: 270, height: 350 },
      visualTheme: { colorToken: '#d97706' },
      totalStallsCount: 6,
      stallIds: ['stall_L04', 'stall_L05_MULTI_ISSUE']
    }
  ],
  stalls: [
    {
      id: 'stall_L01',
      code: 'L01',
      zoneId: 'zone_L_north',
      floorId: 'floor_ben_thanh_L',
      geometry: {
        type: 'rectangle',
        x: 100,
        y: 110,
        width: 130,
        height: 80,
        elevationZ: 0,
        height3D: 2.5
      },
      boundingBox: { minX: 100, minY: 110, maxX: 230, maxY: 190, width: 130, height: 80 },
      metadata: {
        name: 'Gốm Sứ Mỹ Nghệ Sài Gòn',
        merchantName: 'Nguyễn Bích Ngọc',
        phone: '0908 123 456',
        category: 'Thủ công mỹ nghệ',
        areaM2: 10.4,
        monthlyEstimatedRevenue: '60.000.000đ',
        rating: 4.9,
        ratingCount: 190,
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        issues: [],
        hasActiveIssues: false,
        isUnderMaintenance: false,
        complaintsCount: 0,
        hasCriticalComplaint: false,
        contractDaysLeft: 180,
        isExpiringSoon: false,
        isCriticalExpiry: false,
        feeStatus: 'paid',
        tags: ['souvenir', 'ceramic']
      }
    },
    // SẠP XOAY CHÉO 30 ĐỘ
    {
      id: 'stall_L02_ROTATED',
      code: 'L02',
      zoneId: 'zone_L_north',
      floorId: 'floor_ben_thanh_L',
      rotation: 30,
      geometry: {
        type: 'rectangle',
        x: 300,
        y: 110,
        width: 120,
        height: 80,
        rotation: 30,
        elevationZ: 0,
        height3D: 2.5
      },
      boundingBox: { minX: 290, minY: 100, maxX: 430, maxY: 200, width: 140, height: 100 },
      metadata: {
        name: 'Tranh Thêu Tay Xoay 30°',
        merchantName: 'Lê Hoàng Phong',
        phone: '0918 889 900',
        category: 'Thủ công mỹ nghệ',
        areaM2: 9.6,
        monthlyEstimatedRevenue: '48.000.000đ',
        rating: 4.8,
        ratingCount: 82,
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        issues: [],
        hasActiveIssues: false,
        isUnderMaintenance: false,
        complaintsCount: 0,
        hasCriticalComplaint: false,
        contractDaysLeft: 120,
        isExpiringSoon: false,
        isCriticalExpiry: false,
        feeStatus: 'paid',
        tags: ['rotated_30deg']
      }
    },
    {
      id: 'stall_L03',
      code: 'L03',
      zoneId: 'zone_L_north',
      floorId: 'floor_ben_thanh_L',
      geometry: {
        type: 'rectangle',
        x: 520,
        y: 110,
        width: 140,
        height: 80,
        elevationZ: 0,
        height3D: 2.5
      },
      boundingBox: { minX: 520, minY: 110, maxX: 660, maxY: 190, width: 140, height: 80 },
      metadata: {
        name: 'Nón Lá & Quà Tặng Việt',
        merchantName: 'Phạm Minh Châu',
        phone: '0933 445 566',
        category: 'Lưu niệm',
        areaM2: 11.2,
        monthlyEstimatedRevenue: '52.000.000đ',
        rating: 4.7,
        ratingCount: 140,
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        issues: [],
        hasActiveIssues: false,
        isUnderMaintenance: false,
        complaintsCount: 0,
        hasCriticalComplaint: false,
        contractDaysLeft: 95,
        isExpiringSoon: false,
        isCriticalExpiry: false,
        feeStatus: 'paid',
        tags: ['souvenir']
      }
    },
    {
      id: 'stall_L04',
      code: 'L04',
      zoneId: 'zone_L_west',
      floorId: 'floor_ben_thanh_L',
      geometry: {
        type: 'rectangle',
        x: 100,
        y: 400,
        width: 120,
        height: 120,
        elevationZ: 0,
        height3D: 2.5
      },
      boundingBox: { minX: 100, minY: 400, maxX: 220, maxY: 520, width: 120, height: 120 },
      metadata: {
        name: 'Lụa Tơ Tằm Hà Đông',
        merchantName: 'Trịnh Mai Lan',
        phone: '0909 778 899',
        category: 'May mặc & Vải',
        areaM2: 14.4,
        monthlyEstimatedRevenue: '85.000.000đ',
        rating: 4.9,
        ratingCount: 310,
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        issues: [],
        hasActiveIssues: false,
        isUnderMaintenance: false,
        complaintsCount: 0,
        hasCriticalComplaint: false,
        contractDaysLeft: 240,
        isExpiringSoon: false,
        isCriticalExpiry: false,
        feeStatus: 'paid',
        tags: ['silk', 'premium']
      }
    },
    // SẠP MULTI-ISSUE Ở KHU L
    {
      id: 'stall_L05_MULTI_ISSUE',
      code: 'L05',
      zoneId: 'zone_L_west',
      floorId: 'floor_ben_thanh_L',
      geometry: {
        type: 'rectangle',
        x: 100,
        y: 560,
        width: 120,
        height: 120,
        elevationZ: 0,
        height3D: 2.5
      },
      boundingBox: { minX: 100, minY: 560, maxX: 220, maxY: 680, width: 120, height: 120 },
      metadata: {
        name: 'Áo Dài Truyền Thống Mỹ Duyên',
        merchantName: 'Đặng Mỹ Duyên',
        phone: '0912 334 455',
        category: 'May mặc & Vải',
        areaM2: 14.4,
        monthlyEstimatedRevenue: '40.000.000đ',
        rating: 4.2,
        ratingCount: 65,
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        hasActiveIssues: true,
        highestSeverity: 'critical',
        isUnderMaintenance: false,
        complaintsCount: 1,
        hasCriticalComplaint: true,
        contractDaysLeft: 4,
        isExpiringSoon: true,
        isCriticalExpiry: true,
        feeStatus: 'overdue',
        overdueAmount: '2.400.000đ',
        tags: ['fire_hazard', 'urgent_contract'],
        issues: [
          {
            id: 'issue_l05_fire_safety',
            type: 'fire_safety',
            code: 'PCCC-L05',
            title: 'Treo ma-nơ-canh và vải lụa che chắn lối thoát hiểm phụ',
            severity: 'critical',
            status: 'open',
            createdAt: '2026-08-31T09:00:00Z',
            updatedAt: '2026-08-31T09:30:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_L05_MULTI_ISSUE' }
          },
          {
            id: 'issue_l05_contract',
            type: 'contract_expiry',
            code: 'HD-L05',
            title: 'Hợp đồng thuê sạp còn 4 ngày',
            severity: 'high',
            status: 'open',
            createdAt: '2026-08-27T00:00:00Z',
            updatedAt: '2026-08-31T00:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_L05_MULTI_ISSUE' },
            payload: { contractDaysLeft: 4 }
          }
        ]
      }
    }
  ],
  aisles: [
    // LỐI ĐI UỐN GÓC 90 ĐỘ HÌNH CHỮ L
    {
      id: 'aisle_L_corridor',
      code: 'AISLE-L-MAIN',
      floorId: 'floor_ben_thanh_L',
      name: 'Trục đường chính Chữ L',
      type: 'main_corridor',
      geometry: {
        type: 'path',
        points: [
          [700, 250],
          [260, 250],
          [260, 700]
        ],
        width: 35,
        widthMeters: 3.5,
        cap: 'round',
        join: 'round'
      },
      widthMeters: 3.5,
      flowDirection: 'two_way',
      isClearOfObstacles: false
    }
  ],
  gates: [
    {
      id: 'gate_L_east',
      code: 'GATE-DONG',
      floorId: 'floor_ben_thanh_L',
      name: 'Cửa Đông — Đường Lê Lợi',
      type: 'main_entry',
      geometry: {
        type: 'rectangle',
        x: 730,
        y: 200,
        width: 20,
        height: 100
      },
      orientationDegrees: 90,
      connectedStreet: 'Đường Lê Lợi',
      widthMeters: 10.0,
      isOpen: true
    },
    {
      id: 'gate_L_south',
      code: 'GATE-NAM',
      floorId: 'floor_ben_thanh_L',
      name: 'Cửa Nam — Vòng Xoay Quách Thị Trang',
      type: 'main_entry',
      geometry: {
        type: 'rectangle',
        x: 210,
        y: 730,
        width: 100,
        height: 20
      },
      orientationDegrees: 180,
      connectedStreet: 'Vòng Xoay Quách Thị Trang',
      widthMeters: 10.0,
      isOpen: true
    }
  ],
  facilities: [
    {
      id: 'facility_wc_L',
      code: 'WC-L',
      floorId: 'floor_ben_thanh_L',
      name: 'Nhà vệ sinh Cánh Bắc',
      type: 'restroom',
      geometry: {
        type: 'rectangle',
        x: 640,
        y: 60,
        width: 80,
        height: 40
      },
      boundingBox: { minX: 640, minY: 60, maxX: 720, maxY: 100, width: 80, height: 40 },
      metadata: { managedBy: 'BQL Chợ Bến Thành', openHours: '06:00 - 20:00' },
      state: { isOperational: true, cleanlinessStatus: 'clean' }
    }
  ],
  infrastructures: [
    {
      id: 'infra_pccc_L01',
      code: 'PCCC-L01',
      floorId: 'floor_ben_thanh_L',
      name: 'Tủ chữa cháy góc chữ L',
      type: 'fire_hydrant',
      geometry: {
        type: 'point',
        coordinates: [290, 280],
        elevationZ: 0
      },
      metadata: { responsibleTechnician: 'Đội PCCC Q1', phone: '114' },
      state: { status: 'normal' }
    }
  ],
  incidents: [
    {
      id: 'incident_L_corridor_obstruction',
      code: 'INC-L01',
      floorId: 'floor_ben_thanh_L',
      title: 'Lấn chiếm lối đi góc rẽ Chữ L tại sạp L05',
      category: 'security',
      geometry: {
        type: 'point',
        coordinates: [240, 580],
        elevationZ: 0
      },
      targetEntityRef: { entityType: 'stall', entityId: 'stall_L05_MULTI_ISSUE' },
      complaintsCount: 1,
      complaintIds: ['issue_l05_fire_safety'],
      state: {
        status: 'open',
        severity: 'critical',
        assignedTeam: 'Bảo vệ BQL',
        assignedPerson: 'Nguyễn Văn Nam',
        actionRequired: 'Thu gom ma-nơ-canh giải phóng hành lang',
        reportedAt: '2026-08-31T09:00:00Z',
        lastUpdated: '2026-08-31T09:30:00Z'
      }
    }
  ]
};

/**
 * ============================================================================
 * FIXTURE C: CHỢ ĐẦM HAI THÁP CẦU NỐI (TWO-BLOCK BRIDGE MARKET)
 * ============================================================================
 * Đặc điểm kiến trúc:
 * - 2 Block độc lập: Tháp Đông (A) và Tháp Tây (B)
 * - Nối nhau bằng Cầu thông thủy trên cao (Skywalk Corridor)
 * - Kích thước: 1200 x 600
 */
export const FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET: FloorEntity = {
  schemaVersion: '3.2.0',
  id: 'floor_cho_dam_bridge',
  marketId: 'market_cho_dam',
  floorNumber: 2,
  name: 'Tầng 2 — Hai Khối Tháp Nối Cầu',
  subTitle: 'Chợ Đầm Tròn Nha Trang — Khu Liên Hợp Hải Sản & Đặc Sản',
  elevationMeters: 4.2,
  ceilingHeightMeters: 4.0,
  coordinateSystem: {
    width: 1200,
    height: 600,
    origin: 'top_left',
    xAxisDirection: 'east',
    yAxisDirection: 'south',
    zAxisDirection: 'up',
    unit: 'metric_cm',
    scaleFactorToMeters: 0.1,
    rotationConvention: {
      unit: 'degrees',
      defaultDirection: 'clockwise_from_north',
      zeroDegreeAxis: 'north'
    }
  },
  // Chu vi 2 tháp + cầu nối giữa
  boundary: {
    type: 'polygon',
    vertices: [
      [50, 50],
      [450, 50],
      [450, 220],
      [750, 220], // Cầu nối trên
      [750, 50],
      [1150, 50],
      [1150, 550],
      [750, 550],
      [750, 380],
      [450, 380], // Cầu nối dưới
      [450, 550],
      [50, 550]
    ],
    elevationZ: 4.2,
    height3D: 4.0
  },
  zones: [
    {
      id: 'zone_block_west',
      code: 'THAP-TAY',
      floorId: 'floor_cho_dam_bridge',
      name: 'Tháp Tây — Hải Sản Khô & Rong Biển',
      subTitle: 'Khối Tròn Phía Tây',
      category: 'Hải sản khô',
      geometry: {
        type: 'rectangle',
        x: 80,
        y: 80,
        width: 340,
        height: 440
      },
      boundingBox: { minX: 80, minY: 80, maxX: 420, maxY: 520, width: 340, height: 440 },
      visualTheme: { colorToken: '#076C31' },
      totalStallsCount: 4,
      stallIds: ['stall_W01', 'stall_W02']
    },
    {
      id: 'zone_bridge_corridor',
      code: 'CAU-NOI',
      floorId: 'floor_cho_dam_bridge',
      name: 'Cầu Nối Skywalk — Trưng Bày Sinh Vật Biển',
      subTitle: 'Trục Liên Kết Không Gian',
      category: 'Trưng bày',
      geometry: {
        type: 'rectangle',
        x: 470,
        y: 240,
        width: 260,
        height: 120
      },
      boundingBox: { minX: 470, minY: 240, maxX: 730, maxY: 360, width: 260, height: 120 },
      visualTheme: { colorToken: '#6366f1' },
      totalStallsCount: 2,
      stallIds: ['stall_BR01']
    },
    {
      id: 'zone_block_east',
      code: 'THAP-DONG',
      floorId: 'floor_cho_dam_bridge',
      name: 'Tháp Đông — Yến Sào & Trầm Hương Khánh Hòa',
      subTitle: 'Khối Tròn Phía Đông',
      category: 'Đặc sản cao cấp',
      geometry: {
        type: 'rectangle',
        x: 780,
        y: 80,
        width: 340,
        height: 440
      },
      boundingBox: { minX: 780, minY: 80, maxX: 1120, maxY: 520, width: 340, height: 440 },
      visualTheme: { colorToken: '#b45309' },
      totalStallsCount: 4,
      stallIds: ['stall_E01']
    }
  ],
  stalls: [
    {
      id: 'stall_W01',
      code: 'W01',
      zoneId: 'zone_block_west',
      floorId: 'floor_cho_dam_bridge',
      geometry: {
        type: 'rectangle',
        x: 110,
        y: 120,
        width: 120,
        height: 90
      },
      boundingBox: { minX: 110, minY: 120, maxX: 230, maxY: 210, width: 120, height: 90 },
      metadata: {
        name: 'Mực Rim Me Nha Trang',
        merchantName: 'Nguyễn Thị Hồng',
        phone: '0977 111 222',
        category: 'Hải sản khô',
        areaM2: 10.8,
        monthlyEstimatedRevenue: '58.000.000đ',
        rating: 4.8,
        ratingCount: 140,
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        issues: [],
        hasActiveIssues: false,
        isUnderMaintenance: false,
        complaintsCount: 0,
        hasCriticalComplaint: false,
        contractDaysLeft: 140,
        isExpiringSoon: false,
        isCriticalExpiry: false,
        feeStatus: 'paid',
        tags: ['dry_seafood']
      }
    },
    {
      id: 'stall_W02',
      code: 'W02',
      zoneId: 'zone_block_west',
      floorId: 'floor_cho_dam_bridge',
      geometry: {
        type: 'rectangle',
        x: 260,
        y: 120,
        width: 120,
        height: 90
      },
      boundingBox: { minX: 260, minY: 120, maxX: 380, maxY: 210, width: 120, height: 90 },
      metadata: {
        name: 'Cá Ngựa & Hải Sâm Cam Ranh',
        merchantName: 'Võ Văn Hùng',
        phone: '0905 333 444',
        category: 'Đặc sản dược liệu',
        areaM2: 10.8,
        monthlyEstimatedRevenue: '90.000.000đ',
        rating: 4.9,
        ratingCount: 220,
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        issues: [],
        hasActiveIssues: false,
        isUnderMaintenance: false,
        complaintsCount: 0,
        hasCriticalComplaint: false,
        contractDaysLeft: 200,
        isExpiringSoon: false,
        isCriticalExpiry: false,
        feeStatus: 'paid',
        tags: ['premium']
      }
    },
    // SẠP TRÊN CẦU NỐI SKYWALK
    {
      id: 'stall_BR01',
      code: 'BR01',
      zoneId: 'zone_bridge_corridor',
      floorId: 'floor_cho_dam_bridge',
      geometry: {
        type: 'rectangle',
        x: 520,
        y: 260,
        width: 160,
        height: 80
      },
      boundingBox: { minX: 520, minY: 260, maxX: 680, maxY: 340, width: 160, height: 80 },
      metadata: {
        name: 'Kiosk Cà Phê Skywalk Cầu Kính',
        merchantName: 'Đặng Tuấn Anh',
        phone: '0913 555 777',
        category: 'Đồ uống & Trưng bày',
        areaM2: 12.8,
        monthlyEstimatedRevenue: '65.000.000đ',
        rating: 4.9,
        ratingCount: 420,
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        issues: [],
        hasActiveIssues: false,
        isUnderMaintenance: false,
        complaintsCount: 0,
        hasCriticalComplaint: false,
        contractDaysLeft: 300,
        isExpiringSoon: false,
        isCriticalExpiry: false,
        feeStatus: 'paid',
        tags: ['skywalk_cafe']
      }
    },
    {
      id: 'stall_E01',
      code: 'E01',
      zoneId: 'zone_block_east',
      floorId: 'floor_cho_dam_bridge',
      geometry: {
        type: 'rectangle',
        x: 820,
        y: 120,
        width: 140,
        height: 100
      },
      boundingBox: { minX: 820, minY: 120, maxX: 960, maxY: 220, width: 140, height: 100 },
      metadata: {
        name: 'Yến Sào Đảo Yến Khánh Hòa',
        merchantName: 'Trần Thị Thu Trang',
        phone: '0989 999 888',
        category: 'Yến sào cao cấp',
        areaM2: 14.0,
        monthlyEstimatedRevenue: '250.000.000đ',
        rating: 5.0,
        ratingCount: 510,
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        issues: [],
        hasActiveIssues: false,
        isUnderMaintenance: false,
        complaintsCount: 0,
        hasCriticalComplaint: false,
        contractDaysLeft: 365,
        isExpiringSoon: false,
        isCriticalExpiry: false,
        feeStatus: 'paid',
        tags: ['luxury', 'bird_nest']
      }
    }
  ],
  aisles: [
    {
      id: 'aisle_bridge_skywalk',
      code: 'AISLE-SKYWALK',
      floorId: 'floor_cho_dam_bridge',
      name: 'Cầu bộ hành Skywalk nối Tháp Đông & Tháp Tây',
      type: 'main_corridor',
      geometry: {
        type: 'path',
        points: [
          [200, 300],
          [1000, 300]
        ],
        width: 50,
        widthMeters: 5.0,
        cap: 'round',
        join: 'round'
      },
      widthMeters: 5.0,
      flowDirection: 'two_way',
      isClearOfObstacles: true
    }
  ],
  gates: [
    {
      id: 'gate_west_entry',
      code: 'GATE-W',
      floorId: 'floor_cho_dam_bridge',
      name: 'Cổng Tháp Tây — Phố Phan Bội Châu',
      type: 'main_entry',
      geometry: {
        type: 'rectangle',
        x: 50,
        y: 250,
        width: 20,
        height: 100
      },
      orientationDegrees: 270,
      connectedStreet: 'Phố Phan Bội Châu',
      widthMeters: 10.0,
      isOpen: true
    },
    {
      id: 'gate_east_entry',
      code: 'GATE-E',
      floorId: 'floor_cho_dam_bridge',
      name: 'Cổng Tháp Đông — Phố Bến Chợ',
      type: 'main_entry',
      geometry: {
        type: 'rectangle',
        x: 1130,
        y: 250,
        width: 20,
        height: 100
      },
      orientationDegrees: 90,
      connectedStreet: 'Phố Bến Chợ',
      widthMeters: 10.0,
      isOpen: true
    }
  ],
  facilities: [
    {
      id: 'facility_wc_bridge',
      code: 'WC-SKYWALK',
      floorId: 'floor_cho_dam_bridge',
      name: 'Khu vệ sinh VIP Skywalk',
      type: 'restroom',
      geometry: {
        type: 'rectangle',
        x: 520,
        y: 350,
        width: 80,
        height: 30
      },
      boundingBox: { minX: 520, minY: 350, maxX: 600, maxY: 380, width: 80, height: 30 },
      metadata: { managedBy: 'BQL Chợ Đầm', openHours: '24/7' },
      state: { isOperational: true, cleanlinessStatus: 'clean' }
    }
  ],
  infrastructures: [
    {
      id: 'infra_bridge_pipe',
      code: 'DRAIN-BRIDGE',
      floorId: 'floor_cho_dam_bridge',
      name: 'Tuyến ống cấp thoát nước xuyên cầu Skywalk',
      type: 'drainage_pipe',
      geometry: {
        type: 'path',
        points: [
          [200, 360],
          [1000, 360]
        ],
        width: 8,
        widthMeters: 0.8
      },
      connectedStallIds: ['stall_W01', 'stall_BR01', 'stall_E01'],
      metadata: { responsibleTechnician: 'KTV. Đặng Hữu', phone: '0905 888 777' },
      state: { status: 'normal' }
    }
  ],
  incidents: []
};

export const ALL_CANONICAL_FIXTURES: Record<string, FloorEntity> = {
  fixture_a: FIXTURE_A_DONG_XUAN,
  fixture_b: FIXTURE_B_L_SHAPED_MARKET,
  fixture_c: FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET,
  fixture_live: LIVE_FLOOR_DONG_XUAN
};

export {
  LIVE_FLOOR_DONG_XUAN,
  LIVE_MARKET_METADATA,
  LIVE_ZONES,
  LIVE_STALLS
} from './liveMarketFixture';

