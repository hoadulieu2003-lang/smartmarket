import type { MarketEntity, FloorEntity } from './types';

/**
 * SAMPLE CANONICAL SPATIAL DATASET — CHỢ ĐỒNG XUÂN (TẦNG 1)
 * Schema Version: 3.2.0 (Phase 3A.2 Contract Hardening)
 * 
 * Local Coordinate System:
 * - Width: 1000 units, Height: 700 units
 * - Origin: Top-Left (0, 0) tại góc Tây Bắc
 * - X Axis: Tăng dần về hướng Đông (0 -> 1000)
 * - Y Axis: Tăng dần về hướng Nam (0 -> 700)
 * - Scale: 1 unit = 0.1 mét (10cm) => Kích thước sàn 100m x 70m
 * - Rotation: Chuẩn độ (0 - 360), 0° = Hướng Bắc, xoay theo chiều kim đồng hồ
 */

export const SAMPLE_FLOOR_1_DATA: FloorEntity = {
  schemaVersion: '3.2.0',
  id: 'floor_1',
  marketId: 'market_dong_xuan',
  floorNumber: 1,
  name: 'Mặt bằng Tầng 1',
  subTitle: 'Thực phẩm tươi sống & Nhu yếu phẩm',
  elevationMeters: 0.0,
  ceilingHeightMeters: 3.8,
  
  coordinateSystem: {
    width: 1000,
    height: 700,
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

  // Đường bao ranh giới kiến trúc chu vi tòa nhà Tầng 1 (Polygon)
  boundary: {
    type: 'polygon',
    vertices: [
      [30, 40],
      [970, 40],
      [970, 660],
      [30, 660]
    ],
    elevationZ: 0,
    height3D: 3.8
  },

  // ==========================================================================
  // 1. ZONES (3 PHÂN KHU CHỨC NĂNG)
  // ==========================================================================
  zones: [
    {
      id: 'zone_A',
      code: 'A',
      floorId: 'floor_1',
      name: 'Khu A — Thực phẩm tươi sống',
      subTitle: 'Dãy Đông • Thủy hải sản & Thịt tươi',
      category: 'Thực phẩm tươi',
      geometry: {
        type: 'rectangle',
        x: 650,
        y: 100,
        width: 300,
        height: 500,
        elevationZ: 0,
        height3D: 3.0
      },
      boundingBox: { minX: 650, minY: 100, maxX: 950, maxY: 600, width: 300, height: 500 },
      visualTheme: { colorToken: '#1e293b' },
      totalStallsCount: 14,
      stallIds: ['stall_A01', 'stall_A02', 'stall_A03', 'stall_A12', 'stall_A14_CORNER']
    },
    {
      id: 'zone_B',
      code: 'B',
      floorId: 'floor_1',
      name: 'Khu B — Nông sản & Rau củ quả',
      subTitle: 'Trục Trung Tâm • Nông sản sạch & Trái cây',
      category: 'Nông sản & Hoa quả',
      geometry: {
        type: 'rectangle',
        x: 360,
        y: 100,
        width: 270,
        height: 500,
        elevationZ: 0,
        height3D: 3.0
      },
      boundingBox: { minX: 360, minY: 100, maxX: 630, maxY: 600, width: 270, height: 500 },
      visualTheme: { colorToken: '#076C31' },
      totalStallsCount: 12,
      stallIds: ['stall_B01', 'stall_B07_ROTATED']
    },
    {
      id: 'zone_C',
      code: 'C',
      floorId: 'floor_1',
      name: 'Khu C — Nhu yếu phẩm & Đồ khô',
      subTitle: 'Dãy Tây • Bách hóa & Gia vị khô',
      category: 'Bách hóa & Đồ khô',
      geometry: {
        type: 'rectangle',
        x: 50,
        y: 100,
        width: 290,
        height: 500,
        elevationZ: 0,
        height3D: 3.0
      },
      boundingBox: { minX: 50, minY: 100, maxX: 340, maxY: 600, width: 290, height: 500 },
      visualTheme: { colorToken: '#475569' },
      totalStallsCount: 12,
      stallIds: ['stall_C01', 'stall_C08', 'stall_C12_EMPTY']
    }
  ],

  // ==========================================================================
  // 2. STALLS (RECTANGLE, ROTATED RECTANGLE, POLYGON L-SHAPE, MULTI-ISSUE)
  // ==========================================================================
  stalls: [
    // 2.1. SẠP TIÊU CHUẨN (A01 - RECTANGLE ĐỘC LẬP)
    {
      id: 'stall_A01',
      code: 'A01',
      zoneId: 'zone_A',
      floorId: 'floor_1',
      geometry: {
        type: 'rectangle',
        x: 660,
        y: 120,
        width: 120,
        height: 60,
        elevationZ: 0,
        height3D: 2.4
      },
      boundingBox: { minX: 660, minY: 120, maxX: 780, maxY: 180, width: 120, height: 60 },
      metadata: {
        name: 'Thịt bò Tươi Sạch',
        merchantName: 'Nguyễn Văn Hùng',
        phone: '0912 345 678',
        category: 'Thực phẩm tươi',
        areaM2: 7.2,
        monthlyEstimatedRevenue: '55.000.000đ',
        rating: 4.9,
        ratingCount: 154,
        foodSafetyCert: 'Còn hiệu lực (Hạn 05/2027)',
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
        contractDaysLeft: 210,
        isExpiringSoon: false,
        isCriticalExpiry: false,
        feeStatus: 'paid',
        tags: ['qr_active', 'standard_stall']
      }
    },

    // 2.2. SẠP ĐA TRẠNG THÁI HARDENED (A12: >= 4 INDEPENDENT OPERATIONAL ISSUES)
    {
      id: 'stall_A12',
      code: 'A12',
      zoneId: 'zone_A',
      floorId: 'floor_1',
      geometry: {
        type: 'rectangle',
        x: 800,
        y: 340,
        width: 130,
        height: 70,
        elevationZ: 0,
        height3D: 2.4
      },
      boundingBox: { minX: 800, minY: 340, maxX: 930, maxY: 410, width: 130, height: 70 },
      metadata: {
        name: 'Hải sản Tươi Sống Thu Thủy',
        merchantName: 'Trần Thị Thủy',
        phone: '0904 556 789',
        category: 'Thực phẩm tươi sống (Hải sản tươi sống)',
        areaM2: 9.1,
        monthlyEstimatedRevenue: '72.000.000đ',
        rating: 4.3,
        ratingCount: 88,
        foodSafetyCert: 'Còn hiệu lực',
        notes: 'Sạp có bể sục cá hải sản, cần bảo đảm tiêu chuẩn thoát sàn.',
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        hasActiveIssues: true,
        highestSeverity: 'critical',
        isUnderMaintenance: false,
        complaintsCount: 2,
        hasCriticalComplaint: true,
        contractDaysLeft: 5,
        isExpiringSoon: true,
        isCriticalExpiry: true,
        feeStatus: 'overdue',
        overdueAmount: '1.850.000đ',
        tags: ['critical_incident', 'urgent_renewal', 'drainage_hotspot'],
        
        // 4 OPERATIONAL ISSUES ĐỘC LẬP THEO GENERIC DOMAIN ENGINE:
        issues: [
          // Issue 1: Phản ánh nước tràn (Complaint - Critical)
          {
            id: 'issue_a12_water_leak',
            type: 'complaint',
            code: 'CP-A12-01',
            title: 'Nước rửa cá tràn ra lối đi chính gây trơn trượt nguy hiểm',
            severity: 'critical',
            status: 'open',
            createdAt: '2026-08-31T08:30:00Z',
            updatedAt: '2026-08-31T10:15:00Z',
            dueAt: '2026-08-31T11:00:00Z',
            reportedBy: { role: 'customer', name: 'Khách mua hàng' },
            assignedTo: { teamName: 'Đội Trật tự & Môi trường BQL', personName: 'Nguyễn Văn Đức', phone: '0912 889 900' },
            entityRef: { entityType: 'stall', entityId: 'stall_A12', subComponent: 'Cửa ra vào sạp' },
            payload: { category: 'water_leak', impactAreaM2: 3.5 }
          },
          // Issue 2: Hạn hợp đồng dưới 7 ngày (Contract Expiry - High)
          {
            id: 'issue_a12_contract_expiry',
            type: 'contract_expiry',
            code: 'HD-2024-A12',
            title: 'Hợp đồng thuê sạp còn 5 ngày chưa nộp hồ sơ tái ký',
            severity: 'high',
            status: 'in_progress',
            createdAt: '2026-08-25T00:00:00Z',
            updatedAt: '2026-08-31T08:00:00Z',
            dueAt: '2026-09-05T17:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A12' },
            payload: { contractDaysLeft: 5, expiryDate: '05/09/2026', renewalStatus: 'chưa_nộp_hồ_sơ' }
          },
          // Issue 3: Nợ phí dịch vụ quá hạn (Fee Overdue - Medium)
          {
            id: 'issue_a12_fee_overdue',
            type: 'fee_overdue',
            code: 'FEE-2026-08-A12',
            title: 'Khoản nợ phí dịch vụ và tiền điện 3 pha quá hạn 14 ngày',
            severity: 'medium',
            status: 'open',
            createdAt: '2026-08-17T00:00:00Z',
            updatedAt: '2026-08-31T07:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A12' },
            payload: { overdueAmount: '1.850.000đ', overdueDays: 14, feeTypes: ['Điện 3 pha', 'Phí vệ sinh'] }
          },
          // Issue 4: Yêu cầu định kỳ kiểm tra ATTP (Food Safety - Low)
          {
            id: 'issue_a12_food_safety_check',
            type: 'food_safety',
            code: 'ATTP-2026-Q3-01',
            title: 'Lịch thanh tra định kỳ nguồn gốc hải sản tươi sống Quý 3',
            severity: 'low',
            status: 'investigating',
            createdAt: '2026-08-28T09:00:00Z',
            updatedAt: '2026-08-31T09:00:00Z',
            dueAt: '2026-09-10T17:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A12' },
            payload: { certificateExpiry: '11/2026', inspectorTeam: 'Ban Kiểm tra ATTP TP. Hà Nội' }
          }
        ]
      }
    },

    // 2.3. SẠP XOAY GÓC (B07 - ROTATED RECTANGLE 15 ĐỘ)
    {
      id: 'stall_B07_ROTATED',
      code: 'B07',
      zoneId: 'zone_B',
      floorId: 'floor_1',
      rotation: 15,
      geometry: {
        type: 'rectangle',
        x: 400,
        y: 280,
        width: 110,
        height: 60,
        rotation: 15,
        rotationConfig: {
          angleDegrees: 15,
          direction: 'clockwise_from_north',
          pivot: 'center'
        },
        elevationZ: 0,
        height3D: 2.4
      },
      boundingBox: { minX: 395, minY: 275, maxX: 515, maxY: 350, width: 120, height: 75 },
      metadata: {
        name: 'Rau Sạch Mộc Châu (Sạp Xoay 15°)',
        merchantName: 'Trần Văn Tuấn',
        phone: '0915 667 889',
        category: 'Nông sản & Hoa quả',
        areaM2: 6.6,
        monthlyEstimatedRevenue: '42.000.000đ',
        rating: 4.7,
        ratingCount: 105,
        qrPaymentActive: true
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        hasActiveIssues: true,
        highestSeverity: 'medium',
        isUnderMaintenance: false,
        complaintsCount: 0,
        hasCriticalComplaint: false,
        contractDaysLeft: 12,
        isExpiringSoon: true,
        isCriticalExpiry: false,
        feeStatus: 'paid',
        tags: ['rotated_geometry', 'organic_produce'],
        issues: [
          {
            id: 'issue_b07_contract',
            type: 'contract_expiry',
            title: 'Hợp đồng thuê sạp B07 còn 12 ngày',
            severity: 'medium',
            status: 'open',
            createdAt: '2026-08-30T00:00:00Z',
            updatedAt: '2026-08-31T00:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_B07_ROTATED' },
            payload: { contractDaysLeft: 12, expiryDate: '11/09/2026' }
          }
        ]
      }
    },

    // 2.4. SẠP ĐA GIÁC BẤT QUY TẮC (A14 - POLYGON L-SHAPE VÁT GÓC)
    {
      id: 'stall_A14_CORNER',
      code: 'A14',
      zoneId: 'zone_A',
      floorId: 'floor_1',
      geometry: {
        type: 'polygon',
        vertices: [
          [810, 490],
          [930, 490],
          [930, 580],
          [870, 580],
          [870, 540],
          [810, 540]
        ],
        elevationZ: 0,
        height3D: 2.4
      },
      boundingBox: { minX: 810, minY: 490, maxX: 930, maxY: 580, width: 120, height: 90 },
      metadata: {
        name: 'Đặc sản Mực khô Cửa Lò (Sạp Góc L-Shape)',
        merchantName: 'Hoàng Thị Dung',
        phone: '0978 112 334',
        category: 'Thực phẩm tươi & Khô',
        areaM2: 11.5,
        monthlyEstimatedRevenue: '45.000.000đ',
        rating: 4.8,
        ratingCount: 112,
        notes: 'Sạp góc vát đặc thù giáp cửa thoát hiểm Đông Nam.',
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
        tags: ['irregular_polygon', 'corner_unit']
      }
    },

    // 2.5. SẠP BẢO TRÌ (A03)
    {
      id: 'stall_A03',
      code: 'A03',
      zoneId: 'zone_A',
      floorId: 'floor_1',
      geometry: {
        type: 'rectangle',
        x: 660,
        y: 200,
        width: 120,
        height: 60,
        height3D: 2.4
      },
      boundingBox: { minX: 660, minY: 200, maxX: 780, maxY: 260, width: 120, height: 60 },
      metadata: {
        name: 'Tôm Cua Cà Mau',
        merchantName: 'Trịnh Quốc Bảo',
        phone: '0903 221 109',
        category: 'Thực phẩm tươi',
        areaM2: 7.2,
        monthlyEstimatedRevenue: '38.000.000đ',
        rating: 4.6,
        ratingCount: 72,
        qrPaymentActive: false
      },
      state: {
        isOccupied: true,
        occupancyStatus: 'active',
        hasActiveIssues: true,
        highestSeverity: 'medium',
        isUnderMaintenance: true,
        complaintsCount: 0,
        hasCriticalComplaint: false,
        contractDaysLeft: 98,
        isExpiringSoon: false,
        isCriticalExpiry: false,
        feeStatus: 'paid',
        tags: ['maintenance_mode'],
        issues: [
          {
            id: 'issue_a03_pipe_maintenance',
            type: 'maintenance',
            code: 'MAINT-2026-0831-01',
            title: 'Sửa đường ống cấp thoát nước ngầm và thay đồng hồ nước',
            severity: 'medium',
            status: 'in_progress',
            createdAt: '2026-08-31T07:00:00Z',
            updatedAt: '2026-08-31T09:00:00Z',
            dueAt: '2026-08-31T17:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A03' },
            payload: { contractor: 'Đội Điện nước BQL', expectedFinish: '31/08/2026 17:00' }
          }
        ]
      }
    },

    // 2.6. SẠP TRỐNG (C12)
    {
      id: 'stall_C12_EMPTY',
      code: 'C12',
      zoneId: 'zone_C',
      floorId: 'floor_1',
      geometry: {
        type: 'rectangle',
        x: 200,
        y: 490,
        width: 120,
        height: 60,
        height3D: 2.4
      },
      boundingBox: { minX: 200, minY: 490, maxX: 320, maxY: 550, width: 120, height: 60 },
      metadata: {
        name: 'Sạp trống số C12 (Sẵn sàng cho thuê)',
        merchantName: 'Chưa có tiểu thương',
        phone: 'BQL: 024 3828 0123',
        category: 'Bách hóa & Đồ khô',
        areaM2: 7.2,
        monthlyEstimatedRevenue: '0đ',
        rating: 0,
        ratingCount: 0,
        qrPaymentActive: false
      },
      state: {
        isOccupied: false,
        occupancyStatus: 'empty',
        issues: [],
        hasActiveIssues: false,
        isUnderMaintenance: false,
        complaintsCount: 0,
        hasCriticalComplaint: false,
        contractDaysLeft: 0,
        isExpiringSoon: false,
        isCriticalExpiry: false,
        feeStatus: 'pending',
        tags: ['available_for_lease']
      }
    }
  ],

  // ==========================================================================
  // 3. AISLES & PATHWAYS (CÓ ĐỘ RỘNG THỰC TẾ WIDTH / WIDTH_METERS)
  // ==========================================================================
  aisles: [
    {
      id: 'aisle_main_north_south',
      code: 'AISLE-MAIN-NS',
      floorId: 'floor_1',
      name: 'Trục đường chính Bắc — Nam',
      type: 'main_corridor',
      geometry: {
        type: 'path',
        points: [
          [500, 50],
          [500, 650]
        ],
        width: 40,
        widthMeters: 4.0,
        cap: 'round',
        join: 'round'
      },
      widthMeters: 4.0,
      flowDirection: 'two_way',
      isClearOfObstacles: true
    },
    {
      id: 'aisle_east_corridor',
      code: 'AISLE-E01',
      floorId: 'floor_1',
      name: 'Hành lang thông thủy Dãy Đông',
      type: 'sub_aisle',
      geometry: {
        type: 'path',
        points: [
          [790, 110],
          [790, 590]
        ],
        width: 25,
        widthMeters: 2.5
      },
      widthMeters: 2.5,
      flowDirection: 'two_way',
      isClearOfObstacles: false,
      activeObstructionIssueIds: ['issue_a12_water_leak']
    },
    {
      id: 'aisle_west_corridor',
      code: 'AISLE-W01',
      floorId: 'floor_1',
      name: 'Hành lang hàng khô Dãy Tây',
      type: 'sub_aisle',
      geometry: {
        type: 'path',
        points: [
          [190, 110],
          [190, 590]
        ],
        width: 25,
        widthMeters: 2.5
      },
      widthMeters: 2.5,
      flowDirection: 'two_way',
      isClearOfObstacles: true
    }
  ],

  // ==========================================================================
  // 4. GATES (CỔNG XUẤT NHẬP & CỬA RA VÀO CHÍNH CÓ ORIENTATION DEGREES)
  // ==========================================================================
  gates: [
    {
      id: 'gate_north',
      code: 'GATE-N01',
      floorId: 'floor_1',
      name: 'Cổng Bắc — Phố Hàng Khoai',
      type: 'logistics_entry',
      geometry: {
        type: 'rectangle',
        x: 420,
        y: 30,
        width: 160,
        height: 20,
        elevationZ: 0
      },
      orientationDegrees: 0, // Hướng Bắc
      connectedStreet: 'Phố Hàng Khoai',
      widthMeters: 16.0,
      isOpen: true
    },
    {
      id: 'gate_south',
      code: 'GATE-S01',
      floorId: 'floor_1',
      name: 'Cổng Nam — Phố Đồng Xuân',
      type: 'main_entry',
      geometry: {
        type: 'rectangle',
        x: 420,
        y: 650,
        width: 160,
        height: 20,
        elevationZ: 0
      },
      orientationDegrees: 180, // Hướng Nam
      connectedStreet: 'Phố Đồng Xuân',
      widthMeters: 16.0,
      isOpen: true
    }
  ],

  // ==========================================================================
  // 5. FACILITIES (TIỆN ÍCH CÔNG CỘNG & HÀNH CHÍNH)
  // ==========================================================================
  facilities: [
    {
      id: 'facility_wc_t1',
      code: 'WC-T1',
      floorId: 'floor_1',
      name: 'Khu vệ sinh công cộng Tầng 1',
      type: 'restroom',
      geometry: {
        type: 'rectangle',
        x: 50,
        y: 610,
        width: 90,
        height: 40,
        height3D: 2.8
      },
      boundingBox: { minX: 50, minY: 610, maxX: 140, maxY: 650, width: 90, height: 40 },
      metadata: {
        managedBy: 'Đội Vệ sinh Môi trường BQL',
        capacity: 12,
        openHours: '05:00 - 22:00'
      },
      state: {
        isOperational: true,
        cleanlinessStatus: 'clean',
        lastInspectedAt: '2026-08-31 09:00'
      }
    },
    {
      id: 'facility_bql_office',
      code: 'BQL-P102',
      floorId: 'floor_1',
      name: 'Văn phòng Trực ban Điều hành BQL (P.102)',
      type: 'bql_office',
      geometry: {
        type: 'rectangle',
        x: 160,
        y: 610,
        width: 120,
        height: 40,
        height3D: 2.8
      },
      boundingBox: { minX: 160, minY: 610, maxX: 280, maxY: 650, width: 120, height: 40 },
      metadata: {
        managedBy: 'Ban Quản Lý Chợ Đồng Xuân',
        openHours: '24/7'
      },
      state: {
        isOperational: true,
        lastInspectedAt: '2026-08-31 08:00'
      }
    }
  ],

  // ==========================================================================
  // 6. INFRASTRUCTURE (HẠ TẦNG KỸ THUẬT: CÓ ELEVATION_Z & THICKNESS)
  // ==========================================================================
  infrastructures: [
    // Tuyến cống ngầm Dãy Đông (Âm 0.5m dưới sàn)
    {
      id: 'infra_drain_east_pipe',
      code: 'DRAIN-E-PIPE',
      floorId: 'floor_1',
      name: 'Đường ống cống ngầm thoát nước Dãy Đông (A01 - A14)',
      type: 'drainage_pipe',
      geometry: {
        type: 'path',
        points: [
          [940, 120],
          [940, 590]
        ],
        width: 10,
        widthMeters: 1.0,
        elevationZ: -0.5 // Dưới lòng sàn 0.5m
      },
      connectedStallIds: ['stall_A01', 'stall_A12', 'stall_A14_CORNER', 'stall_A03'],
      metadata: {
        capacitySpec: 'Ống D300 bê tông cốt thép đúc sẵn',
        installationDate: '2022-04-15',
        responsibleTechnician: 'Nguyễn Văn Đức',
        phone: '0912 889 900'
      },
      state: {
        status: 'clogged',
        sensorReading: {
          waterFlowRate: 0.2,
          fillPercentage: 85
        }
      }
    },

    // Hố ga trung tâm Dãy Đông (Gần sạp A12)
    {
      id: 'infra_drain_manhole_e01',
      code: 'DRAIN-E01',
      floorId: 'floor_1',
      name: 'Hố ga cống thoát nước phía Đông (Khu A12-A16)',
      type: 'drainage_manhole',
      geometry: {
        type: 'point',
        coordinates: [940, 370],
        elevationZ: 0
      },
      connectedStallIds: ['stall_A12'],
      metadata: {
        responsibleTechnician: 'Đội Thông tắc Đô thị',
        phone: '0912 889 900'
      },
      state: {
        status: 'clogged'
      }
    },

    // Trụ cứu hỏa PCCC #04
    {
      id: 'infra_pccc_04',
      code: 'PCCC-04',
      floorId: 'floor_1',
      name: 'Trụ cứu hỏa & Bình bọt PCCC số 04',
      type: 'fire_hydrant',
      geometry: {
        type: 'point',
        coordinates: [310, 630],
        elevationZ: 0
      },
      metadata: {
        responsibleTechnician: 'Đội PCCC Cơ sở',
        phone: '114'
      },
      state: {
        status: 'normal'
      }
    }
  ],

  // ==========================================================================
  // 7. SPATIAL INCIDENTS (SỰ CỐ KHÔNG GIAN ĐÃ LIÊN KẾT REFERENCE TOÀN VẸN)
  // ==========================================================================
  incidents: [
    {
      id: 'incident_east_drain_clog',
      code: 'INC-2026-0831-01',
      floorId: 'floor_1',
      title: 'Cống thoát nước bốc mùi & nước thoát chậm tại Dãy Đông',
      category: 'water',
      geometry: {
        type: 'point',
        coordinates: [940, 370], // Tọa độ Hố ga DRAIN-E01
        elevationZ: 0
      },
      targetEntityRef: {
        entityType: 'infrastructure',
        entityId: 'infra_drain_manhole_e01'
      },
      complaintsCount: 7,
      complaintIds: ['issue_a12_water_leak'],
      state: {
        status: 'open',
        severity: 'critical',
        assignedTeam: 'Đội Kỹ thuật Môi trường BQL',
        assignedPerson: 'KTV. Nguyễn Văn Đức',
        assignedPhone: '0912 889 900',
        actionRequired: 'Khơi thông hố ga ngầm và điều tiết lưu lượng thoát sàn dãy thủy sản',
        reportedAt: '2026-08-31T07:30:00Z',
        lastUpdated: '2026-08-31T10:15:00Z'
      }
    },
    {
      id: 'incident_trash_b_accumulated',
      code: 'INC-2026-0831-02',
      floorId: 'floor_1',
      title: 'Rác hữu cơ tồn đọng ca sáng tại Trục giữa Khu B',
      category: 'hygiene',
      geometry: {
        type: 'point',
        coordinates: [610, 580],
        elevationZ: 0
      },
      targetEntityRef: {
        entityType: 'zone',
        entityId: 'zone_B'
      },
      complaintsCount: 1,
      complaintIds: [],
      state: {
        status: 'dispatched',
        severity: 'medium',
        assignedTeam: 'Tổ vệ sinh ca 1',
        assignedPerson: 'Tổ trưởng Trần Thị Hà',
        assignedPhone: '0988 223 344',
        actionRequired: 'Điều xe gom rác ép chuyên dụng dọn sạch trước 11:30',
        reportedAt: '2026-08-31T08:45:00Z',
        lastUpdated: '2026-08-31T09:30:00Z'
      }
    }
  ]
};

export const SAMPLE_MARKET_DATA: MarketEntity = {
  schemaVersion: '3.2.0',
  id: 'market_dong_xuan',
  name: 'Chợ Đồng Xuân',
  code: 'DX-HN',
  address: 'Phường Đồng Xuân, Quận Hoàn Kiếm, TP. Hà Nội',
  timezone: 'Asia/Ho_Chi_Minh',
  metadata: {
    totalFloors: 3,
    totalActiveStalls: 187,
    buildingFootprintM2: 6500,
    managementAuthority: 'Ban Quản Lý Chợ Đồng Xuân — Công ty Cổ phần Đồng Xuân'
  },
  floors: [SAMPLE_FLOOR_1_DATA]
};
