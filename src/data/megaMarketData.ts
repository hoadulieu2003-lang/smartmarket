/**
 * MEGA MARKET DATA — CANONICAL SPATIAL MODEL v3.2.0 (Widescreen 16:9 Architectural Edition)
 * Quy hoạch chuẩn thực tế Chợ Truyền Thống Đồng Xuân
 * - Tỷ lệ hiển thị Panorama Widescreen 16:9 (1680 x 880) lấp đầy 100% container layout, không góc chết
 * - 160 Sạp hàng phân bổ thành 5 phân khu chức năng (32 sạp/khu)
 * - 2 Cụm Bắc (Khu B Tây Bắc & Khu A Đông Bắc) cân xứng hai bên đại lộ trung tâm
 * - 3 Cụm Nam (Khu C Tây Nam, Khu D Nam Trung Tâm, Khu E Đông Nam)
 * - Đại lộ chính Bắc - Nam nối Cổng Bắc ↔ Cổng Nam, Đại lộ Đông - Tây nối Hàng Giấy ↔ Đồng Xuân
 * - Văn phòng BQL Chợ & Trạm Sơ Cứu tại ngã tư trung tâm
 * - 6 Cổng lớn ra vào, 5 Camera CCTV có nón góc quét, 2 Họng PCCC, 2 Trạm thu cống ngầm IoT
 */

import { 
  FloorEntity, 
  ZoneEntity, 
  StallEntity, 
  AisleEntity, 
  GateEntity, 
  InfrastructureEntity, 
  FacilityEntity 
} from '@/spatial/model/types';

const VIETNAMESE_MERCHANT_NAMES = [
  'Nguyễn Thị Mai', 'Trần Văn Hùng', 'Lê Hoàng Yến', 'Phạm Minh Tuấn', 'Vũ Thị Sen',
  'Nguyễn Văn Thắng', 'Bùi Thị Dung', 'Hoàng Minh Châu', 'Đỗ Thị Lan', 'Trịnh Quốc Bảo',
  'Lê Thị Thu', 'Võ Minh Trí', 'Ngô Thanh Tùng', 'Lê Thu Hương', 'Đặng Ngọc Anh',
  'Trần Văn Tuấn', 'Trần Đình Trọng', 'Phạm Thị Mùi', 'Đỗ Thành Đạt', 'Nguyễn Kiên Cường',
  'Bùi Văn Hào', 'Lê Văn Nam', 'Phan Văn Đức', 'Dương Thị Hồng', 'Đinh Quang Sáng',
  'Lý Hải Triều', 'Vương Đình Huệ', 'Mai Thu Trang', 'Hồ Văn Cường', 'Tạ Thị Bích',
  'Cao Văn Thắng', 'Lương Minh Triết'
];

interface ZoneConfig {
  id: string;
  code: string;
  name: string;
  category: string;
  prefix: string;
  startIdx: number;
  count: number;
  baseX: number;
  baseY: number;
  rows: number;
  cols: number;
  stallW: number;
  stallH: number;
  gapX: number;
  gapY: number;
  color: string;
  bgTint: string;
  border: string;
  zoneRect: { x: number; y: number; width: number; height: number };
}

export const ZONE_CONFIGS_OPTIMIZED: ZoneConfig[] = [
  // 1. KHU B: RAU CỦ QUẢ & NÔNG SẢN VIETGAP (Tây Bắc, 32 sạp lớn)
  {
    id: 'zone_B',
    code: 'B',
    name: 'Khu B — Rau Củ Quả & Nông Sản VietGAP',
    category: 'Rau củ',
    prefix: 'B',
    startIdx: 1,
    count: 32,
    baseX: 35,
    baseY: 55,
    rows: 4,
    cols: 8,
    stallW: 90,
    stallH: 72,
    gapX: 10,
    gapY: 8,
    color: '#16a34a',
    bgTint: '#f0fdf4',
    border: '#bbf7d0',
    zoneRect: { x: 25, y: 22, width: 810, height: 355 }
  },
  // 2. KHU A: HẢI SẢN & THỰC PHẨM TƯƠI SỐNG (Đông Bắc, 32 sạp lớn)
  {
    id: 'zone_A',
    code: 'A',
    name: 'Khu A — Hải Sản & Thực PhẨM Tươi Sống',
    category: 'Thực phẩm tươi',
    prefix: 'A',
    startIdx: 1,
    count: 32,
    baseX: 855,
    baseY: 55,
    rows: 4,
    cols: 8,
    stallW: 90,
    stallH: 72,
    gapX: 10,
    gapY: 8,
    color: '#0d9488',
    bgTint: '#f0fdfa',
    border: '#99f6e4',
    zoneRect: { x: 845, y: 22, width: 810, height: 355 }
  },
  // 3. KHU C: BÁCH HÓA TỔNG HỢP & ĐỒ KHÔ (Tây Nam, 32 sạp lớn)
  {
    id: 'zone_C',
    code: 'C',
    name: 'Khu C — Bách Hóa Tổng Hợp & Đồ Khô',
    category: 'Gia vị',
    prefix: 'C',
    startIdx: 1,
    count: 32,
    baseX: 35,
    baseY: 462,
    rows: 4,
    cols: 8,
    stallW: 58,
    stallH: 82,
    gapX: 6,
    gapY: 8,
    color: '#d97706',
    bgTint: '#fffbeb',
    border: '#fde68a',
    zoneRect: { x: 25, y: 430, width: 526, height: 395 }
  },
  // 4. KHU D: THỜI TRANG, VẢI VÓC & GIÀY DÉP (Nam Trung Tâm, 32 sạp lớn)
  {
    id: 'zone_D',
    code: 'D',
    name: 'Khu D — Thời Trang, Vải Vóc & Giày Dép',
    category: 'Thời trang',
    prefix: 'D',
    startIdx: 1,
    count: 32,
    baseX: 587,
    baseY: 462,
    rows: 4,
    cols: 8,
    stallW: 58,
    stallH: 82,
    gapX: 6,
    gapY: 8,
    color: '#7c3aed',
    bgTint: '#faf5ff',
    border: '#e9d5ff',
    zoneRect: { x: 577, y: 430, width: 526, height: 395 }
  },
  // 5. KHU E: ẨM THỰC TRUYỀN THỐNG & GIẢI KHÁT (Đông Nam, 32 sạp lớn)
  {
    id: 'zone_E',
    code: 'E',
    name: 'Khu E — Ẩm Thực Truyền Thống & Giải Khát',
    category: 'Ẩm thực',
    prefix: 'E',
    startIdx: 1,
    count: 32,
    baseX: 1139,
    baseY: 462,
    rows: 4,
    cols: 8,
    stallW: 58,
    stallH: 82,
    gapX: 6,
    gapY: 8,
    color: '#ea580c',
    bgTint: '#fff7ed',
    border: '#fed7aa',
    zoneRect: { x: 1129, y: 430, width: 526, height: 395 }
  }
];

export const ZONE_CONFIGS_STANDARD: ZoneConfig[] = [
  // 1. KHU B (Tây Bắc)
  {
    id: 'zone_B',
    code: 'B',
    name: 'Khu B — Rau Củ Quả & Nông Sản VietGAP',
    category: 'Rau củ',
    prefix: 'B',
    startIdx: 1,
    count: 32,
    baseX: 75,
    baseY: 90,
    rows: 4,
    cols: 8,
    stallW: 68,
    stallH: 52,
    gapX: 18,
    gapY: 20,
    color: '#16a34a',
    bgTint: '#f0fdf4',
    border: '#bbf7d0',
    zoneRect: { x: 55, y: 65, width: 710, height: 320 }
  },
  // 2. KHU A (Đông Bắc)
  {
    id: 'zone_A',
    code: 'A',
    name: 'Khu A — Hải Sản & Thực Phẩm Tươi Sống',
    category: 'Thực phẩm tươi',
    prefix: 'A',
    startIdx: 1,
    count: 32,
    baseX: 935,
    baseY: 90,
    rows: 4,
    cols: 8,
    stallW: 68,
    stallH: 52,
    gapX: 18,
    gapY: 20,
    color: '#0d9488',
    bgTint: '#f0fdfa',
    border: '#99f6e4',
    zoneRect: { x: 915, y: 65, width: 710, height: 320 }
  },
  // 3. KHU C (Tây Nam)
  {
    id: 'zone_C',
    code: 'C',
    name: 'Khu C — Bách Hóa Tổng Hợp & Đồ Khô',
    category: 'Gia vị',
    prefix: 'C',
    startIdx: 1,
    count: 32,
    baseX: 75,
    baseY: 530,
    rows: 4,
    cols: 8,
    stallW: 44,
    stallH: 50,
    gapX: 14,
    gapY: 18,
    color: '#d97706',
    bgTint: '#fffbeb',
    border: '#fde68a',
    zoneRect: { x: 55, y: 500, width: 485, height: 335 }
  },
  // 4. KHU D (Nam Trung Tâm)
  {
    id: 'zone_D',
    code: 'D',
    name: 'Khu D — Thời Trang, Vải Vóc & Giày Dép',
    category: 'Thời trang',
    prefix: 'D',
    startIdx: 1,
    count: 32,
    baseX: 615,
    baseY: 530,
    rows: 4,
    cols: 8,
    stallW: 44,
    stallH: 50,
    gapX: 14,
    gapY: 18,
    color: '#7c3aed',
    bgTint: '#faf5ff',
    border: '#e9d5ff',
    zoneRect: { x: 595, y: 500, width: 490, height: 335 }
  },
  // 5. KHU E (Đông Nam)
  {
    id: 'zone_E',
    code: 'E',
    name: 'Khu E — Ẩm Thực Truyền Thống & Giải Khát',
    category: 'Ẩm thực',
    prefix: 'E',
    startIdx: 1,
    count: 32,
    baseX: 1155,
    baseY: 530,
    rows: 4,
    cols: 8,
    stallW: 44,
    stallH: 50,
    gapX: 14,
    gapY: 18,
    color: '#ea580c',
    bgTint: '#fff7ed',
    border: '#fed7aa',
    zoneRect: { x: 1135, y: 500, width: 490, height: 335 }
  }
];

export const ZONE_CONFIGS: ZoneConfig[] = ZONE_CONFIGS_OPTIMIZED;

// Special Operational Issues
const SPECIAL_STALL_ISSUES: Record<string, any> = {
  A12: {
    status: 'complaint',
    complaintsCount: 3,
    contractDaysLeft: 12,
    feeStatus: 'pending',
    dispatchStatus: 'open',
    specificType: 'water',
    taskLabel: 'Cần dọn rác',
    slaMinutesRemaining: 12,
    issues: [
      {
        id: 'iss_a12_1',
        type: 'complaint',
        priority: 'P0',
        title: 'Nước xả cá tràn ra đại lộ chính, mùi hôi nồng nặc',
        description: 'Khách bộ hành phản ánh nước tràn gây trơn trượt nguy hiểm.',
        reportedAt: '10:45 • Hôm nay',
        source: 'app_citizen',
        slaMinutesRemaining: 12,
        status: 'open',
        specificType: 'water',
      }
    ]
  },
  A02: {
    status: 'complaint',
    complaintsCount: 1,
    contractDaysLeft: 180,
    feeStatus: 'paid',
    dispatchStatus: 'open',
    specificType: 'weight_fraud',
    taskLabel: 'Kiểm tra cân',
    slaMinutesRemaining: 45,
    issues: [
      {
        id: 'iss_a02_1',
        type: 'complaint',
        priority: 'P1',
        title: 'Cân không đúng khối lượng (gian lận cân điêu)',
        description: 'Khách mua 1kg ghẹ cân lại trạm cân đối chứng chỉ còn 820g.',
        reportedAt: '09:15 • Hôm nay',
        source: 'hotline',
        slaMinutesRemaining: 45,
        status: 'open',
        specificType: 'weight_fraud',
      }
    ]
  },
  B03: {
    status: 'expiring',
    contractDaysLeft: 12,
    feeStatus: 'pending',
    dispatchStatus: 'in_progress',
    specificType: 'contract_expiry',
    taskLabel: 'Đã nhắc gia hạn',
    issues: [
      {
        id: 'iss_b03_1',
        type: 'contract_expiring',
        priority: 'P2',
        title: 'Hạn hợp đồng thuê sạp còn 12 ngày',
        description: 'Hợp đồng số HĐ-2024-B03 sắp hết hiệu lực vào 15/09/2026.',
        reportedAt: '08:00 • Hôm qua',
        source: 'system',
        status: 'in_progress',
        specificType: 'contract_expiry',
      }
    ]
  },
  B14: {
    status: 'complaint',
    complaintsCount: 1,
    contractDaysLeft: 95,
    feeStatus: 'paid',
    dispatchStatus: 'open',
    specificType: 'encroachment',
    taskLabel: 'Dẹp lấn chiếm',
    slaMinutesRemaining: 25,
    issues: [
      {
        id: 'iss_b14_1',
        type: 'complaint',
        priority: 'P1',
        title: 'Lấn chiếm lối đi chung để sọt cải bắp',
        description: 'Tiểu thương để 4 sọt rau to lấn ra đại lộ Bắc Nam 0.8m.',
        reportedAt: '08:30 • Hôm nay',
        source: 'cctv_ai',
        status: 'open',
        specificType: 'encroachment',
      }
    ]
  },
  C08: {
    status: 'expiring',
    contractDaysLeft: 6,
    feeStatus: 'overdue',
    dispatchStatus: 'open',
    specificType: 'contract_expiry',
    taskLabel: 'Hết hạn 6 ngày',
    issues: [
      {
        id: 'iss_c08_1',
        type: 'contract_expiring',
        priority: 'P2',
        title: 'Sắp hết hạn hợp đồng thuê 6 ngày',
        description: 'Tiểu thương chưa nộp hồ sơ gia hạn kỳ hạn mới.',
        reportedAt: '07:30 • Hôm nay',
        source: 'system',
        status: 'open',
        specificType: 'contract_expiry',
      }
    ]
  },
  C11: {
    status: 'complaint',
    complaintsCount: 4,
    contractDaysLeft: 210,
    feeStatus: 'paid',
    dispatchStatus: 'in_progress',
    specificType: 'food_safety',
    taskLabel: 'Đang niêm phong',
    assignedTeam: 'Đội QLTT & Ban QL',
    slaMinutesRemaining: 15,
    issues: [
      {
        id: 'iss_c11_1',
        type: 'complaint',
        priority: 'P0',
        title: 'Bán hàng quá hạn sử dụng (Bánh mứt mốc)',
        description: 'Đội QLTT phát hiện 12 gói mứt khô có tem mác tẩy xóa.',
        reportedAt: '10:00 • Hôm nay',
        source: 'inspection',
        slaMinutesRemaining: 15,
        status: 'in_progress',
        specificType: 'food_safety',
      }
    ]
  },
  D02: {
    status: 'empty',
    contractDaysLeft: 0,
    feeStatus: 'paid',
    issues: []
  },
  E08: {
    status: 'complaint',
    complaintsCount: 2,
    contractDaysLeft: 300,
    feeStatus: 'paid',
    dispatchStatus: 'open',
    specificType: 'fire_safety',
    taskLabel: 'Khóa gas PCCC',
    slaMinutesRemaining: 8,
    issues: [
      {
        id: 'iss_e08_1',
        type: 'complaint',
        priority: 'P0',
        title: 'Sử dụng bình gas mi-ni rò rỉ có mùi gas nồng nặc',
        description: 'Nguy cơ cháy nổ cấp bách, bảo vệ đã ngắt van an toàn.',
        reportedAt: '11:05 • Hôm nay',
        source: 'sensor_iot',
        slaMinutesRemaining: 8,
        status: 'open',
        specificType: 'fire_safety',
      }
    ]
  },
  A06: {
    status: 'empty',
    contractDaysLeft: 0,
    feeStatus: 'paid',
    issues: []
  },
  B10: {
    status: 'empty',
    contractDaysLeft: 0,
    feeStatus: 'paid',
    issues: []
  },
  C05: {
    status: 'maintenance',
    contractDaysLeft: 120,
    feeStatus: 'paid',
    issues: [
      {
        id: 'iss_c05_1',
        type: 'maintenance',
        priority: 'P3',
        title: 'Bảo trì thay thế bóng đèn LED chiếu sáng',
        description: 'Kỹ thuật chợ đang tiến hành đấu nối lại dây điện chống chập.',
        reportedAt: '09:00 • Hôm nay',
        source: 'system',
      }
    ]
  },
  A03: {
    status: 'maintenance',
    contractDaysLeft: 90,
    feeStatus: 'paid',
    issues: [
      {
        id: 'iss_a03_1',
        type: 'maintenance',
        priority: 'P3',
        title: 'Thông tắc rãnh cống ngầm sạp thủy sản',
        description: 'Tổ cơ điện đang xả áp lực cao làm sạch bùn cặn.',
        reportedAt: '09:30 • Hôm nay',
        source: 'system',
      }
    ]
  }
};

// Generate 160 Real Stalls
export function generateMegaMarketStalls(configs: ZoneConfig[] = ZONE_CONFIGS): StallEntity[] {
  const stalls: StallEntity[] = [];

  configs.forEach((zone) => {
    let stallIndex = 1;

    for (let r = 0; r < zone.rows; r++) {
      for (let c = 0; c < zone.cols; c++) {
        const stallCode = `${zone.prefix}${String(stallIndex).padStart(2, '0')}`;
        const stallId = `stall_${stallCode}`;
        
        const x = zone.baseX + c * (zone.stallW + zone.gapX);
        const y = zone.baseY + r * (zone.stallH + zone.gapY);

        const special = SPECIAL_STALL_ISSUES[stallCode];
        const status = special ? special.status : 'normal';
        const merchantName = VIETNAMESE_MERCHANT_NAMES[(stallIndex + zone.prefix.charCodeAt(0)) % VIETNAMESE_MERCHANT_NAMES.length];

        const stall: StallEntity = {
          id: stallId,
          code: stallCode,
          zoneId: zone.id,
          floorId: 'floor_1',
          geometry: {
            type: 'rectangle',
            x,
            y,
            width: zone.stallW,
            height: zone.stallH,
          },
          boundingBox: {
            minX: x,
            minY: y,
            maxX: x + zone.stallW,
            maxY: y + zone.stallH,
            width: zone.stallW,
            height: zone.stallH,
          },
          metadata: {
            name: `${zone.category} ${stallCode}`,
            merchantName: merchantName,
            phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
            category: zone.category,
            areaM2: Number(((zone.stallW * zone.stallH) / 100).toFixed(1)),
            monthlyEstimatedRevenue: '45.000.000đ',
            rating: 4.8,
            ratingCount: 88,
            qrPaymentActive: true,
            foodSafetyCert: 'Còn hiệu lực',
          },
          state: {
            isOccupied: status !== 'empty',
            occupancyStatus: status === 'empty' ? 'empty' : 'active',
            issues: special?.issues || [],
            hasActiveIssues: (special?.issues?.length || 0) > 0,
            isUnderMaintenance: status === 'maintenance',
            complaintsCount: special?.complaintsCount ?? (status === 'complaint' ? 1 : 0),
            hasCriticalComplaint: status === 'complaint' && (special?.issues?.[0]?.priority === 'P0'),
            contractDaysLeft: special?.contractDaysLeft ?? (150 + (stallIndex * 7) % 300),
            isExpiringSoon: (special?.contractDaysLeft ?? 150) <= 30,
            isCriticalExpiry: (special?.contractDaysLeft ?? 150) <= 7,
            feeStatus: special?.feeStatus ?? 'paid',
            tags: [zone.category, status],
            taskInfo: special ? {
              dispatchStatus: special.dispatchStatus,
              specificType: special.specificType,
              taskLabel: special.taskLabel,
              assignedTeam: special.assignedTeam,
              slaMinutesRemaining: special.slaMinutesRemaining,
            } : undefined,
          } as any,
        };

        stalls.push(stall);
        stallIndex++;
      }
    }
  });

  return stalls;
}

export function buildMegaZones(configs: ZoneConfig[]): ZoneEntity[] {
  return configs.map(z => {
    const stallIds: string[] = [];
    for (let i = 1; i <= z.count; i++) {
      stallIds.push(`stall_${z.prefix}${String(i).padStart(2, '0')}`);
    }

    return {
      id: z.id,
      code: z.code,
      floorId: 'floor_1',
      name: z.name,
      subTitle: `${z.count} sạp • ${z.category}`,
      category: z.category,
      totalStallsCount: z.count,
      stallIds,
      geometry: {
        type: 'rectangle',
        x: z.zoneRect.x,
        y: z.zoneRect.y,
        width: z.zoneRect.width,
        height: z.zoneRect.height,
      },
      boundingBox: {
        minX: z.zoneRect.x,
        minY: z.zoneRect.y,
        maxX: z.zoneRect.x + z.zoneRect.width,
        maxY: z.zoneRect.y + z.zoneRect.height,
        width: z.zoneRect.width,
        height: z.zoneRect.height,
      },
      visualTheme: {
        colorToken: z.color,
        cadHatchPattern: 'solid_tint',
      },
      state: {
        totalStalls: 32,
        activeStalls: z.code === 'A' ? 30 : z.code === 'B' ? 31 : z.code === 'D' ? 31 : 32,
        occupancyRate: 0.96,
      }
    };
  });
}

// 5 Canonical Functional Zones (Mặc định: Layout Tối Ưu)
export const MEGA_ZONES: ZoneEntity[] = buildMegaZones(ZONE_CONFIGS_OPTIMIZED);

// Comprehensive Aisle & Corridor Network - TỐI ƯU HÓA HÀNH LANG
export const MEGA_AISLES_OPTIMIZED: AisleEntity[] = [
  // 1. Đại lộ trung tâm Bắc — Nam nối Cổng Bắc ↔ Cổng Nam (rộng 35 units gọn gàng)
  {
    id: 'aisle_main_ns',
    code: 'DAI-LO-BAC-NAM',
    floorId: 'floor_1',
    name: 'Đại lộ Bắc — Nam',
    type: 'main_corridor',
    widthMeters: 3.5,
    isClearOfObstacles: true,
    geometry: {
      type: 'polygon',
      vertices: [
        [835, 20],
        [855, 20],
        [855, 860],
        [835, 860],
      ]
    },
  },
  // 2. Đại lộ Đông — Tây trung tâm nối Hàng Giấy ↔ Đồng Xuân (rộng 40 units gọn gàng)
  {
    id: 'aisle_sub_we_1',
    code: 'TRUC-CHINH-DONG-TAY',
    floorId: 'floor_1',
    name: 'Đại lộ Đông — Tây',
    type: 'main_corridor',
    widthMeters: 3.5,
    isClearOfObstacles: true,
    geometry: {
      type: 'polygon',
      vertices: [
        [20, 368],
        [1660, 368],
        [1660, 408],
        [20, 408],
      ]
    },
  }
];

export const MEGA_AISLES_STANDARD: AisleEntity[] = [
  {
    id: 'aisle_main_ns',
    code: 'DAI-LO-BAC-NAM',
    floorId: 'floor_1',
    name: 'Đại lộ Bắc — Nam (Cổng Bắc ↔ Cổng Nam)',
    type: 'main_corridor',
    widthMeters: 4.0,
    isClearOfObstacles: true,
    geometry: {
      type: 'polygon',
      vertices: [
        [790, 50],
        [890, 50],
        [890, 840],
        [790, 840],
      ]
    },
  },
  {
    id: 'aisle_sub_we_1',
    code: 'TRUC-CHINH-DONG-TAY',
    floorId: 'floor_1',
    name: 'Đại lộ Đông — Tây (Hàng Giấy ↔ Đồng Xuân)',
    type: 'main_corridor',
    widthMeters: 3.5,
    isClearOfObstacles: true,
    geometry: {
      type: 'polygon',
      vertices: [
        [50, 400],
        [1630, 400],
        [1630, 485],
        [50, 485],
      ]
    },
  }
];

export const MEGA_AISLES: AisleEntity[] = MEGA_AISLES_OPTIMIZED;

// 6 Gates at the outer perimeter - TỐI ƯU HÓA CỔNG
export const MEGA_GATES_OPTIMIZED: GateEntity[] = [
  {
    id: 'gate_north',
    code: 'GATE-N',
    floorId: 'floor_1',
    name: 'Cổng Bắc',
    type: 'logistics_entry',
    connectedStreet: 'Phố Hàng Khoai',
    widthMeters: 5.0,
    orientationDegrees: 0,
    isOpen: true,
    geometry: { type: 'rectangle', x: 820, y: 6, width: 50, height: 14 },
  },
  {
    id: 'gate_south',
    code: 'GATE-S',
    floorId: 'floor_1',
    name: 'Cổng Nam',
    type: 'main_entry',
    connectedStreet: 'Phố Cầu Đông',
    widthMeters: 5.0,
    orientationDegrees: 180,
    isOpen: true,
    geometry: { type: 'rectangle', x: 820, y: 860, width: 50, height: 14 },
  },
  {
    id: 'gate_east_1',
    code: 'GATE-E1',
    floorId: 'floor_1',
    name: 'Cổng Đông 1',
    type: 'side_entry',
    connectedStreet: 'Phố Hàng Giấy',
    widthMeters: 2.5,
    orientationDegrees: 90,
    isOpen: true,
    geometry: { type: 'rectangle', x: 1656, y: 150, width: 14, height: 50 },
  },
  {
    id: 'gate_east_2',
    code: 'GATE-E2',
    floorId: 'floor_1',
    name: 'Cổng Đông 2',
    type: 'side_entry',
    connectedStreet: 'Phố Hàng Giấy',
    widthMeters: 2.5,
    orientationDegrees: 90,
    isOpen: true,
    geometry: { type: 'rectangle', x: 1656, y: 550, width: 14, height: 50 },
  },
  {
    id: 'gate_west_1',
    code: 'GATE-W1',
    floorId: 'floor_1',
    name: 'Cổng Tây 1',
    type: 'side_entry',
    connectedStreet: 'Phố Đồng Xuân',
    widthMeters: 2.5,
    orientationDegrees: 270,
    isOpen: true,
    geometry: { type: 'rectangle', x: 10, y: 150, width: 14, height: 50 },
  },
  {
    id: 'gate_west_2',
    code: 'GATE-W2',
    floorId: 'floor_1',
    name: 'Cổng Tây 2',
    type: 'emergency_exit',
    connectedStreet: 'Phố Đồng Xuân',
    widthMeters: 2.5,
    orientationDegrees: 270,
    isOpen: true,
    geometry: { type: 'rectangle', x: 10, y: 550, width: 14, height: 50 },
  }
];

export const MEGA_GATES_STANDARD: GateEntity[] = [
  {
    id: 'gate_north',
    code: 'GATE-N',
    floorId: 'floor_1',
    name: 'Cổng Bắc • Phố Hàng Khoai (Xe tải hàng)',
    type: 'logistics_entry',
    connectedStreet: 'Phố Hàng Khoai',
    widthMeters: 5.0,
    orientationDegrees: 0,
    isOpen: true,
    geometry: { type: 'rectangle', x: 790, y: 15, width: 100, height: 35 },
  },
  {
    id: 'gate_south',
    code: 'GATE-S',
    floorId: 'floor_1',
    name: 'Cổng Nam • Phố Cầu Đông (Khách bộ hành)',
    type: 'main_entry',
    connectedStreet: 'Phố Cầu Đông',
    widthMeters: 5.0,
    orientationDegrees: 180,
    isOpen: true,
    geometry: { type: 'rectangle', x: 790, y: 835, width: 100, height: 35 },
  },
  {
    id: 'gate_east_1',
    code: 'GATE-E1',
    floorId: 'floor_1',
    name: 'Cửa Đông 1 • Phố Hàng Giấy',
    type: 'side_entry',
    connectedStreet: 'Phố Hàng Giấy',
    widthMeters: 2.5,
    orientationDegrees: 90,
    isOpen: true,
    geometry: { type: 'rectangle', x: 1630, y: 180, width: 35, height: 80 },
  },
  {
    id: 'gate_east_2',
    code: 'GATE-E2',
    floorId: 'floor_1',
    name: 'Cửa Đông 2 • Nhập hàng thủy sản',
    type: 'side_entry',
    connectedStreet: 'Phố Hàng Giấy',
    widthMeters: 2.5,
    orientationDegrees: 90,
    isOpen: true,
    geometry: { type: 'rectangle', x: 1630, y: 600, width: 35, height: 80 },
  },
  {
    id: 'gate_west_1',
    code: 'GATE-W1',
    floorId: 'floor_1',
    name: 'Cửa Tây 1 • Phố Đồng Xuân',
    type: 'side_entry',
    connectedStreet: 'Phố Đồng Xuân',
    widthMeters: 2.5,
    orientationDegrees: 270,
    isOpen: true,
    geometry: { type: 'rectangle', x: 15, y: 180, width: 35, height: 80 },
  },
  {
    id: 'gate_west_2',
    code: 'GATE-W2',
    floorId: 'floor_1',
    name: 'Cửa Tây 2 • Thoát hiểm PCCC',
    type: 'emergency_exit',
    connectedStreet: 'Phố Đồng Xuân',
    widthMeters: 2.5,
    orientationDegrees: 270,
    isOpen: true,
    geometry: { type: 'rectangle', x: 15, y: 600, width: 35, height: 80 },
  }
];

export const MEGA_GATES: GateEntity[] = MEGA_GATES_OPTIMIZED;

// Facilities
export const MEGA_FACILITIES_OPTIMIZED: FacilityEntity[] = [
  {
    id: 'bql_office',
    code: 'BQL-01',
    floorId: 'floor_1',
    name: 'Văn Phòng Ban Quản Lý Chợ & Trạm Sơ Cứu',
    type: 'bql_office',
    geometry: { type: 'rectangle', x: 825, y: 372, width: 40, height: 32 },
    boundingBox: { minX: 825, minY: 372, maxX: 865, maxY: 404, width: 40, height: 32 },
    metadata: { managedBy: 'Trưởng BQL', openHours: '06:00 - 22:00' },
    state: { isOperational: true, cleanlinessStatus: 'clean' }
  }
];

export const MEGA_FACILITIES_STANDARD: FacilityEntity[] = [
  {
    id: 'bql_office',
    code: 'BQL-01',
    floorId: 'floor_1',
    name: 'Văn Phòng Ban Quản Lý Chợ & Trạm Sơ Cứu',
    type: 'bql_office',
    geometry: { type: 'rectangle', x: 805, y: 410, width: 70, height: 65 },
    boundingBox: { minX: 805, minY: 410, maxX: 875, maxY: 475, width: 70, height: 65 },
    metadata: { managedBy: 'Trưởng BQL', openHours: '06:00 - 22:00' },
    state: { isOperational: true, cleanlinessStatus: 'clean' }
  }
];

export const MEGA_FACILITIES: FacilityEntity[] = MEGA_FACILITIES_OPTIMIZED;

// Infrastructure Assets
export const MEGA_INFRASTRUCTURE: InfrastructureEntity[] = [
  {
    id: 'cctv_01',
    code: 'CAM-01',
    floorId: 'floor_1',
    name: 'CCTV Cổng Bắc (Góc quét 90°)',
    type: 'cctv_camera',
    geometry: { type: 'point', coordinates: [750, 70] },
    metadata: { responsibleTechnician: 'Lê Văn Tuấn', phone: '0912345678' },
    state: { status: 'normal' }
  },
  {
    id: 'cctv_02',
    code: 'CAM-02',
    floorId: 'floor_1',
    name: 'CCTV Khu A Hải Sản',
    type: 'cctv_camera',
    geometry: { type: 'point', coordinates: [1260, 80] },
    metadata: { responsibleTechnician: 'Lê Văn Tuấn', phone: '0912345678' },
    state: { status: 'normal' }
  },
  {
    id: 'cctv_03',
    code: 'CAM-03',
    floorId: 'floor_1',
    name: 'CCTV Khu B Rau Củ',
    type: 'cctv_camera',
    geometry: { type: 'point', coordinates: [420, 80] },
    metadata: { responsibleTechnician: 'Lê Văn Tuấn', phone: '0912345678' },
    state: { status: 'normal' }
  },
  {
    id: 'cctv_04',
    code: 'CAM-04',
    floorId: 'floor_1',
    name: 'CCTV Ngã Tư Trung Tâm',
    type: 'cctv_camera',
    geometry: { type: 'point', coordinates: [840, 440] },
    metadata: { responsibleTechnician: 'Lê Văn Tuấn', phone: '0912345678' },
    state: { status: 'normal' }
  },
  {
    id: 'cctv_05',
    code: 'CAM-05',
    floorId: 'floor_1',
    name: 'CCTV Cổng Nam',
    type: 'cctv_camera',
    geometry: { type: 'point', coordinates: [750, 815] },
    metadata: { responsibleTechnician: 'Lê Văn Tuấn', phone: '0912345678' },
    state: { status: 'normal' }
  },
  {
    id: 'drain_01',
    code: 'IOT-DRAIN-01',
    floorId: 'floor_1',
    name: 'Cảm biến cống thoát nước Dãy A (Mặt Đông)',
    type: 'drainage_manhole',
    geometry: { type: 'rectangle', x: 1600, y: 220, width: 24, height: 24 },
    metadata: { responsibleTechnician: 'Nguyễn Văn An', phone: '0923456789' },
    state: { status: 'clogged' }
  },
  {
    id: 'drain_02',
    code: 'IOT-DRAIN-02',
    floorId: 'floor_1',
    name: 'Cảm biến cống thoát nước Dãy B (Mặt Tây)',
    type: 'drainage_manhole',
    geometry: { type: 'rectangle', x: 55, y: 220, width: 24, height: 24 },
    metadata: { responsibleTechnician: 'Nguyễn Văn An', phone: '0923456789' },
    state: { status: 'normal' }
  },
  {
    id: 'fire_01',
    code: 'PCCC-01',
    floorId: 'floor_1',
    name: 'Họng cứu hỏa vách tường Cổng Bắc',
    type: 'fire_hydrant',
    geometry: { type: 'point', coordinates: [910, 60] },
    metadata: { responsibleTechnician: 'Đội PCCC Quận', phone: '114' },
    state: { status: 'normal' }
  },
  {
    id: 'fire_02',
    code: 'PCCC-02',
    floorId: 'floor_1',
    name: 'Họng cứu hỏa vách tường Cổng Nam',
    type: 'fire_hydrant',
    geometry: { type: 'point', coordinates: [910, 820] },
    metadata: { responsibleTechnician: 'Đội PCCC Quận', phone: '114' },
    state: { status: 'normal' }
  }
];

// Complete Mega Floor Entity Factory
export type MapDensityMode = 'optimized' | 'standard';

export function buildMegaFloorDongXuan(mode: MapDensityMode = 'optimized'): FloorEntity {
  const configs = mode === 'optimized' ? ZONE_CONFIGS_OPTIMIZED : ZONE_CONFIGS_STANDARD;
  const stalls = generateMegaMarketStalls(configs);
  const zones = buildMegaZones(configs);
  const aisles = mode === 'optimized' ? MEGA_AISLES_OPTIMIZED : MEGA_AISLES_STANDARD;
  const gates = mode === 'optimized' ? MEGA_GATES_OPTIMIZED : MEGA_GATES_STANDARD;
  const facilities = mode === 'optimized' ? MEGA_FACILITIES_OPTIMIZED : MEGA_FACILITIES_STANDARD;

  return {
    schemaVersion: '3.2.0',
    id: 'floor_1',
    marketId: 'market_dong_xuan',
    floorNumber: 1,
    name: 'Tầng 1 — Chợ Truyền Thống Đồng Xuân',
    subTitle: mode === 'optimized'
      ? '160 Sạp Hàng (Sạp Lớn Tác Chiến) • 5 Phân Khu Chức Năng'
      : '160 Sạp Hàng (Sơ Đồ Nguyên Bản) • 5 Phân Khu Chức Năng',
    elevationMeters: 0.0,
    ceilingHeightMeters: 4.8,
    coordinateSystem: {
      width: 1680,
      height: 880,
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
    boundary: {
      type: 'polygon',
      vertices: [
        [15, 15],
        [1665, 15],
        [1665, 865],
        [15, 865],
      ]
    },
    zones,
    aisles,
    stalls,
    gates,
    facilities,
    infrastructures: MEGA_INFRASTRUCTURE,
    incidents: [],
  };
}

export const MEGA_FLOOR_DONG_XUAN: FloorEntity = buildMegaFloorDongXuan('optimized');
export const MEGA_FLOOR_DONG_XUAN_STANDARD: FloorEntity = buildMegaFloorDongXuan('standard');
