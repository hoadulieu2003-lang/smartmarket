# Đặc Tả Kỹ Thuật: 5 Yêu Cầu Tối Ưu Hóa Từ Client (Client Feedback Specification)

- **Ngày ban hành**: 2026-09-05
- **Người duyệt**: Anh (Lead Architect / Product Owner)
- **Tài liệu gốc**: Ảnh yêu cầu từ Client `media_1788598533937.png`
- **Mục tiêu**: Tối ưu hóa toàn diện giao diện Mobile, tái cấu trúc 4 khối chỉ số kèm luồng Tab In-page, tinh gọn Menu và loại bỏ module phi thực tế, chuyển đổi Banner thành Khung nhắc việc tác chiến, và hỗ trợ Pop-up mở nhanh sơ đồ sạp hàng từ Dashboard.

---

## 1. Chi Tiết 5 Hạng Mục Nghiệp Vụ & Tiêu Chuẩn Hoàn Thành

### Hạng mục 1: Tối ưu hóa UI/UX Dashboard Mobile (Ưu tiên 1)
- **Yêu cầu kỹ thuật**:
  - Tái cấu trúc Dashboard trên Mobile (`viewport < 768px`) thành bố cục lưới 2x2 vuông vắn, cân đối lề (`padding: 12px - 16px`, không xô lệch viền).
  - Thay toàn bộ icon mặc định bằng bộ icon chuyên biệt theo nghiệp vụ chợ, có màu sắc trạng thái rõ nét:
    - Xanh lá (`#0B7A3A` / `#5CBD68`): Bình thường, đạt chuẩn, doanh thu tốt.
    - Vàng cam (`#FFB53D` / `#FFAE2E`): Cảnh báo, sắp hết hạn, cần chú ý.
    - Đỏ san hô (`#D3484D` / `#F0444D`): Sự cố khẩn cấp P0, quá hạn nộp phí, vi phạm.
  - Tối ưu kích cỡ font số liệu KPI lớn (`font-black text-2xl sm:text-3xl font-mono`) giúp trực ban dễ dàng đọc số liệu dưới ánh sáng mặt trời khi kiểm tra thực địa.

### Hạng mục 2: Tái Cấu Trúc 4 Khối Chỉ Số & Luồng Tab Lọc Tại Chỗ (Ưu tiên 1)
- **Yêu cầu kỹ thuật**:
  - Cấu hình chuẩn hóa 4 thẻ chỉ số:
    1. **Sạp hàng**: Hiển thị định dạng `[Đang thuê] / [Tổng sạp]` (`24 / 50 sạp`), tỷ lệ lấp đầy `48%` (↑ 8 sạp so với tuần trước).
    2. **Tiểu thương**: `19 hộ kinh doanh` (100% hồ sơ hoàn tất).
    3. **Phản ánh**: `15 sự cố P0` (15 phản ánh chưa xử lý trong ca).
    4. **Thu phí**: `223.200.000đ` (Đạt 93% chỉ tiêu tháng, nợ `16.800.000đ`).
  - Lập trình **In-page Tab Filtering (Lọc dữ liệu tại chỗ)**:
    - Khi người dùng click vào bất kỳ thẻ chỉ số nào trong 4 thẻ, khu vực nội dung bên dưới tự động chuyển đổi dữ liệu tương ứng ngay lập tức.
    - Tuyệt đối không reload trang, không mở tab trình duyệt mới, không chuyển hướng view.
    - Tab 1 (`stalls`): Hiển thị bảng phân loại sạp theo 5 phân khu và tình trạng thuê.
    - Tab 2 (`traders`): Hiển thị danh bạ tiểu thương đang hoạt động tại chợ.
    - Tab 3 (`complaints`): Hiển thị danh sách 15 sự cố PAKN phân loại theo 3 nhóm nghiệp vụ.
    - Tab 4 (`billing`): Hiển thị tiến độ thu phí thị trường và danh sách sạp nợ phí.

### Hạng mục 3: Điều Chỉnh Hệ Thống Phản Ánh & Pop-up Modal Mở Nhanh Sơ Đồ (Ưu tiên 2)
- **Yêu cầu kỹ thuật**:
  - Tinh gọn phân loại khiếu nại thành 3 nhóm nghiệp vụ chính:
    1. *An toàn vệ sinh & Hạ tầng* (Nước tràn, rác thải, cống rãnh, mùi hôi).
    2. *Trật tự & Lấn chiếm mặt bằng* (Lấn chiếm lối đi chung, vi phạm diện tích sạp).
    3. *Thương mại & Dịch vụ* (Thái độ phục vụ, nguồn gốc xuất xứ, niêm yết giá).
  - Bỏ quy định bắt buộc định vị tọa độ với sự cố hạ tầng chung (người dân/tiểu thương chỉ cần ảnh + mô tả là gửi được ngay dưới 30 giây).
  - Cho phép ghim/chọn trực tiếp mã sạp hàng khi phản ánh liên quan tới sạp vi phạm.
  - Xây dựng **Pop-up / Modal mở nhanh sơ đồ chợ ngay từ Dashboard**:
    - Khi bấm vào nút "Xem vị trí trên sơ đồ" tại bất kỳ sự cố nào, bật ngay Modal sơ đồ chợ thu nhỏ (hoặc toàn màn hình), định vị và nhấp nháy sạp vi phạm với radar beacon đỏ mà không làm mất ngữ cảnh của Dashboard.

### Hạng mục 4: Cắt Bỏ Module 'Đối Soát Thủ Công' & Tinh Gọn Menu Sidebar (Ưu tiên 1)
- **Yêu cầu kỹ thuật**:
  - Gỡ bỏ hoàn toàn module 'Đối soát QR' yêu cầu nhập tay mã ngân hàng (phi thực tế tại môi trường chợ truyền thống).
  - Rút gọn Menu Sidebar: Loại bỏ các danh mục rườm rà (Kinh doanh, Đơn hàng online, Hệ thống...), chỉ giữ lại đúng 4 mục thiết yếu:
    1. **Tổng quan** (Icon Grid, đường dẫn `/` overview)
    2. **Sơ đồ chợ** (Icon Map, đường dẫn `/` market_map)
    3. **Bản đồ GIS** (Icon Globe, liên kết GIS vệ tinh)
    4. **Duyệt hồ sơ tiểu thương** (Icon ShieldCheck / Users, pending_profiles)

### Hạng mục 5: Thiết Kế Lại Bản Tin Vận Hành BQL (Ưu tiên 2)
- **Yêu cầu kỹ thuật**:
  - Xóa bỏ các câu text chào hỏi mang tính hình thức ("Chào anh, hôm nay chợ thế nào? Một vài tín hiệu nhanh...").
  - Chuyển đổi thành **Khung nhắc việc tự động (Operational Daily To-Do List)**:
    - 🔴 **15 phản ánh khẩn cấp chưa duyệt**: Có nút bấm "Xử lý ngay (15)" mở nhanh danh sách sự cố.
    - 🟡 **4 hộ kinh doanh đến hạn nộp phí chợ / 5 sạp sắp hết hạn**: Có nút "Đôn đốc thu phí".
    - 🟢 **24 sạp đang hoạt động ổn định**: Trạng thái vận hành bình thường.
  - Thiết kế sắc sảo, đóng vai trò như bảng điều phối công việc đầu ca cho Trưởng ban Quản lý và Trực ban.

---

## 2. Kế Hoạch Kiểm Thử & Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- **AC-01**: Dashboard trên viewport mobile (390px - 414px) hiển thị 4 thẻ KPI theo lưới 2x2 vuông vắn, không tràn lề ngang, không lệch viền.
- **AC-02**: Bấm vào bất kỳ thẻ KPI nào trong 4 thẻ (Sạp hàng, Tiểu thương, Phản ánh, Thu phí) sẽ cập nhật nội dung tab lọc tại chỗ ngay lập tức (<50ms).
- **AC-03**: Menu Sidebar chỉ hiển thị duy nhất 4 mục: Tổng quan, Sơ đồ chợ, Bản đồ GIS, Duyệt hồ sơ tiểu thương.
- **AC-04**: Module 'Đối soát QR' thủ công bị loại bỏ hoàn toàn khỏi giao diện.
- **AC-05**: Hero Banner không còn câu chào hỏi hình thức, hiển thị đầy đủ 3 khối nhắc việc To-do list điều hành.
- **AC-06**: Modal Pop-up sơ đồ chợ mở ra nhanh chóng khi nhấn xem sạp vi phạm từ danh sách phản ánh.
- **AC-07**: Toàn bộ 19 file kiểm thử unit tests (125 tests) và 10 E2E tests Playwright duy trì trạng thái xanh 100%.
