# SƠ ĐỒ HỆ THỐNG & LUỒNG NGHIỆP VỤ HỆ SINH THÁI CHỢ THÔNG MINH (SMART MARKET ECOSYSTEM)

> **Tài liệu bàn giao kiến trúc kỹ thuật (`System Architecture & Business Workflows Specification`)**  
> **Phiên bản:** v3.2.0 Enterprise  
> **Chủ quản:** Ban Quản Lý Chợ Thông Minh & Đội ngũ Kỹ thuật  
> **Cập nhật:** Tháng 09/2026  

---

## 1. TỔNG QUAN KIẾN TRÚC 3 PHÂN HỆ (`TRI-TIER ARCHITECTURE`)

Hệ sinh thái **Chợ Thông Minh (Smart Market)** được tổ chức theo mô hình phân tầng dịch vụ độc lập (`Decoupled Microservices / Multi-Repos`), kết nối 3 chủ thể trung tâm: **Ban Quản Lý Chợ**, **Hộ Tiểu Thương** và **Người Dân / Khách Hàng**.

```mermaid
graph TD
    subgraph BQL["1. TRUNG TÂM ĐIỀU HÀNH BQL (MANAGEMENT)"]
        CMS["Web CMS Ban Quản Lý Chợ<br/><b>Next-Gen CMS v3.2.0</b><br/>• Next.js 16 (App Router + Turbopack)<br/>• Sơ đồ mặt bằng tương tác GIS/SVG<br/>• Điều phối thực địa & Phản ánh PAKN<br/>• Phát thông báo & Loa PA Simulator<br/><i>Port: 3001 | GitHub: smartmarket</i>"]
    end

    subgraph CORE["2. NỀN TẢNG DỮ LIỆU & DỊCH VỤ LÕI (CORE API)"]
        API["Core Backend API Server<br/><b>Smart Market API Engine</b><br/>• Node.js & Express.js<br/>• Prisma ORM (Database Layer)<br/>• Swagger OpenAPI 3.0.3<br/>• Quản lý Auth, Sạp, Hợp đồng, Đơn hàng<br/><i>Port: 3000 | Live: api.chothongminh.top<br/>GitHub: smartmarket-backend</i>"]
        DB[("PostgreSQL / SQLite Database<br/>• Stalls, Zones, Markets<br/>• Traders, Contracts, Fees<br/>• Complaints, Orders, Notifications")]
    end

    subgraph CLIENT["3. ỨNG DỤNG NGƯỜI DÂN & TIỂU THƯƠNG (END USERS)"]
        ZALO["Zalo Mini App Chợ Thông Minh<br/><b>Smart Market Citizen & Merchant App</b><br/>• Vite + React + Tailwind CSS<br/>• Zalo SDK (Zalo OA Authentication)<br/>• Quét mã VietQR động, Đặt hàng<br/>• Nộp hồ sơ thuê sạp & Gửi phản ánh<br/><i>Port: 5173 | GitHub: smartmarket-zalo-miniapp</i>"]
    end

    CMS <-->|"REST API / Bearer Token JWT"| API
    ZALO <-->|"Zalo Access Token / REST API"| API
    API <-->|"Prisma Client Queries"| DB

    style BQL fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    style CORE fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    style CLIENT fill:#fff3e0,stroke:#e65100,stroke-width:2px;
```

---

## 2. BẢNG TRA CỨU DỊCH VỤ & KHO LƯU TRỮ (`REPOSITORY MATRIX`)

| STT | Phân hệ (`Service`) | Công nghệ (`Stack`) | Thư mục cục bộ (`Local Directory`) | Cổng (`Port`) | Kho GitHub (`Remote Repository`) |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **1** | **Web CMS Ban Quản Lý** | Next.js 16, React 19, Tailwind CSS, Turbopack | `c:\Users\game\Documents\app\Smartmarket` | `3001` | [`hoadulieu2003-lang/smartmarket`](https://github.com/hoadulieu2003-lang/smartmarket) |
| **2** | **Core Backend API** | Node.js, Express, Prisma ORM, Swagger OpenAPI | `c:\Users\game\Documents\app\Smartmarket - Nguyen\backend-main\backend-main` | `3000` | [`hoadulieu2003-lang/smartmarket-backend`](https://github.com/hoadulieu2003-lang/smartmarket-backend) |
| **3** | **Zalo Mini App** | Vite, React, Tailwind CSS, Zalo SDK | `c:\Users\game\Documents\app\Smartmarket - Nguyen\app-zalo-main (1)\app-zalo-main` | `5173` | [`hoadulieu2003-lang/smartmarket-zalo-miniapp`](https://github.com/hoadulieu2003-lang/smartmarket-zalo-miniapp) |

> [!NOTE]
> Khi cần khởi chạy từng dịch vụ riêng biệt phục vụ môi trường kiểm thử cục bộ (`Local Development`):
> * **Khởi động Web CMS:** Mở terminal tại thư mục `Smartmarket` ➔ chạy `npm run dev -- -p 3001`
> * **Khởi động Core Backend:** Mở terminal tại thư mục `backend-main` ➔ chạy `node mock_api_server.js` (hoặc `npm run dev`)
> * **Khởi động Zalo App:** Mở terminal tại thư mục `app-zalo-main` ➔ chạy `npm run dev -- --port 5173`

---

## 3. SƠ ĐỒ CÁC LUỒNG NGHIỆP VỤ TRỌNG TÂM (`CORE BUSINESS WORKFLOWS`)

### 3.1. Luồng Tiếp Nhận & Xử Lý Phản Ánh Hiện Trường (`Complaints & PAKN Workflow`)

Quy trình giải quyết sự cố, vệ sinh an toàn thực phẩm, gian lận đo lường hoặc an ninh trật tự:

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Người dân / Khách mua
    participant Zalo as Zalo Mini App
    participant Backend as Core Backend API
    participant CMS as Web CMS Ban Quản Lý
    actor Manager as Cán bộ BQL / Đội Kiểm tra

    Citizen->>Zalo: Quét mã QR sạp hàng / Chọn chức năng gửi PAKN
    Zalo->>Backend: POST /api/v1/complaints (Nội dung, Ảnh bằng chứng, Mã sạp)
    Backend-->>CMS: WebSocket / Polling đồng bộ sự cố mới (SLA: P0=15p, P1=60p)
    CMS->>CMS: Sạp chuyển trạng thái 'has_complaint', hiện badge đỏ khẩn cấp
    Manager->>CMS: Xem chi tiết phản ánh & bấm 'Điều phối thực địa'
    Manager->>Citizen: Cán bộ kiểm tra lập biên bản xử lý tại sạp
    Manager->>CMS: Bấm 'Giải quyết phản ánh' (Nhập ghi chú xử lý & ảnh hiện trường)
    CMS->>Backend: POST /api/v1/admin/complaints/{id}/resolve
    Backend-->>Zalo: Thông báo Zalo: 'Phản ánh của bạn đã được BQL xử lý dứt điểm'
    CMS->>CMS: Tự động cập nhật sạp về 'occupied', xóa cảnh báo sự cố
```

---

### 3.2. Luồng Nộp Hồ Sơ & Phê Duyệt Sạp Tiểu Thương (`Merchant Onboarding Dossier`)

Quy trình số hóa thủ tục đăng ký thuê mặt bằng kinh doanh tại chợ:

```mermaid
sequenceDiagram
    autonumber
    actor Trader as Tiểu thương mới
    participant Zalo as Zalo Mini App
    participant Backend as Core Backend API
    participant CMS as Web CMS Ban Quản Lý
    actor Admin as Ban Quản Lý Chợ

    Trader->>Zalo: Điền form đăng ký kinh doanh (Họ tên, CCCD, Ngành hàng)
    Zalo->>Backend: POST /api/v1/merchant-applications (Lưu trạng thái 'pending')
    Backend-->>CMS: Cập nhật biến đếm hồ sơ chờ duyệt (Badge Menu)
    Admin->>CMS: Truy cập phân hệ 'Duyệt hồ sơ tiểu thương'
    Admin->>CMS: Thẩm định thông tin, tra cứu mặt bằng trống trên Sơ đồ chợ
    alt Hồ sơ đạt tiêu chuẩn
        Admin->>CMS: Chọn sạp trống (VD: A-08) & bấm 'Phê duyệt hồ sơ'
        CMS->>Backend: POST /api/v1/admin/merchant-approvals/{id}/approve (stallId)
        Backend-->>Zalo: Cấp quyền Merchant: Kích hoạt trang quản lý sạp
        CMS->>CMS: Sạp A-08 chuyển trạng thái 'occupied', tạo hợp đồng mới 180 ngày
    else Hồ sơ thiếu giấy tờ
        Admin->>CMS: Bấm 'Yêu cầu bổ sung' (Ghi chú chi tiết giấy phép cần thêm)
        CMS->>Backend: POST /api/v1/admin/merchant-approvals/{id}/request-info
        Backend-->>Zalo: Thông báo yêu cầu tiểu thương chụp lại ảnh giấy tờ
    end
```

---

### 3.3. Luồng Phát Thông Báo Toàn Chợ & Loa Phát Thanh (`Market Broadcast & PA Simulator`)

Quy trình truyền thông đa kênh bảo đảm thông suốt thông tin PCCC, đôn đốc thu phí và an ninh trật tự:

```mermaid
sequenceDiagram
    autonumber
    actor BQL as Cán bộ Trực ban BQL
    participant CMS as Web CMS Điều Hành
    participant PA as Web Audio & Speech Engine
    participant Backend as Core Backend API
    participant Merchants as Tiểu thương & Khách hàng

    BQL->>CMS: Mở modal 'Phát Thông Báo Toàn Chợ'
    BQL->>CMS: Chọn Mẫu nhanh 1-click (PCCC / Thu phí / ATTP / Trật tự)
    BQL->>CMS: Chọn Chợ mục tiêu, Phân khu (Toàn chợ hoặc Khu A/B/C/D/E)
    BQL->>CMS: Chọn Kênh phát (Loa phát thanh, SMS/Zalo, Bảng tin điện tử)
    BQL->>CMS: Bấm 'Phát thông báo ngay'
    CMS->>Backend: POST /api/v1/admin/notifications (type, priority, targetType, targetId)
    Backend-->>Merchants: Đẩy tin nhắn Notification tới Zalo Mini App của tiểu thương
    opt Kênh phát có Loa phát thanh ('loudspeaker' hoặc 'all')
        CMS->>PA: Web Audio API phát chuông Ding-Dong PA công cộng (587Hz + 880Hz)
        CMS->>PA: Web Speech Synthesis đọc phát thanh giọng tiếng Việt
        CMS->>CMS: Kích hoạt Banner On-Air: [🔴 ON AIR · ĐANG PHÁT THANH TRÊN LOA]
    end
    CMS->>CMS: Đánh dấu 'isRead: false', tăng badge chưa đọc trên Header & Sidebar
```

---

### 3.4. Luồng Quản Lý Sơ Đồ Mặt Bằng Không Gian GIS (`Interactive Spatial Floor Plan`)

Quy trình phản xạ dữ liệu 2 chiều giữa sơ đồ bản đồ và số liệu tài chính công nợ:

```mermaid
graph LR
    subgraph DATA["DỮ LIỆU THỜI GIAN THỰC"]
        STALL["Trạng thái sạp<br/>(occupied, vacant, expiring, complaint)"]
        DEBT["Công nợ & Phí tháng<br/>(Đã nộp, Nợ quá hạn, VietQR)"]
        INCIDENT["Sự cố PAKN<br/>(Khẩn cấp P0, Xử lý P1, P2)"]
    end

    subgraph ENGINE["ĐỘNG CƠ BIỂU DIỄN KHÔNG GIAN"]
        ADAPTER["Spatial Backend Adapter v3.2.0<br/>(adaptBackendToCanonicalDocument)"]
        CANONICAL["MarketEntity Canonical Model"]
    end

    subgraph VISUAL["GIAO DIỆN TƯƠNG TÁC NGƯỜI DÙNG"]
        SVG["Sơ đồ hình học SVG / GIS Map<br/>• Hiệu ứng viền màu ngữ nghĩa<br/>• Capacity Pulse hoạt họa<br/>• Click chọn mở ngăn kéo Drawer sạp"]
        FINANCIAL["Bảng điều khiển tài chính sạp<br/>• Quét mã VietQR thanh toán<br/>• Nhắc nợ SMS tự động"]
    end

    DATA --> ADAPTER
    ADAPTER --> CANONICAL
    CANONICAL --> SVG
    CANONICAL --> FINANCIAL
    SVG <-->|"Tương tác phản xạ 2 chiều"| FINANCIAL

    style DATA fill:#fce4ec,stroke:#c2185b,stroke-width:1px;
    style ENGINE fill:#ede7f6,stroke:#512da8,stroke-width:1px;
    style VISUAL fill:#e0f2f1,stroke:#00796b,stroke-width:1px;
```

---

## 4. MA TRẬN API ENDPOINTS KẾT NỐI GIỮA CMS VÀ BACKEND

| Nhóm chức năng (`Module`) | Phương thức (`Method`) | Đường dẫn Endpoint (`API Route`) | Mục đích nghiệp vụ (`Business Purpose`) |
| :--- | :---: | :--- | :--- |
| **Hệ thống chợ** | `GET` | `/admin/markets` | Lấy danh sách toàn bộ các chợ trên địa bàn quản lý |
| **Sạp hàng** | `GET` | `/admin/stalls?limit=100` | Tải dữ liệu toàn bộ sạp, phân khu, trạng thái hợp đồng |
| **Khiếu nại PAKN** | `GET` | `/admin/complaints?limit=100` | Tải danh sách phản ánh của người dân |
| **Giải quyết PAKN** | `POST` | `/admin/complaints/{id}/resolve` | Đóng khiếu nại, lưu ảnh biên bản xử lý hiện trường |
| **Duyệt hồ sơ sạp** | `GET` | `/admin/merchant-approvals?limit=100` | Danh sách đơn đăng ký thuê sạp của tiểu thương |
| **Phê duyệt sạp** | `POST` | `/admin/merchant-approvals/{id}/approve` | Phê duyệt hợp đồng và cấp phát sạp kinh doanh |
| **Từ chối hồ sơ** | `POST` | `/admin/merchant-approvals/{id}/reject` | Từ chối hồ sơ kèm lý do quy chế chợ |
| **Tiểu thương** | `GET` | `/admin/traders?limit=100` | Danh sách danh bạ hộ kinh doanh, đánh giá sao |
| **Hàng hóa sản phẩm** | `GET` | `/admin/products?limit=100` | Danh mục hàng hóa niêm yết giá & nguồn gốc VietGAP |
| **Đơn hàng online** | `GET` | `/admin/orders?limit=100` | Giám sát đơn đặt hàng của khách đi chợ qua Zalo |
| **Phát thông báo** | `POST` | `/admin/notifications` | Phát tin khẩn cấp, đôn đốc nợ phí, phát loa công cộng |

---

## 5. KẾT LUẬN & ĐẶC TẢ BẢO TOÀN KIẾN TRÚC

1. **Tính độc lập & mở rộng (`Extensibility`)**: Tách biệt 3 kho mã nguồn Git riêng biệt trên GitHub bảo đảm mỗi phân hệ phát triển theo chu kỳ độc lập, dễ dàng đóng gói Docker/Container hoặc tích hợp Pipeline CI/CD.
2. **Khả năng chịu lỗi cao (`High Resilience`)**: Web CMS được tích hợp cơ chế dự phòng (`Fallback Mechanism`) trong hook `useBackendSync.ts`. Nếu Core Backend offline hoặc bảo trì, CMS tự động chuyển sang chế độ dữ liệu cục bộ (`Local Fixtures`) mà không làm gián đoạn trải nghiệm của cán bộ BQL.
3. **An toàn dữ liệu tuyệt đối (`Data Integrity`)**: Không lưu trữ mật khẩu, secret key hay token tĩnh trong mã nguồn; tuân thủ nghiêm ngặt chuẩn bảo mật xác thực `Bearer Token` và `Zalo OAuth`.
