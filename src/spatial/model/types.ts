/**
 * CANONICAL SPATIAL DATA MODEL — SMART MARKET
 * Schema Version: 3.2.0 (Phase 3A.2 Contract Hardening)
 * 
 * Mục tiêu: Tách rời 100% dữ liệu không gian, siêu dữ liệu nghiệp vụ và trạng thái vận hành
 * khỏi UI/DOM layout để hỗ trợ đồng thời nhiều renderer: 2D (SVG/Canvas), 2.5D (Isometric), và 3D (Three.js WebGL).
 */

// ============================================================================
// 1. COORDINATE CONVENTION & SPATIAL GEOMETRY PRIMITIVES
// ============================================================================

export type Coordinate2D = [number, number]; // [x, y] trong local coordinate system
export type Coordinate3D = [number, number, number]; // [x, y, z] trong local coordinate system

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface RotationConfig {
  angleDegrees: number; // Góc xoay 0 - 360 độ
  direction: 'clockwise_from_north' | 'counter_clockwise_from_positive_x'; // Chuẩn hướng xoay
  pivot: 'center' | 'top_left' | Coordinate2D; // Tâm xoay
}

export interface LocalCoordinateSystem {
  width: number;                  // Chiều rộng không gian chuẩn (ví dụ: 1000 units)
  height: number;                 // Chiều dài không gian chuẩn (ví dụ: 700 units)
  origin: 'top_left' | 'bottom_left'; // Gốc tọa độ [0,0] (Mặc định: top_left = Tây Bắc)
  xAxisDirection: 'east';         // Trục X+ tăng dần từ Tây sang Đông
  yAxisDirection: 'south';        // Trục Y+ tăng dần từ Bắc xuống Nam
  zAxisDirection: 'up';           // Trục Z+ hướng lên trần nhà (độ cao)
  unit: 'metric_cm' | 'metric_m' | 'canonical_units';
  scaleFactorToMeters: number;    // Hệ số quy đổi sang mét thực tế (ví dụ: 0.1 nghĩa là 1 unit = 10cm)
  rotationConvention: {
    unit: 'degrees';
    defaultDirection: 'clockwise_from_north';
    zeroDegreeAxis: 'north';      // 0 độ = Hướng Bắc
  };
}

export interface PointGeometry {
  type: 'point';
  coordinates: Coordinate2D;
  elevationZ?: number;            // Độ cao so với mặt sàn (m, mặc định 0)
}

export interface RectangleGeometry {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;              // Góc xoay theo độ (mặc định clockwise from North)
  rotationConfig?: RotationConfig;
  elevationZ?: number;            // Độ cao mặt sàn (m, mặc định 0)
  height3D?: number;              // Chiều cao đùn khối 3D (m, ví dụ 2.4m)
}

export interface PolygonGeometry {
  type: 'polygon';
  vertices: Coordinate2D[];       // Danh sách đỉnh [x, y] theo thứ tự khép kín (tối thiểu 3 đỉnh)
  holes?: Coordinate2D[][];       // Đa giác rỗng bên trong (giếng trời/cột chịu lực)
  rotation?: number;
  elevationZ?: number;
  height3D?: number;
}

export interface PathGeometry {
  type: 'path';
  points: Coordinate2D[];         // Danh sách điểm tạo thành polyline
  width: number;                  // Chiều rộng đường dẫn trong local units
  widthMeters?: number;           // Chiều rộng quy đổi theo mét thực tế
  isClosed?: boolean;             // Khép kín thành vòng xuyến/chu trình
  elevationZ?: number;            // Độ cao đặt ống/đường (âm nếu cống ngầm)
  cap?: 'butt' | 'round' | 'square';
  join?: 'miter' | 'round' | 'bevel';
}

export type SpatialGeometry = 
  | PointGeometry 
  | RectangleGeometry 
  | PolygonGeometry 
  | PathGeometry;

// ============================================================================
// 2. EXTENSIBLE OPERATIONAL ISSUE / STATUS ENGINE (GENERIC DOMAIN MODEL)
// ============================================================================

export type OperationalIssueType =
  | 'complaint'           // Phản ánh của khách hàng / tiểu thương
  | 'contract_expiry'     // Hợp đồng thuê sạp sắp hoặc đã hết hạn
  | 'fee_overdue'         // Nợ phí dịch vụ, tiền điện, tiền nước quá hạn
  | 'maintenance'         // Đang thi công sửa chữa, bảo trì kỹ thuật
  | 'food_safety'         // Vi phạm vệ sinh an toàn thực phẩm, hết hạn ATTP
  | 'fire_safety'         // Vi phạm PCCC, cản trở lối thoát hiểm
  | 'electricity'         // Quá tải điện, sự cố chập aptomat
  | 'water'               // Tràn nước, rò rỉ đường ống, cống tắc
  | 'security'            // Mất trật tự, lấn chiếm lối đi, trộm cắp
  | 'hygiene'             // Tồn đọng rác thải, mùi hôi môi trường
  | (string & {});        // Cho phép mở rộng thêm bất kỳ issue type tùy biến nào trong tương lai

export type OperationalSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type OperationalStatus = 
  | 'open'                // Mới ghi nhận
  | 'investigating'       // Đang kiểm tra hiện trường
  | 'dispatched'          // Đã điều phối nhân sự xử lý
  | 'in_progress'         // Đang khắc phục
  | 'pending_verification'// Chờ nghiệm thu
  | 'resolved'            // Đã giải quyết xong
  | 'closed';             // Đã đóng biên bản

export interface OperationalIssue {
  id: string;                     // Mã định danh duy nhất của issue
  type: OperationalIssueType;     // Loại sự cố / trạng thái
  code?: string;                  // Mã nghiệp vụ (ví dụ: 'INC-2026-0831-01')
  title: string;                  // Tiêu đề ngắn gọn
  description?: string;           // Mô tả chi tiết
  severity: OperationalSeverity;  // Mức độ ưu tiên
  status: OperationalStatus;      // Trạng thái vòng đời xử lý
  
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
  dueAt?: string;                 // Thời hạn chót cần hoàn tất
  resolvedAt?: string;

  reportedBy?: {
    role: 'merchant' | 'customer' | 'inspector' | 'bql_staff' | 'sensor_system';
    name: string;
    contact?: string;
  };

  assignedTo?: {
    teamId?: string;
    teamName: string;
    personName?: string;
    phone?: string;
  };

  entityRef: {
    entityType: 'stall' | 'zone' | 'floor' | 'aisle' | 'gate' | 'facility' | 'infrastructure';
    entityId: string;             // ID của thực thể bị ảnh hưởng
    subComponent?: string;        // Vị trí chi tiết (ví dụ: 'bể sục cá', 'cửa sạp')
  };

  // Payload mở rộng không giới hạn cho từng loại issue
  payload?: {
    // Dữ liệu cho contract_expiry
    contractDaysLeft?: number;
    expiryDate?: string;
    renewalStatus?: string;
    // Dữ liệu cho fee_overdue
    overdueAmount?: string;
    overdueDays?: number;
    feeTypes?: string[];
    // Dữ liệu cho maintenance
    maintenanceReason?: string;
    contractor?: string;
    // Dữ liệu cho sensor/technical
    sensorReadings?: Record<string, number | string>;
    [key: string]: unknown;
  };
}

export interface StallOperationalState {
  // Trạng thái thuê mặt bằng
  isOccupied: boolean;
  occupancyStatus: 'active' | 'empty' | 'reserved' | 'pending_transfer';
  
  // Danh sách các Operational Issues đa trạng thái độc lập
  issues: OperationalIssue[];

  // Convenience Fields phục vụ render nhanh cho Application Layer
  hasActiveIssues: boolean;
  highestSeverity?: OperationalSeverity;
  isUnderMaintenance: boolean;
  complaintsCount: number;
  hasCriticalComplaint: boolean;
  contractDaysLeft: number;
  isExpiringSoon: boolean;        // <= 30 ngày
  isCriticalExpiry: boolean;      // <= 7 ngày
  feeStatus: 'paid' | 'pending' | 'overdue';
  overdueAmount?: string;
  tags: string[];
}

export interface IncidentOperationalState {
  status: OperationalStatus;
  severity: OperationalSeverity;
  assignedTeam?: string;
  assignedPerson?: string;
  assignedPhone?: string;
  actionRequired: string;
  reportedAt: string;
  lastUpdated: string;
}

// ============================================================================
// 3. CORE SPATIAL ENTITIES (ĐỘC LẬP RENDERER, CÓ REFERENCE INTEGRITY)
// ============================================================================

export interface StallEntity {
  id: string;                     // 'stall_A12'
  code: string;                   // 'A12'
  zoneId: string;                 // FK -> ZoneEntity.id
  floorId: string;                // FK -> FloorEntity.id
  
  // 1. LỚP HÌNH HỌC KHÔNG GIAN
  geometry: RectangleGeometry | PolygonGeometry;
  boundingBox: BoundingBox;
  rotation?: number;

  // 2. LỚP SIÊU DỮ LIỆU NGHIỆP VỤ (METADATA)
  metadata: {
    name: string;
    merchantName: string;
    phone: string;
    category: string;
    areaM2: number;
    monthlyEstimatedRevenue: string;
    rating: number;
    ratingCount: number;
    foodSafetyCert?: string;
    fireSafetyCert?: string;
    notes?: string;
    qrPaymentActive: boolean;
    licenseNumber?: string;
  };

  // 3. LỚP TRẠNG THÁI VẬN HÀNH THỜI GIAN THỰC
  state: StallOperationalState;
}

export interface ZoneEntity {
  id: string;                     // 'zone_A'
  code: string;                   // 'A'
  floorId: string;                // FK -> FloorEntity.id
  name: string;
  subTitle: string;
  category: string;
  
  geometry: RectangleGeometry | PolygonGeometry;
  boundingBox: BoundingBox;

  visualTheme: {
    colorToken: string;           // '#076C31' | '#1e293b' | '#475569'
    cadHatchPattern?: string;
  };

  totalStallsCount: number;
  stallIds: string[];             // Danh sách FK -> StallEntity.id
}

export interface AisleEntity {
  id: string;                     // 'aisle_main_north_south'
  code: string;                   // 'AISLE-MAIN-NS'
  floorId: string;                // FK -> FloorEntity.id
  name: string;
  type: 'main_corridor' | 'sub_aisle' | 'logistics_path' | 'fire_exit_route';
  
  geometry: PathGeometry | PolygonGeometry;
  widthMeters: number;
  flowDirection?: 'two_way' | 'north_to_south' | 'south_to_north';
  isClearOfObstacles: boolean;
  activeObstructionIssueIds?: string[];
}

export interface GateEntity {
  id: string;                     // 'gate_north'
  code: string;                   // 'GATE-N01'
  floorId: string;                // FK -> FloorEntity.id
  name: string;
  type: 'main_entry' | 'logistics_entry' | 'emergency_exit' | 'side_entry';
  
  geometry: PointGeometry | RectangleGeometry;
  orientationDegrees: number;     // 0 = Bắc, 90 = Đông, 180 = Nam, 270 = Tây
  connectedStreet: string;
  widthMeters: number;
  isOpen: boolean;
}

export interface FacilityEntity {
  id: string;                     // 'facility_wc_t1'
  code: string;                   // 'WC-T1'
  floorId: string;                // FK -> FloorEntity.id
  name: string;
  type: 'restroom' | 'bql_office' | 'atm' | 'parking' | 'first_aid_station' | 'waste_depot';
  
  geometry: RectangleGeometry | PolygonGeometry | PointGeometry;
  boundingBox: BoundingBox;

  metadata: {
    managedBy: string;
    capacity?: number;
    openHours: string;
  };

  state: {
    isOperational: boolean;
    cleanlinessStatus?: 'clean' | 'needs_cleaning' | 'maintenance';
    lastInspectedAt?: string;
  };
}

export interface InfrastructureEntity {
  id: string;                     // 'infra_drain_east_pipe'
  code: string;                   // 'DRAIN-E-PIPE'
  floorId: string;                // FK -> FloorEntity.id
  name: string;
  type: 'drainage_pipe' | 'drainage_manhole' | 'fire_hydrant' | 'fire_extinguisher' | 'power_substation' | 'cctv_camera';
  
  geometry: PathGeometry | PointGeometry | RectangleGeometry;
  connectedStallIds?: string[];   // FK -> StallEntity.id[]

  metadata: {
    capacitySpec?: string;
    installationDate?: string;
    responsibleTechnician: string;
    phone: string;
  };

  state: {
    status: 'normal' | 'clogged' | 'leak' | 'inspection_required';
    sensorReading?: {
      waterFlowRate?: number;
      fillPercentage?: number;
    };
  };
}

export interface IncidentEntity {
  id: string;                     // 'incident_east_drain_clog'
  code: string;                   // 'INC-2026-0831-01'
  floorId: string;                // FK -> FloorEntity.id
  title: string;
  category: OperationalIssueType;
  
  geometry: PointGeometry | PolygonGeometry;
  
  targetEntityRef?: {
    entityType: 'stall' | 'zone' | 'infrastructure' | 'aisle' | 'facility';
    entityId: string;             // FK tới ID thực thể bị tác động
  };

  state: IncidentOperationalState;
  
  complaintsCount: number;
  complaintIds: string[];
}

export interface FloorEntity {
  schemaVersion: string;          // '3.2.0'
  id: string;                     // 'floor_1'
  marketId: string;               // FK -> MarketEntity.id
  floorNumber: number;            // 1
  name: string;
  subTitle: string;
  elevationMeters: number;        // Độ cao so với mặt đất (ví dụ: 0m cho T1, 4.2m cho T2)
  ceilingHeightMeters: number;    // Chiều cao thông thủy trần (ví dụ: 3.8m)
  
  coordinateSystem: LocalCoordinateSystem;
  boundary: PolygonGeometry;

  // Quan hệ không gian phân cấp
  zones: ZoneEntity[];
  stalls: StallEntity[];
  aisles: AisleEntity[];
  gates: GateEntity[];
  facilities: FacilityEntity[];
  infrastructures: InfrastructureEntity[];
  incidents: IncidentEntity[];
}

export interface MarketEntity {
  schemaVersion: string;          // '3.2.0'
  id: string;                     // 'market_dong_xuan'
  name: string;
  code: string;
  address: string;
  timezone: string;
  
  metadata: {
    totalFloors: number;
    totalActiveStalls: number;
    buildingFootprintM2: number;
    managementAuthority: string;
  };

  floors: FloorEntity[];
}

/**
 * MAP LEVEL OF DETAIL (LOD) STATE ENUM
 * Gồm 3 cấp máy trạng thái:
 * - OVERVIEW: Toàn cảnh chợ (Mã sạp + trạng thái + số vấn đề + badge gộp khu)
 * - ZONE_FOCUS: Phóng vào phân khu (Mã + ngành hàng ngắn + status + badge sự cố chi tiết)
 * - STALL_SELECTED: Toàn bộ thông tin trong panel + sạp nổi bật focus ring
 */
export type MapLodState = 'OVERVIEW' | 'ZONE_FOCUS' | 'STALL_SELECTED';

