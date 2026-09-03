# CANONICAL SPATIAL ARCHITECTURE SPECIFICATION
## Smart Market Enterprise Spatial Operations Core
**Schema Version: 3.2.0 (Phase 3A.2 Contract Hardening)**

---

## 1. Audit Implementation Hiện Tại của Market Map (Coupling Analysis)

1. **DOM CSS Grid Dependency**:
   - Hiện tại, vị trí sạp trên mặt bằng phụ thuộc vào CSS Grid (`grid-cols-12`, `grid-cols-2`) và thứ tự mảng JavaScript.
   - Sạp không có tọa độ hình học `(x, y, width, height, polygon, rotation)`.
2. **Coupling giữa Business Data và UI Status**:
   - Object `stall` trong `mockMarketData.js` đang gộp chung dữ liệu nghiệp vụ và trạng thái UI đơn nhất (`status: 'normal' | 'complaint' ...`).
   - Khi sạp có **nhiều trạng thái đồng thời**, string đơn buộc logic phải hy sinh thông tin để chọn 1 màu hiển thị.
3. **Hard-coded Architectural Elements trong JSX**:
   - Các thực thể cốt lõi: **Lối đi (Aisle)**, **Cổng ra vào (Gate)**, **Tiện ích công cộng (Facility/WC/P.102)** và **Hạ tầng ngầm (Drainage/PCCC)** bị hard-code trong JSX tĩnh.

---

## 2. Chuẩn Hóa Hệ Tọa Độ & Quy Ước Không Gian (Coordinate & Rotation Conventions)

Để đảm bảo **không có bất kỳ renderer nào phải tự suy luận convention**, hệ thống định nghĩa rõ ràng:

```
(0, 0) Gốc Tây Bắc (Top-Left) ──────────────────────────► Trục X+ (Hướng Đông / East)
 │
 │  ┌─────────────────────────────────────────────────────────────┐
 │  │                                                             │
 │  │      0° (Bắc / North)                                       │
 │  │         ▲                                                   │
 │  │         │                                                   │
 │  │  270° ◄─┼─► 90° (Đông / East)   [Xoay theo chiều kim đồng hồ] │
 │  │  (Tây)  │                                                   │
 │  │         ▼                                                   │
 │  │      180° (Nam / South)                                     │
 │  │                                                             │
 │  └─────────────────────────────────────────────────────────────┘
 ▼
Trục Y+ (Hướng Nam / South)
```

### 2.1. Quy ước Tọa độ Cốt lõi (Local Coordinate System)
- `origin`: `'top_left'` (Gốc `[0, 0]` tại góc Tây Bắc).
- `xAxisDirection`: `'east'` (Tọa độ X tăng dần khi đi từ Tây sang Đông: `0 -> width`).
- `yAxisDirection`: `'south'` (Tọa độ Y tăng dần khi đi từ Bắc xuống Nam: `0 -> height`).
- `zAxisDirection`: `'up'` (Trục Z+ hướng vuông góc lên trên mặt sàn để biểu diễn chiều cao/độ sâu).
- `logicalCoordinateUnits`: `metric_cm` (hoặc `canonical_units`).
- `scaleFactorToMeters`: `0.1` (1 unit = 0.1 mét = 10cm; ví dụ `width: 1000, height: 700` đại diện cho mặt bằng sàn 100m x 70m).
- `rotationConvention`:
  - Đơn vị: `degrees` (0° đến 360°).
  - Hướng xoay chuẩn: `clockwise_from_north` (0° = Bắc, 90° = Đông, 180° = Nam, 270° = Tây).
  - Tâm xoay mặc định: `'center'` của bounding box thực thể.

---

## 3. Kiến Trúc 3 Lớp Tách Rời (3-Layer Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CANONICAL SPATIAL MODEL                           │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│    1. GEOMETRY LAYER    │    2. METADATA LAYER    │   3. OPERATIONAL STATE  │
│  (Không gian & Tọa độ)  │  (Nghiệp vụ & Pháp lý)  │  (Generic Issue Engine) │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • Point [x, y, elevation│ • Stall Code / Name     │ • isOccupied / Status   │
│ • Rectangle (x,y,w,h,rot│ • Merchant / Phone      │ • issues: Operational-  │
│ • Polygon (Vertices[])  │ • Category / Industry   │   Issue[] (Extensible)  │
│ • Path (Points[], width,│ • Area (m² thực tế)     │ • hasActiveIssues       │
│   widthMeters, elevation│ • Licenses / ATTP / PCCC│ • highestSeverity       │
│ • Bounding Box          │ • Revenue & Ratings     │ • Convenience getters:  │
│ • 3D: elevationZ, height│ • QR Payment Status     │   complaintsCount,      │
│   3D, thickness         │ • License Number        │   contractDaysLeft, ... │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 4. Động Cơ Quản Lý Trạng Thái Vận Hành Mở Rộng (Generic Operational Issue Engine)

Không giới hạn `StallState` ở các trường cố định, hệ thống chuẩn hóa mô hình **Operational Issue** hỗ trợ mọi nghiệp vụ quản lý chợ:

```ts
export interface OperationalIssue {
  id: string;                     // Mã định danh duy nhất của issue
  type: OperationalIssueType;     // 'complaint' | 'contract_expiry' | 'fee_overdue' | 'maintenance' | 'food_safety' | 'fire_safety' | 'electricity' | 'water' | 'security' | 'hygiene' | string
  code?: string;                  // 'CP-A12-01' | 'HD-2024-A12'
  title: string;                  // Tiêu đề ngắn gọn
  description?: string;           // Chi tiết sự cố
  severity: OperationalSeverity;  // 'critical' | 'high' | 'medium' | 'low' | 'info'
  status: OperationalStatus;      // 'open' | 'investigating' | 'dispatched' | 'in_progress' | 'pending_verification' | 'resolved' | 'closed'
  createdAt: string;              // ISO 8601
  updatedAt: string;
  dueAt?: string;
  reportedBy?: { role: string; name: string; contact?: string };
  assignedTo?: { teamName: string; personName?: string; phone?: string };
  entityRef: { entityType: string; entityId: string; subComponent?: string };
  payload?: Record<string, unknown>; // Extensible metadata (số tiền nợ, hạn HĐ, đọc cảm biến...)
}
```

---

## 5. Ràng Buộc Toàn Vẹn Tham Chiếu (Entity Reference Integrity)

Mọi liên kết giữa các thực thể đều được kiểm tra chặt chẽ bởi Validator Engine:
- **`Stall.zoneId`** $\rightarrow$ bắt buộc phải trỏ đến một `Zone.id` hợp lệ trên sàn.
- **`Stall.floorId`** $\rightarrow$ bắt buộc khớp với `Floor.id`.
- **`Infrastructure.connectedStallIds`** $\rightarrow$ mảng các `Stall.id` thực tế được đấu nối cống/điện.
- **`Incident.targetEntityRef`** $\rightarrow$ trỏ chính xác tới ID của thực thể bị ảnh hưởng (`Stall`, `Zone`, `Infrastructure`, `Aisle`, `Facility`).
- **`Floor.marketId`** $\rightarrow$ trỏ tới `Market.id`.

---

## 6. Động Cơ Kiểm Tra Toàn Vẹn (Lightweight Validation Engine)

Hệ thống cung cấp module [`src/spatial/validator.ts`](file:///c:/Users/game/Documents/app/Chợ%20thông%20minh%20uiux/src/spatial/validator.ts) độc lập, không phụ thuộc thư viện ngoài:
- **`validateGeometry()`**: Kiểm tra polygon $\ge 3$ đỉnh, rectangle $w, h > 0$, path $\ge 2$ điểm & $width > 0$, cảnh báo tọa độ vượt biên `coordinateSystem`.
- **`validateFloorDataset()`**: Phát hiện ID trùng lặp (Duplicate Entity ID), bắt lỗi tham chiếu ma (Dangling Reference), xác thực danh sách `OperationalIssue`.
- **`validateMarketDataset()`**: Tổng hợp báo cáo kiểm tra trên toàn bộ tòa nhà / khu chợ.

---

## 7. Quy Tắc Phiên Bản Hóa Schema & Tương Thích Ngược (Versioning & Compatibility)

1. **Semantic Versioning (`schemaVersion: '3.2.0'`)**:
   - `MAJOR` (3.x): Thay đổi cấu trúc cốt lõi của `coordinateSystem` hoặc kiểu `SpatialGeometry`.
   - `MINOR` (x.2): Bổ sung thực thể mới, thêm thuộc tính optional (ví dụ: `rotationConfig`, `widthMeters`, `elevationMeters`).
   - `PATCH` (x.x.0): Vá lỗi validator, tối ưu hóa kiểu dữ liệu.
2. **Nguyên tắc Tương thích Renderer**:
   - Mọi thuộc tính 2.5D/3D (`height3D`, `elevationZ`, `rotation`) đều là **optional đối với 2D Renderer**.
   - 2D Renderer chỉ đọc `(x, y, width, height, vertices, points)` mà bỏ qua `height3D` mà không sinh lỗi.
   - 3D Renderer đọc thêm `height3D` và `elevationZ` để dựng khối mesh tự động.

---

## 8. Changelog từ Phase 3A.1 $\rightarrow$ Phase 3A.2

| Hạng mục | Phase 3A.1 | Phase 3A.2 (Contract Hardened) |
| :--- | :--- | :--- |
| **Schema Version** | Chưa có | `3.2.0` chuẩn hóa ở root `MarketEntity` và `FloorEntity` |
| **Hệ Tọa Độ** | `width`, `height`, `unit` cơ bản | Bổ sung tường minh: `origin`, `xAxisDirection`, `yAxisDirection`, `zAxisDirection`, `rotationConvention` |
| **Góc Xoay (Rotation)** | Chưa chuẩn hóa | Hỗ trợ `rotation` & `rotationConfig` (`angleDegrees`, `direction`, `pivot`) |
| **Độ Cao & Kích Thước 3D**| Sơ khai | Bổ sung `elevationMeters`, `ceilingHeightMeters`, `elevationZ`, `height3D` |
| **Đường Dẫn Không Gian (Path)**| `points[]`, `width` cơ bản | Bổ sung `widthMeters`, `elevationZ`, `cap`, `join` cho cống ngầm & lối đi |
| **Trạng Thái Vận Hành (State)**| Các boolean & fixed fields | **Generic Operational Issue Engine** (`OperationalIssue[]`, payload mở rộng không giới hạn) |
| **Tham Chiếu Toàn Vẹn** | Khóa ngoại đơn | Kiểm tra 100% quan hệ Stall-Zone, Infrastructure-Stall, Incident-Target |
| **Validation Engine** | Chưa có | Bộ `validator.ts` + `validator.test.ts` kiểm thử 5 ca sanity check |
