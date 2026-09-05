/**
 * REALISTIC 2.5D BLUEPRINT SPATIAL MODEL — CHỢ ĐỒNG XUÂN THỰC TẾ
 * Schema Version: 3.2.0
 * Kích thước khung chuẩn: 1024 x 682 (Khớp 100% tỷ lệ và vị trí của realistic_market_plan.jpg)
 * Bao gồm: 86 Sạp hàng, 5 Phân khu (A, B, C, D, E), 4 Cổng chính, Hạ tầng PCCC, CCTV, WC
 */

import { FloorEntity, ZoneEntity, StallEntity, GateEntity, InfrastructureEntity, FacilityEntity } from '@/spatial/model/types';

const VIETNAMESE_NAMES = [
  'Nguyễn Thị Mai', 'Trần Văn Hùng', 'Lê Hoàng Yến', 'Phạm Minh Tuấn', 'Vũ Thị Sen',
  'Nguyễn Văn Thắng', 'Bùi Thị Dung', 'Hoàng Minh Châu', 'Đỗ Thị Lan', 'Trịnh Quốc Bảo',
  'Lê Thị Thu', 'Võ Minh Trí', 'Ngô Thanh Tùng', 'Lê Thu Hương', 'Đặng Ngọc Anh',
  'Trần Văn Tuấn', 'Trần Đình Trọng', 'Phạm Thị Mùi', 'Đỗ Thành Đạt', 'Nguyễn Kiên Cường',
  'Bùi Văn Hào', 'Lê Văn Nam', 'Phan Văn Đức', 'Dương Thị Hồng', 'Đinh Quang Sáng',
  'Lý Hải Triều', 'Vương Đình Huệ', 'Mai Thu Trang', 'Hồ Văn Cường', 'Tạ Thị Bích',
  'Cao Văn Thắng', 'Lương Minh Triết', 'Nguyễn Hải Đăng', 'Trần Phương Thảo', 'Phạm Thị Lan'
];

export const REALISTIC_STALL_DEFS = [
  {
    "code": "B01",
    "zoneId": "zone_B",
    "x": 173,
    "y": 100,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B02",
    "zoneId": "zone_B",
    "x": 228,
    "y": 100,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B03",
    "zoneId": "zone_B",
    "x": 283,
    "y": 100,
    "w": 54,
    "h": 56,
    "category": "Rau củ",
    "isSpecial": "B03"
  },
  {
    "code": "B04",
    "zoneId": "zone_B",
    "x": 340,
    "y": 100,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B05",
    "zoneId": "zone_B",
    "x": 395,
    "y": 100,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B06",
    "zoneId": "zone_B",
    "x": 173,
    "y": 167,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B07",
    "zoneId": "zone_B",
    "x": 228,
    "y": 167,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B08",
    "zoneId": "zone_B",
    "x": 283,
    "y": 167,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B09",
    "zoneId": "zone_B",
    "x": 340,
    "y": 167,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B10",
    "zoneId": "zone_B",
    "x": 395,
    "y": 167,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B11",
    "zoneId": "zone_B",
    "x": 173,
    "y": 234,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B12",
    "zoneId": "zone_B",
    "x": 228,
    "y": 234,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B13",
    "zoneId": "zone_B",
    "x": 283,
    "y": 234,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B14",
    "zoneId": "zone_B",
    "x": 340,
    "y": 234,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "B15",
    "zoneId": "zone_B",
    "x": 395,
    "y": 234,
    "w": 54,
    "h": 56,
    "category": "Rau củ"
  },
  {
    "code": "A01",
    "zoneId": "zone_A",
    "x": 568,
    "y": 100,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A02",
    "zoneId": "zone_A",
    "x": 627,
    "y": 100,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A03",
    "zoneId": "zone_A",
    "x": 686,
    "y": 100,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A04",
    "zoneId": "zone_A",
    "x": 744,
    "y": 100,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A05",
    "zoneId": "zone_A",
    "x": 803,
    "y": 100,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A09",
    "zoneId": "zone_A",
    "x": 568,
    "y": 167,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A10",
    "zoneId": "zone_A",
    "x": 627,
    "y": 167,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A11",
    "zoneId": "zone_A",
    "x": 686,
    "y": 167,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A12",
    "zoneId": "zone_A",
    "x": 744,
    "y": 167,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi",
    "isSpecial": "A12"
  },
  {
    "code": "A13",
    "zoneId": "zone_A",
    "x": 803,
    "y": 167,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A17",
    "zoneId": "zone_A",
    "x": 568,
    "y": 234,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A18",
    "zoneId": "zone_A",
    "x": 627,
    "y": 234,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A19",
    "zoneId": "zone_A",
    "x": 686,
    "y": 234,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A20",
    "zoneId": "zone_A",
    "x": 744,
    "y": 234,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "A21",
    "zoneId": "zone_A",
    "x": 803,
    "y": 234,
    "w": 57,
    "h": 56,
    "category": "Thực phẩm tươi"
  },
  {
    "code": "C01",
    "zoneId": "zone_C",
    "x": 137,
    "y": 358,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C02",
    "zoneId": "zone_C",
    "x": 188,
    "y": 358,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C03",
    "zoneId": "zone_C",
    "x": 239,
    "y": 358,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C04",
    "zoneId": "zone_C",
    "x": 290,
    "y": 358,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C05",
    "zoneId": "zone_C",
    "x": 341,
    "y": 358,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C09",
    "zoneId": "zone_C",
    "x": 137,
    "y": 418,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C10",
    "zoneId": "zone_C",
    "x": 188,
    "y": 418,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C11",
    "zoneId": "zone_C",
    "x": 239,
    "y": 418,
    "w": 46,
    "h": 52,
    "category": "Gia vị",
    "isSpecial": "C11"
  },
  {
    "code": "C12",
    "zoneId": "zone_C",
    "x": 290,
    "y": 418,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C13",
    "zoneId": "zone_C",
    "x": 341,
    "y": 418,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C17",
    "zoneId": "zone_C",
    "x": 137,
    "y": 478,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C18",
    "zoneId": "zone_C",
    "x": 188,
    "y": 478,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C19",
    "zoneId": "zone_C",
    "x": 239,
    "y": 478,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C20",
    "zoneId": "zone_C",
    "x": 290,
    "y": 478,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C21",
    "zoneId": "zone_C",
    "x": 341,
    "y": 478,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C25",
    "zoneId": "zone_C",
    "x": 137,
    "y": 538,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C26",
    "zoneId": "zone_C",
    "x": 188,
    "y": 538,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C27",
    "zoneId": "zone_C",
    "x": 239,
    "y": 538,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C28",
    "zoneId": "zone_C",
    "x": 290,
    "y": 538,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "C29",
    "zoneId": "zone_C",
    "x": 341,
    "y": 538,
    "w": 46,
    "h": 52,
    "category": "Gia vị"
  },
  {
    "code": "D01",
    "zoneId": "zone_D",
    "x": 400,
    "y": 358,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D02",
    "zoneId": "zone_D",
    "x": 449,
    "y": 358,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D03",
    "zoneId": "zone_D",
    "x": 498,
    "y": 358,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D04",
    "zoneId": "zone_D",
    "x": 547,
    "y": 358,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D09",
    "zoneId": "zone_D",
    "x": 400,
    "y": 418,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D10",
    "zoneId": "zone_D",
    "x": 449,
    "y": 418,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D11",
    "zoneId": "zone_D",
    "x": 498,
    "y": 418,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D12",
    "zoneId": "zone_D",
    "x": 547,
    "y": 418,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D17",
    "zoneId": "zone_D",
    "x": 400,
    "y": 478,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D18",
    "zoneId": "zone_D",
    "x": 449,
    "y": 478,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D19",
    "zoneId": "zone_D",
    "x": 498,
    "y": 478,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D20",
    "zoneId": "zone_D",
    "x": 547,
    "y": 478,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D25",
    "zoneId": "zone_D",
    "x": 400,
    "y": 538,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D26",
    "zoneId": "zone_D",
    "x": 449,
    "y": 538,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D27",
    "zoneId": "zone_D",
    "x": 498,
    "y": 538,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "D28",
    "zoneId": "zone_D",
    "x": 547,
    "y": 538,
    "w": 45,
    "h": 52,
    "category": "Thời trang"
  },
  {
    "code": "E01",
    "zoneId": "zone_E",
    "x": 628,
    "y": 353,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E02",
    "zoneId": "zone_E",
    "x": 682,
    "y": 353,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E03",
    "zoneId": "zone_E",
    "x": 736,
    "y": 353,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E04",
    "zoneId": "zone_E",
    "x": 790,
    "y": 353,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E08",
    "zoneId": "zone_E",
    "x": 844,
    "y": 353,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực",
    "isSpecial": "E08"
  },
  {
    "code": "E09",
    "zoneId": "zone_E",
    "x": 628,
    "y": 418,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E10",
    "zoneId": "zone_E",
    "x": 682,
    "y": 418,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E11",
    "zoneId": "zone_E",
    "x": 736,
    "y": 418,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E12",
    "zoneId": "zone_E",
    "x": 790,
    "y": 418,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E13",
    "zoneId": "zone_E",
    "x": 844,
    "y": 418,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E17",
    "zoneId": "zone_E",
    "x": 628,
    "y": 478,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E18",
    "zoneId": "zone_E",
    "x": 682,
    "y": 478,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E19",
    "zoneId": "zone_E",
    "x": 736,
    "y": 478,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E20",
    "zoneId": "zone_E",
    "x": 790,
    "y": 478,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E21",
    "zoneId": "zone_E",
    "x": 844,
    "y": 478,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E25",
    "zoneId": "zone_E",
    "x": 628,
    "y": 538,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E26",
    "zoneId": "zone_E",
    "x": 682,
    "y": 538,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E27",
    "zoneId": "zone_E",
    "x": 736,
    "y": 538,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E28",
    "zoneId": "zone_E",
    "x": 790,
    "y": 538,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  },
  {
    "code": "E29",
    "zoneId": "zone_E",
    "x": 844,
    "y": 538,
    "w": 48,
    "h": 52,
    "category": "Ẩm thực"
  }
];

export const REALISTIC_FLOOR_DATA: FloorEntity = {
  schemaVersion: '3.2.0',
  id: 'floor_dong_xuan_realistic_25d',
  marketId: 'market_dong_xuan',
  floorNumber: 1,
  name: 'Mặt Bằng Thực Tế 2.5D Chợ Đồng Xuân',
  subTitle: 'Sơ Đồ Phối Cảnh Chân Thực • 86 Sạp Tác Chiến Tích Hợp',
  elevationMeters: 0.0,
  ceilingHeightMeters: 5.2,
  coordinateSystem: {
    width: 1024,
    height: 682,
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
      [30, 10],
      [994, 10],
      [994, 672],
      [30, 672]
    ]
  },
  aisles: [],
  incidents: [
    {
      id: 'incident_A12_water',
      code: 'INC-A12',
      floorId: 'floor_dong_xuan_realistic_25d',
      title: 'Tràn nước xả hải sản ra lối đi',
      category: 'water',
      geometry: { type: 'point', coordinates: [790, 200] },
      targetEntityRef: {
        entityType: 'stall',
        entityId: 'stall_A12'
      },
      state: {
        status: 'open',
        severity: 'critical',
        actionRequired: 'Hút nước và xử lý van đáy',
        reportedAt: '10:15 - Hôm nay',
        lastUpdated: '10:18 - Hôm nay'
      },
      complaintsCount: 1,
      complaintIds: ['comp_A12_01']
    },
    {
      id: 'incident_E08_gas',
      code: 'INC-E08',
      floorId: 'floor_dong_xuan_realistic_25d',
      title: 'Rò rỉ van gas cụm bếp nấu',
      category: 'fire_safety',
      geometry: { type: 'point', coordinates: [870, 380] },
      targetEntityRef: {
        entityType: 'stall',
        entityId: 'stall_E08'
      },
      state: {
        status: 'open',
        severity: 'critical',
        actionRequired: 'Khóa van tổng và kiểm tra bình gas',
        reportedAt: '10:20 - Hôm nay',
        lastUpdated: '10:22 - Hôm nay'
      },
      complaintsCount: 1,
      complaintIds: ['comp_E08_01']
    }
  ],
  zones: [
    {
      id: 'zone_B',
      code: 'B',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'Khu B — Rau Củ Quả & Nông Sản VietGAP',
      subTitle: 'Tây Bắc Chợ • 15 Sạp',
      category: 'Rau củ',
      geometry: { type: 'rectangle', x: 154, y: 92, width: 300, height: 204 },
      boundingBox: { minX: 154, minY: 92, maxX: 454, maxY: 296, width: 300, height: 204 },
      visualTheme: { colorToken: '#16a34a' },
      totalStallsCount: 15,
      stallIds: []
    },
    {
      id: 'zone_A',
      code: 'A',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'Khu A — Hải Sản & Thực Phẩm Tươi Sống',
      subTitle: 'Đông Bắc Chợ • 15 Sạp',
      category: 'Thực phẩm tươi',
      geometry: { type: 'rectangle', x: 554, y: 92, width: 316, height: 204 },
      boundingBox: { minX: 554, minY: 92, maxX: 870, maxY: 296, width: 316, height: 204 },
      visualTheme: { colorToken: '#0d9488' },
      totalStallsCount: 15,
      stallIds: []
    },
    {
      id: 'zone_C',
      code: 'C',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'Khu C — Bách Hóa Tổng Hợp & Đồ Khô',
      subTitle: 'Tây Nam Chợ • 20 Sạp',
      category: 'Gia vị',
      geometry: { type: 'rectangle', x: 126, y: 350, width: 268, height: 248 },
      boundingBox: { minX: 126, minY: 350, maxX: 394, maxY: 598, width: 268, height: 248 },
      visualTheme: { colorToken: '#d97706' },
      totalStallsCount: 20,
      stallIds: []
    },
    {
      id: 'zone_D',
      code: 'D',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'Khu D — Thời Trang & May Mặc',
      subTitle: 'Nam Trung Tâm • 16 Sạp',
      category: 'Thời trang',
      geometry: { type: 'rectangle', x: 394, y: 350, width: 206, height: 248 },
      boundingBox: { minX: 394, minY: 350, maxX: 600, maxY: 598, width: 206, height: 248 },
      visualTheme: { colorToken: '#2563eb' },
      totalStallsCount: 16,
      stallIds: []
    },
    {
      id: 'zone_E',
      code: 'E',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'Khu E — Ẩm Thực & Đồ Uống Truyền Thống',
      subTitle: 'Đông Nam Chợ • 20 Sạp',
      category: 'Ẩm thực',
      geometry: { type: 'rectangle', x: 620, y: 345, width: 284, height: 253 },
      boundingBox: { minX: 620, minY: 345, maxX: 904, maxY: 598, width: 284, height: 253 },
      visualTheme: { colorToken: '#0891b2' },
      totalStallsCount: 20,
      stallIds: []
    }
  ],
  stalls: REALISTIC_STALL_DEFS.map((def, idx) => {
    const isA12 = def.code === 'A12';
    const isE08 = def.code === 'E08';
    const isB03 = def.code === 'B03';
    const isC11 = def.code === 'C11';

    const merchantName = isA12 ? 'Trần Văn Hùng' :
                         isE08 ? 'Hoàng Minh Châu' :
                         isB03 ? 'Nguyễn Thị Mai' :
                         isC11 ? 'Đỗ Thành Đạt' :
                         VIETNAMESE_NAMES[idx % VIETNAMESE_NAMES.length];

    const complaintsCount = (isA12 || isE08) ? 1 : 0;
    const feeStatus = isC11 ? 'overdue' : 'paid';
    const contractDaysLeft = isB03 ? 15 : (isC11 ? 5 : (90 + (idx % 180)));

    const issues: any[] = [];
    if (isA12) {
      issues.push({
        id: 'issue_A12_water',
        issueType: 'complaint',
        title: 'Tràn nước xả hải sản ra lối đi chung',
        description: 'Bể sục khí hải sản bị rò rỉ van đáy, nước tràn tràn ra hành lang đi lại, nguy cơ trơn trượt mất an toàn.',
        priority: 'P0',
        severity: 'critical',
        reportedAt: '10:15 - Hôm nay',
        assignedTo: { teamName: 'Đội Vệ Sinh Môi Trường', phone: '0912.345.678' },
        specificType: 'water'
      });
    } else if (isE08) {
      issues.push({
        id: 'issue_E08_gas',
        issueType: 'complaint',
        title: 'Rò rỉ bình gas cụm nấu nướng',
        description: 'Cảm biến phát hiện nồng độ LPG vượt ngưỡng cảnh báo tại cụm bếp nấu, yêu cầu kiểm tra ngắt gas ngay lập tức.',
        priority: 'P0',
        severity: 'critical',
        reportedAt: '10:20 - Hôm nay',
        assignedTo: { teamName: 'Đội PCCC & An Toàn', phone: '0988.114.114' },
        specificType: 'fire_safety'
      });
    } else if (isB03) {
      issues.push({
        id: 'issue_B03_warning',
        issueType: 'contract_expiry',
        title: 'Hợp đồng thuê sắp hết hạn & Cần xác thực VietGAP',
        description: 'Hợp đồng điểm kinh doanh còn 15 ngày, cần hoàn tất hồ sơ gia hạn và cập nhật chứng nhận nguồn gốc xuất xứ.',
        priority: 'P2',
        severity: 'warning',
        reportedAt: 'Hôm qua',
        assignedTo: { teamName: 'Tổ Quản Lý Hợp Đồng', phone: '0903.222.111' }
      });
    } else if (isC11) {
      issues.push({
        id: 'issue_C11_overdue',
        issueType: 'fee_overdue',
        title: 'Nợ phí dịch vụ quản lý chợ quá hạn',
        description: 'Chưa đóng phí quản lý chợ và tiền điện chiếu sáng tháng 8/2026, quá hạn 45 ngày.',
        priority: 'P1',
        severity: 'warning',
        reportedAt: 'Đầu tuần',
        assignedTo: { teamName: 'Tổ Thu Phí & Tài Chính', phone: '0904.333.444' }
      });
    }

    return {
      id: 'stall_' + def.code,
      code: def.code,
      zoneId: def.zoneId,
      floorId: 'floor_dong_xuan_realistic_25d',
      geometry: {
        type: 'rectangle',
        x: def.x,
        y: def.y,
        width: def.w,
        height: def.h,
        elevationZ: 0,
        height3D: 2.2
      },
      boundingBox: {
        minX: def.x,
        minY: def.y,
        maxX: def.x + def.w,
        maxY: def.y + def.h,
        width: def.w,
        height: def.h
      },
      metadata: {
        name: 'Sạp ' + def.code + ' — ' + (
          def.category === 'Rau củ' ? 'Nông sản sạch' :
          def.category === 'Thực phẩm tươi' ? 'Hải sản tươi sống' :
          def.category === 'Gia vị' ? 'Bách hóa đồ khô' :
          def.category === 'Thời trang' ? 'Thời trang may mặc' :
          'Ẩm thực đặc sản'
        ),
        merchantName,
        phone: '09' + Math.floor(10000000 + Math.random() * 90000000),
        category: def.category,
        areaM2: 6.5,
        monthlyEstimatedRevenue: '45.000.000 đ',
        rating: isA12 ? 3.8 : 4.8,
        ratingCount: 32,
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        issues,
        hasActiveIssues: issues.length > 0,
        highestSeverity: (isA12 || isE08) ? 'critical' : (isB03 || isC11 ? 'warning' : 'normal'),
        isUnderMaintenance: false,
        complaintsCount,
        hasCriticalComplaint: complaintsCount > 0,
        contractDaysLeft,
        isExpiringSoon: contractDaysLeft <= 30,
        isCriticalExpiry: contractDaysLeft <= 7,
        feeStatus,
        overdueAmount: isC11 ? '3.450.000 đ' : undefined,
        tags: [def.category]
      }
    } as StallEntity;
  }),
  gates: [
    {
      id: 'gate_bac',
      code: 'G-BAC',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'CỔNG BẮC',
      type: 'main_entry',
      geometry: { type: 'rectangle', x: 471, y: 7, width: 77, height: 20 },
      orientationDegrees: 0,
      connectedStreet: 'Phố Hàng Khoai',
      widthMeters: 7.7,
      isOpen: true
    },
    {
      id: 'gate_nam',
      code: 'G-NAM',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'CỔNG NAM',
      type: 'main_entry',
      geometry: { type: 'rectangle', x: 479, y: 632, width: 68, height: 20 },
      orientationDegrees: 180,
      connectedStreet: 'Phố Cầu Đông',
      widthMeters: 6.8,
      isOpen: true
    },
    {
      id: 'gate_tay',
      code: 'G-TAY',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'CỔNG TÂY',
      type: 'side_entry',
      geometry: { type: 'rectangle', x: 8, y: 300, width: 51, height: 26 },
      orientationDegrees: 270,
      connectedStreet: 'Phố Hàng Giấy',
      widthMeters: 5.1,
      isOpen: true
    },
    {
      id: 'gate_dong',
      code: 'G-DONG',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'CỔNG ĐÔNG',
      type: 'side_entry',
      geometry: { type: 'rectangle', x: 961, y: 300, width: 52, height: 26 },
      orientationDegrees: 90,
      connectedStreet: 'Phố Đồng Xuân',
      widthMeters: 5.2,
      isOpen: true
    }
  ],
  facilities: [
    {
      id: 'fac_nhan_hang_tay',
      code: 'KHO-TAY',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'Khu Nhận Hàng & Tiếp Vận Tây',
      type: 'waste_depot',
      geometry: { type: 'rectangle', x: 65, y: 550, width: 50, height: 50 },
      boundingBox: { minX: 65, minY: 550, maxX: 115, maxY: 600, width: 50, height: 50 },
      metadata: {
        managedBy: 'Tổ Tiếp Vận BQL',
        openHours: '04:00 - 18:00'
      },
      state: {
        isOperational: true
      }
    },
    {
      id: 'fac_nhan_hang_dong',
      code: 'KHO-DONG',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'Khu Nhận Hàng & Tiếp Vận Đông',
      type: 'waste_depot',
      geometry: { type: 'rectangle', x: 910, y: 550, width: 50, height: 50 },
      boundingBox: { minX: 910, minY: 550, maxX: 960, maxY: 600, width: 50, height: 50 },
      metadata: {
        managedBy: 'Tổ Tiếp Vận BQL',
        openHours: '04:00 - 18:00'
      },
      state: {
        isOperational: true
      }
    }
  ],
  infrastructures: [
    {
      id: 'cctv_cam_bac_1',
      code: 'CAM-B1',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'Camera Cổng Bắc Trái',
      type: 'cctv_camera',
      geometry: { type: 'point', coordinates: [405, 70] },
      metadata: {
        responsibleTechnician: 'Nguyễn Văn An',
        phone: '0912.345.678'
      },
      state: {
        status: 'normal'
      }
    },
    {
      id: 'cctv_cam_bac_2',
      code: 'CAM-B2',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'Camera Cổng Bắc Phải',
      type: 'cctv_camera',
      geometry: { type: 'point', coordinates: [615, 70] },
      metadata: {
        responsibleTechnician: 'Nguyễn Văn An',
        phone: '0912.345.678'
      },
      state: {
        status: 'normal'
      }
    },
    {
      id: 'cctv_cam_trung_tam_1',
      code: 'CAM-TT1',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'Camera Hành Lang Trung Tâm Tây',
      type: 'cctv_camera',
      geometry: { type: 'point', coordinates: [465, 210] },
      metadata: {
        responsibleTechnician: 'Trần Đình Trọng',
        phone: '0988.112.233'
      },
      state: {
        status: 'normal'
      }
    },
    {
      id: 'cctv_cam_trung_tam_2',
      code: 'CAM-TT2',
      floorId: 'floor_dong_xuan_realistic_25d',
      name: 'Camera Hành Lang Trung Tâm Đông',
      type: 'cctv_camera',
      geometry: { type: 'point', coordinates: [540, 210] },
      metadata: {
        responsibleTechnician: 'Trần Đình Trọng',
        phone: '0988.112.233'
      },
      state: {
        status: 'normal'
      }
    }
  ]
};
