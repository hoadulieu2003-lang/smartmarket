# Smartmarket — Calm Spatial Operations UI Design

## 1. Quyết định và phạm vi

- Ngày chốt hướng: 2026-09-03.
- Người duyệt: Product Owner (Anh).
- Direction: **Calm Spatial Operations** — A làm nền điều hành bình tĩnh, B làm điểm nhấn không gian có kiểm soát, C làm luật mật độ Swiss/operational.
- Mục tiêu: nâng cấp toàn bộ giao diện Web CMS Smartmarket để đọc tốt trên desktop và mobile, đồng thời giữ nguyên cấu trúc nghiệp vụ, trạng thái, callback và luồng tác chiến hiện có.
- Workspace triển khai: `C:\Users\game\Documents\app\Smartmarket.worktrees\ui-refresh`.
- Workspace bảo toàn: `C:\Users\game\Documents\app\Smartmarket` không được sửa trong giai đoạn này.

## 2. Bằng chứng hiện trạng

- Stack: Next.js 16.3.4, React 19.2.8, Tailwind CSS 4, TypeScript, Lucide React.
- Runtime desktop đã quan sát ở 1280x720: các vùng chính cùng xuất hiện nhưng Priority Area, filter và Map Toolbar có mật độ cao.
- Runtime mobile đã quan sát ở 390x844: sidebar cố định chiếm gần toàn bộ bề rộng, các cột Priority Area bị ép hẹp và nội dung không còn dễ đọc.
- Baseline trong worktree trước khi nâng cấp: Vitest 43/43 pass; Next.js production build pass.
- File điều phối hiện tại: `src/app/page.tsx`.
- Token/CSS hiện tại: `src/app/globals.css`.
- Shell hiện tại: `src/components/Sidebar.tsx`, `Header.tsx`, `UrgentActionCards.tsx`, `InlineOverviewBar.tsx`, `MapToolbar.tsx`, `StallDetailDrawer.tsx`.
- `PROJECT_STATE.yaml` xác nhận Canonical Spatial Model v3.2.0 frozen và yêu cầu tách Canonical Data khỏi Presentation Layer.

## 3. Mục tiêu trải nghiệm

1. Trực ban phải quét được P0/P1 trong vài giây mà không bị các màu brand lấn át cảnh báo.
2. Điều hướng và bộ lọc giữ đúng ngữ nghĩa hiện tại, nhưng có thể thao tác bằng bàn phím và ngón tay.
3. Bản đồ là vùng spatial chính; hiệu ứng depth chỉ giúp định vị focus/selection, không biến toàn bộ CMS thành glassmorphism.
4. Mobile là một chế độ trình bày thật sự: không ép desktop thu nhỏ, không xuất hiện horizontal scroll.
5. Mọi thông tin phạm vi chợ/tenant vẫn nhìn thấy rõ; UI không được che giấu dữ liệu sai phạm vi.

## 4. Ngoài phạm vi

- Không thay đổi Canonical Spatial Model, hình học, fixture, issue priority hoặc dữ liệu mock.
- Không đổi route, API, state machine, callback nghiệp vụ, quy tắc lọc hoặc hành động điều phối.
- Không dựng lại toàn bộ map renderer, không thêm Three.js/3D mới.
- Không thêm dashboard nghiệp vụ mới, auth mới hoặc phân quyền mới.
- Không dùng gradient trang trí, emoji làm icon cấu trúc, hay animation làm chậm thao tác.

## 5. Hệ thiết kế

### 5.1 Visual grammar

- **Calm (kham) = bình tĩnh:** nền trung tính, đường viền mảnh, khoảng thở ổn định.
- **Spatial (spây-shồ) = không gian:** depth theo lớp cho map, overlay và selected focus.
- **Operational (ó-pờ-rây-shờ-nồ) = tác chiến:** số liệu, trạng thái và CTA có thứ bậc rõ.
- **Swiss density (suyt-x mật độ) = lưới vận hành:** căn chỉnh theo grid và nhịp 4/8px; nhãn ngắn nhưng không cắt mất nội dung thiết yếu.

### 5.2 Primitive tokens

Các giá trị raw chỉ tồn tại trong `src/app/globals.css` hoặc token file tương đương:

```css
--sm-green-700: #076C31;
--sm-green-800: #055225;
--slate-950: #0F172A;
--slate-700: #334155;
--slate-600: #475569;
--slate-500: #64748B;
--slate-300: #CBD5E1;
--slate-200: #E2E8F0;
--slate-100: #F1F5F9;
--slate-50: #F8FAFC;
--white: #FFFFFF;
--rose-600: #E11D48;
--amber-500: #F59E0B;
--blue-600: #2563EB;
```

### 5.3 Semantic tokens

- `--color-bg`: `--slate-50`.
- `--color-surface`: `--white`.
- `--color-text-primary`: `--slate-950`.
- `--color-text-secondary`: `--slate-600`.
- `--color-border`: `--slate-200`.
- `--color-brand`: `--sm-green-700`.
- `--color-selected-surface`: emerald tint; chỉ dành cho selected/navigation.
- `--color-danger`: `--rose-600`; P0/complaint.
- `--color-warning`: `--amber-500`; expiring/infrastructure warning.
- `--color-info`: `--blue-600`; informational state.
- `--focus-ring`: `--sm-green-700` với outline tối thiểu 2px.

Green không được dùng để biểu đạt lỗi/cảnh báo. Trạng thái phải có cả màu, icon vector và text.

### 5.4 Typography và spacing

- Body tối thiểu 16px ở mobile; desktop dùng 13–15px cho metadata và 16px cho nội dung chính.
- Heading dùng cùng family sans hiện có, weight 650–750; mã sạp, số liệu, timestamp dùng mono.
- Line-height body 1.5; không dùng text nhỏ hơn 12px cho thông tin cần đọc.
- Nhịp spacing: 4/8/12/16/24/32px.
- Interactive target tối thiểu 44x44px; khoảng cách giữa target tối thiểu 8px.
- Border radius thống nhất: control 8px, surface 12px, drawer 16px; không dùng radius 24px tràn lan.
- Shadow chỉ dùng cho overlay/drawer và lớp map focus; surface thường dựa vào border và khoảng cách.

## 6. Kiến trúc responsive

| Viewport | Shell | Priority Area | Map/Drawer |
|---|---|---|---|
| 1280px trở lên | Sidebar 240px; có rail 64px khi collapse; Header 56px | 4 vùng theo hierarchy P0→P3 | Map trung tâm; Drawer 360–400px bên phải |
| 768–1279px | Sidebar collapse mặc định hoặc mở overlay; Header giữ search | 2 cột, mỗi panel tự giãn chiều cao | Drawer overlay, map giữ vùng thao tác |
| dưới 768px | Sidebar thành off-canvas; top bar có nút menu; Header gọn | Stack dọc/accordion; filter cuộn ngang có nhãn đầy đủ | Toolbar 2 tầng cuộn ngang có kiểm soát; Drawer thành bottom sheet |
| 390px mục tiêu | Không có sidebar cố định | P0 hiển thị đầu tiên; P1–P3 thu gọn được | Bottom sheet tối đa 88dvh, có handle/close/escape |

Quy tắc chung: ưu tiên nội dung cốt lõi trên mobile, reserve space cho header/fixed controls, `min-height: 100dvh`, không để `scrollWidth` vượt `innerWidth`.

## 7. Đặc tả component

### 7.1 Sidebar

- Desktop giữ nhóm menu và badge hiện có, nhưng chuyển sang token semantic và trạng thái focus-visible.
- Collapse rail chỉ hiển thị icon có `aria-label`/tooltip; target vẫn >=44px.
- Mobile không chiếm layout flow: mở bằng nút menu, có scrim, đóng bằng Escape hoặc click ngoài; focus trả về nút mở.
- Không đổi `onSelectView`, `onScrollToFees`, `onFilterComplaints`.

### 7.2 Header

- Desktop: search là primary control; clock và profile là secondary metadata.
- Tablet/mobile: search co giãn; clock chuyển thành metadata tùy chọn, profile chỉ giữ avatar + tên ngắn.
- Notification giữ badge urgent và accessible name; không dùng animation ping nếu `prefers-reduced-motion`.
- Thêm focus ring rõ cho input, clear button và notification.

### 7.3 Priority Area (`UrgentActionCards`)

- Giữ 4 tầng dữ liệu và click targets.
- Desktop: grid 4 vùng, P0 có visual weight cao nhất nhưng không phủ đỏ toàn panel.
- Tablet: grid 2x2.
- Mobile: P0 expanded mặc định; P1–P3 là accordion có `aria-expanded`; nội dung không bị cắt bằng ellipsis nếu là số liệu/tác vụ.
- CTA “Lọc sơ đồ” và “Vào duyệt hồ sơ” >=44px.

### 7.4 Quick filters (`InlineOverviewBar`)

- Desktop: một hàng flex-wrap có category select.
- Mobile: filter chips cuộn ngang trong một vùng có affordance; dùng button native với `aria-pressed`.
- Category select có label hiển thị ở tablet/desktop và accessible label ở mobile.
- Không đổi ids `all`, `complaint`, `expiring`, `maintenance`, `empty`.

### 7.5 Map Toolbar và map shell

- Desktop tối đa 2 hàng: hàng 1 cho floor/zone/search/view engine; hàng 2 cho duty view/layer/zoom/fullscreen.
- Mobile gom các layer ít dùng vào disclosure; giữ trực tiếp floor, zone, search và reset.
- Thay emoji trong layer/legend bằng icon Lucide hoặc SVG có cùng stroke language.
- Fixture selector và legend không được đẩy map ra ngoài viewport; cho phép scroll ngang nội bộ có `aria-label`.
- Map focus/selected sử dụng halo xanh; màu nghiệp vụ của stall không bị thay đổi.

### 7.6 Stall Detail Drawer

- Desktop: right inspector 360–400px, có scrim nhẹ khi cần; mở/đóng bằng transform + opacity.
- Mobile: bottom sheet với `max-height: 88dvh`, nội dung cuộn bên trong, vùng drag chỉ là bổ trợ; luôn có nút Close.
- Khi mở: focus vào heading/nút close; khi đóng: trả focus về stall trigger; Escape đóng; không trap focus sai.
- Giữ đủ 6 khối quyết định và các callback action hiện có; không thay đổi hành động nghiệp vụ.

### 7.7 Fee section và pending profiles

- Giữ dữ liệu và CTA hiện tại; áp dụng surface/token/typography chung.
- Fee cards chuyển từ các khối ngang cứng sang grid responsive; số tiền dùng tabular mono.
- Pending profiles mobile dùng 1 cột, action buttons vẫn >=44px và lỗi/thông báo nằm cạnh ngữ cảnh.

## 8. Accessibility và quality gates

- Skip link tới `main`.
- Heading hierarchy tuần tự; mọi icon-only control có accessible name.
- Keyboard: Tab order theo thứ tự thị giác; Enter/Space cho custom controls; Escape cho sidebar/drawer.
- Focus-visible 2px tương phản; sticky/fixed UI không che focus.
- Contrast body text >=4.5:1; non-text control >=3:1.
- `prefers-reduced-motion` tắt pulse/scale không cần thiết.
- Không truyền ý nghĩa chỉ bằng màu; mọi cảnh báo có text/icon.
- Mobile không horizontal overflow ở page root; overflow ngang chỉ nằm trong vùng có chủ đích và có nhãn.

## 9. Bảo toàn dữ liệu và phạm vi tenant

- Presentation layer không thêm style vào Canonical Spatial Model hoặc fixture.
- Không đổi nhãn chợ, market scope, role hoặc số liệu để “làm đẹp” giao diện.
- Khi selector/metrics có dữ liệu không cùng tenant, UI phải giữ trạng thái disabled/label hiện tại và không tự sửa dữ liệu bằng client-side.
- Mọi thay đổi visual phải chứng minh bằng snapshot trước/sau rằng code nghiệp vụ và callback vẫn tồn tại.

## 10. Kế hoạch triển khai sau khi spec được duyệt

1. Token foundation: cập nhật `src/app/globals.css`, metadata và shared layout primitives; không đổi dữ liệu.
2. Shell responsive: Sidebar, Header và page container; thêm mobile off-canvas và skip link.
3. Priority/filter responsive: UrgentActionCards, InlineOverviewBar, PendingProfilesView.
4. Map controls: MapToolbar, fixture/legend và icon vector; giữ nguyên renderer/model.
5. Drawer/fee polish: StallDetailDrawer, MarketFeeCollectionSection và motion/a11y states.
6. Verification: Vitest hiện có, component behavior, Playwright ở 390/768/1280, keyboard, drawer, no-overflow và screenshots.

## 11. Acceptance criteria

- AC-01: `C:\Users\game\Documents\app\Smartmarket` không bị sửa; mọi diff nằm trong worktree `ui-refresh`.
- AC-02: Vitest baseline và test mới pass; không giảm coverage hành vi hiện có.
- AC-03: Next.js build và lint pass.
- AC-04: Desktop 1280px giữ được hierarchy P0→P3, map, fee section và drawer.
- AC-05: 390px không có page-level horizontal overflow; sidebar off-canvas, Priority Area đọc được, Drawer là bottom sheet.
- AC-06: Keyboard có thể mở/đóng sidebar và drawer, chọn filter, chọn stall, với focus-visible rõ.
- AC-07: Không còn emoji làm icon cấu trúc trong Shell/Map Toolbar/legend.
- AC-08: Canonical Spatial Model, fixture, state transition và callback nghiệp vụ không đổi nghĩa.
- AC-09: Visual evidence gồm screenshot desktop/mobile trước/sau và log test/build có timestamp.

## 12. Trạng thái phê duyệt

- Direction lai: **đã được anh chốt**.
- Worktree isolation: **đã tạo và baseline pass**.
- Design spec: **đang chờ anh review file này**.
- `$dev`: chưa bắt đầu cho tới khi anh xác nhận spec không cần sửa.
