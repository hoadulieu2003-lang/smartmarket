/**
 * MOCK OPERATIONAL MARKET DATA — SMART MARKET
 * Dữ liệu phục vụ kiểm tra tác chiến Ban Quản Lý (Chợ Đồng Xuân)
 */

export interface MarketSummary {
  activeStalls: number;
  emptyStalls: number;
  maintenanceStalls: number;
  occupancyRate: number;
}

export interface ComplaintItem {
  id: string;
  stallId: string;
  title: string;
  severity: 'critical' | 'warning' | 'medium';
  time: string;
  reporter: string;
}

export interface AreaAlertLocation {
  id: string;
  name: string;
  count: number;
  detail: string;
  status: 'urgent' | 'warning';
}

export interface ExpiringContractItem {
  stallId: string;
  merchant: string;
  business: string;
  daysLeft: number;
  expiryDate: string;
}

export interface PendingProfileItem {
  id: string;
  stallId: string;
  applicant: string;
  type: string;
  submitted: string;
  status: 'overdue' | 'pending';
}

export interface UrgentActionsData {
  complaints: {
    total: number;
    critical: number;
    items: ComplaintItem[];
  };
  areaAlerts: {
    total: number;
    critical: number;
    locations: AreaAlertLocation[];
  };
  expiringContracts: {
    totalUnder30: number;
    criticalUnder7: number;
    items: ExpiringContractItem[];
  };
  pendingProfiles: {
    totalPending: number;
    overdue: number;
    items: PendingProfileItem[];
  };
}

export interface LegacyStall {
  id: string;
  code: string;
  name: string;
  merchant: string;
  phone: string;
  category: string;
  zone: string;
  zoneName: string;
  status: 'normal' | 'complaint' | 'expiring' | 'maintenance' | 'empty';
  complaintsCount: number;
  complaintList?: Array<{ id: string; text: string; time: string; status: string }>;
  daysLeftContract: number;
  contractExpiry: string;
  monthlyRevenue: string;
  rating: number;
  ratingCount: number;
  foodSafetyCert?: string;
  notes?: string;
}

export const MARKET_SUMMARY: MarketSummary = {
  activeStalls: 187,
  emptyStalls: 12,
  maintenanceStalls: 9,
  occupancyRate: 88,
};

export const URGENT_ACTIONS: UrgentActionsData = {
  complaints: {
    total: 12,
    critical: 4,
    items: [
      { id: 'cp-01', stallId: 'A12', title: 'Nước rửa tràn ra lối đi chung gây trơn trượt', severity: 'critical', time: '20 phút trước', reporter: 'Khách hàng' },
      { id: 'cp-02', stallId: 'alert_east_drain', title: 'Cống thoát nước bốc mùi nồng nặc tại dãy A', severity: 'critical', time: '45 phút trước', reporter: 'Tiểu thương A10' },
      { id: 'cp-03', stallId: 'C02', title: 'Không niêm yết giá bán theo quy định chợ', severity: 'warning', time: '1 giờ trước', reporter: 'Ban Kiểm tra Giá' },
      { id: 'cp-04', stallId: 'B02', title: 'Xe đẩy hàng chắn lối đi phụ B-C', severity: 'warning', time: '2 giờ trước', reporter: 'Bảo vệ ca sáng' }
    ]
  },
  areaAlerts: {
    total: 3,
    critical: 2,
    locations: [
      { id: 'alert_east_drain', name: 'Cống phía Đông', count: 7, detail: '7 phản ánh trong 3 ngày (Mùi hôi, nước thoát chậm)', status: 'urgent' },
      { id: 'alert_trash_zone_b', name: 'Khu rác B', count: 1, detail: 'Rác hữu cơ tồn đọng ca sáng cần xe ép dọn ngay', status: 'urgent' },
      { id: 'alert_aisle_c', name: 'Lối đi C2', count: 1, detail: 'Nước đọng trơn trượt sau mưa cần gạt sàn', status: 'warning' }
    ]
  },
  expiringContracts: {
    totalUnder30: 18,
    criticalUnder7: 3,
    items: [
      { stallId: 'C08', merchant: 'Trần Đình Trọng', business: 'Bánh kẹo & Mứt', daysLeft: 6, expiryDate: '05/09/2026' },
      { stallId: 'B07', merchant: 'Trần Văn Tuấn', business: 'Rau sạch Mộc Châu', daysLeft: 12, expiryDate: '11/09/2026' },
      { stallId: 'A09', merchant: 'Phạm Thị Loan', business: 'Gà ta Hưng Yên', daysLeft: 18, expiryDate: '17/09/2026' },
      { stallId: 'C11', merchant: 'Hoàng Văn Nam', business: 'Đồ hộp & Gia vị', daysLeft: 28, expiryDate: '27/09/2026' }
    ]
  },
  pendingProfiles: {
    totalPending: 7,
    overdue: 2,
    items: [
      { id: 'pf-01', stallId: 'A06', applicant: 'Ngô Thanh Tùng', type: 'Đăng ký thuê mới sạp A06 (Hải sản đông lạnh)', submitted: '4 ngày trước', status: 'overdue' },
      { id: 'pf-02', stallId: 'B10', applicant: 'Lê Thu Hương', type: 'Chuyển nhượng quyền thuê B10 (Trái cây hữu cơ)', submitted: '3 ngày trước', status: 'overdue' },
      { id: 'pf-03', stallId: 'C05', applicant: 'Đặng Ngọc Anh', type: 'Bổ sung giấy chứng nhận ATTP', submitted: '1 ngày trước', status: 'pending' }
    ]
  }
};

export const AREA_ALERTS_DATA = [
  { id: 'alert_east_drain', name: 'Cống thoát nước dãy A (Mặt Đông)', count: 7, detail: '7 phản ánh trong 3 ngày (Mùi hôi, nước thoát chậm khi xả cá)', status: 'urgent', zone: 'A' },
  { id: 'alert_trash_zone_b', name: 'Điểm tập kết rác phụ Khu B', count: 1, detail: 'Rác hữu cơ rau củ tồn đọng ca sáng chưa được xe gom thu dọn', status: 'urgent', zone: 'B' },
  { id: 'alert_aisle_c', name: 'Lối đi nhánh C2–C3', count: 1, detail: 'Nước mưa đọng cục bộ gây trơn trượt người đi chợ', status: 'warning', zone: 'C' }
];

export const STALLS_DATA: LegacyStall[] = [
  // --- KHU A: THỰC PHẨM TƯƠI SỐNG ---
  {
    id: 'A01', code: 'A01', name: 'Thịt bò Tươi Sạch', merchant: 'Nguyễn Văn Hùng', phone: '0912 345 678',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'normal',
    complaintsCount: 0, daysLeftContract: 210, contractExpiry: '28/03/2027', monthlyRevenue: '55.000.000đ',
    rating: 4.9, ratingCount: 154, foodSafetyCert: 'Còn hiệu lực', notes: 'Sạp hoạt động tiêu chuẩn, thanh toán mã QR đầy đủ.'
  },
  {
    id: 'A02', code: 'A02', name: 'Cá biển Hoàng Hải', merchant: 'Lê Văn Hải', phone: '0988 776 554',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'complaint',
    complaintsCount: 1, complaintList: [{ id: 'cp-a02-1', text: 'Để xô nước đá lấn 0.3m lối đi chung', time: 'Hôm nay 08:30', status: 'Chưa xử lý' }],
    daysLeftContract: 145, contractExpiry: '22/01/2027', monthlyRevenue: '48.000.000đ', rating: 4.5, ratingCount: 96,
    foodSafetyCert: 'Còn hiệu lực', notes: 'Cần nhắc nhở giữ vệ sinh khu vực bày đá ướp cá.'
  },
  {
    id: 'A03', code: 'A03', name: 'Tôm cua Cà Mau', merchant: 'Trịnh Quốc Bảo', phone: '0903 221 109',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'maintenance',
    complaintsCount: 0, daysLeftContract: 98, contractExpiry: '06/12/2026', monthlyRevenue: '38.000.000đ',
    rating: 4.6, ratingCount: 72, foodSafetyCert: 'Còn hiệu lực', notes: 'Sửa đường ống dẫn nước ngầm và đồng hồ đo nước.'
  },
  {
    id: 'A04', code: 'A04', name: 'Gia cầm Thanh Vân', merchant: 'Nguyễn Thị Vân', phone: '0977 443 322',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'normal',
    complaintsCount: 0, daysLeftContract: 180, contractExpiry: '26/02/2027', monthlyRevenue: '39.200.000đ',
    rating: 4.8, ratingCount: 110, foodSafetyCert: 'Còn hiệu lực', notes: 'Kiểm dịch thú y định kỳ đạt chuẩn.'
  },
  {
    id: 'A05', code: 'A05', name: 'Thịt heo CP Mart', merchant: 'Vũ Đình Mạnh', phone: '0918 665 544',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'normal',
    complaintsCount: 0, daysLeftContract: 310, contractExpiry: '06/07/2027', monthlyRevenue: '62.000.000đ',
    rating: 4.9, ratingCount: 205, foodSafetyCert: 'Còn hiệu lực', notes: 'Hệ thống tủ mát trưng bày hiện đại.'
  },
  {
    id: 'A06', code: 'A06', name: 'Sạp trống (Đang mở đăng ký)', merchant: 'Chưa có tiểu thương', phone: '-',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'empty',
    complaintsCount: 0, daysLeftContract: 0, contractExpiry: '-', monthlyRevenue: '0đ',
    rating: 0, ratingCount: 0, foodSafetyCert: 'Chờ cấp', notes: 'Đang có 1 hồ sơ của ông Ngô Thanh Tùng chờ xét duyệt thuê.'
  },
  {
    id: 'A07', code: 'A07', name: 'Hải sản tươi sống Quảng Ninh', merchant: 'Đỗ Thành Đạt', phone: '0965 112 233',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'normal',
    complaintsCount: 0, daysLeftContract: 85, contractExpiry: '23/11/2026', monthlyRevenue: '51.000.000đ',
    rating: 4.7, ratingCount: 140, foodSafetyCert: 'Còn hiệu lực', notes: 'Bể sục oxy được kiểm định an toàn điện.'
  },
  {
    id: 'A08', code: 'A08', name: 'Chả lụa Ước Lễ', merchant: 'Phạm Thị Mùi', phone: '0943 887 766',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'normal',
    complaintsCount: 0, daysLeftContract: 220, contractExpiry: '07/04/2027', monthlyRevenue: '44.000.000đ',
    rating: 4.8, ratingCount: 180, foodSafetyCert: 'Còn hiệu lực', notes: 'Đã đạt chứng nhận OCOP 4 sao.'
  },
  {
    id: 'A09', code: 'A09', name: 'Gà ta Hưng Yên', merchant: 'Phạm Thị Loan', phone: '0904 556 778',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'expiring',
    complaintsCount: 0, daysLeftContract: 18, contractExpiry: '17/09/2026', monthlyRevenue: '41.000.000đ',
    rating: 4.7, ratingCount: 95, foodSafetyCert: 'Còn hiệu lực', notes: 'Hợp đồng còn 18 ngày, tiểu thương đã gửi đơn xin gia hạn 1 năm.'
  },
  {
    id: 'A10', code: 'A10', name: 'Cá hồi Sapa & Hải sản cao cấp', merchant: 'Nguyễn Kiên Cường', phone: '0982 990 011',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'normal',
    complaintsCount: 0, daysLeftContract: 340, contractExpiry: '05/08/2027', monthlyRevenue: '75.000.000đ',
    rating: 4.9, ratingCount: 220, foodSafetyCert: 'Còn hiệu lực', notes: 'Top 3 doanh thu cao nhất ngành hàng tươi sống.'
  },
  {
    id: 'A11', code: 'A11', name: 'Thịt bò tơ Củ Chi', merchant: 'Bùi Văn Hào', phone: '0938 123 789',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'normal',
    complaintsCount: 0, daysLeftContract: 195, contractExpiry: '13/03/2027', monthlyRevenue: '49.000.000đ',
    rating: 4.7, ratingCount: 88, foodSafetyCert: 'Còn hiệu lực', notes: 'Thịt tươi nhập hàng sáng sớm hàng ngày.'
  },
  {
    id: 'A12', code: 'A12', name: 'Thủy hải sản Nam Định', merchant: 'Lê Văn Nam', phone: '0909 332 114',
    category: 'Thực phẩm tươi', zone: 'A', zoneName: 'Khu A — Thực phẩm tươi sống', status: 'complaint',
    complaintsCount: 3, complaintList: [
      { id: 'cp-a12-1', text: 'Nước rửa tràn ra lối đi chung gây trơn trượt khách đi chợ', time: 'Hôm nay 08:15', status: 'Chưa xử lý' },
      { id: 'cp-a12-2', text: 'Mùi hôi tanh nồng nặc do không đậy nắp thùng thu gom nội tạng', time: 'Hôm nay 07:45', status: 'Chưa xử lý' },
      { id: 'cp-a12-3', text: 'Tiểu thương tranh cãi to tiếng với khách hàng', time: 'Hôm qua 16:20', status: 'Đang hòa giải' }
    ],
    daysLeftContract: 12, contractExpiry: '11/09/2026', monthlyRevenue: '34.000.000đ', rating: 3.9, ratingCount: 45,
    foodSafetyCert: 'Cần kiểm tra lại', notes: 'Sạp có phản ánh khẩn cấp liên tiếp, cần lập biên bản chấn chỉnh.'
  },

  // --- KHU B: RAU CỦ & TRÁI CÂY ---
  {
    id: 'B01', code: 'B01', name: 'Rau an toàn Vân Nội', merchant: 'Lê Thị Thu', phone: '0913 221 445',
    category: 'Rau củ', zone: 'B', zoneName: 'Khu B — Rau củ & Trái cây', status: 'normal',
    complaintsCount: 0, daysLeftContract: 160, contractExpiry: '06/02/2027', monthlyRevenue: '32.000.000đ',
    rating: 4.8, ratingCount: 130, foodSafetyCert: 'Đạt chuẩn VietGAP', notes: 'Rau sạch có tem truy xuất nguồn gốc QR.'
  },
  {
    id: 'B02', code: 'B02', name: 'Trái cây nhiệt đới Bến Tre', merchant: 'Võ Minh Trí', phone: '0908 445 667',
    category: 'Trái cây', zone: 'B', zoneName: 'Khu B — Rau củ & Trái cây', status: 'complaint',
    complaintsCount: 1, complaintList: [{ id: 'cp-b02-1', text: 'Xe đẩy hàng chắn lối đi phụ B-C', time: 'Hôm nay 09:10', status: 'Chưa xử lý' }],
    daysLeftContract: 240, contractExpiry: '27/04/2027', monthlyRevenue: '45.000.000đ', rating: 4.6, ratingCount: 105,
    foodSafetyCert: 'Còn hiệu lực', notes: 'Nhập bưởi da xanh và sầu riêng Ri6 chính gốc.'
  },
  {
    id: 'B07', code: 'B07', name: 'Rau sạch Mộc Châu', merchant: 'Trần Văn Tuấn', phone: '0975 889 900',
    category: 'Rau củ', zone: 'B', zoneName: 'Khu B — Rau củ & Trái cây', status: 'expiring',
    complaintsCount: 0, daysLeftContract: 12, contractExpiry: '11/09/2026', monthlyRevenue: '29.000.000đ',
    rating: 4.8, ratingCount: 92, foodSafetyCert: 'Đạt chuẩn VietGAP', notes: 'Hợp đồng sắp hết hạn (12 ngày).'
  },
  {
    id: 'B10', code: 'B10', name: 'Trái cây sạch Miền Tây', merchant: 'Chờ chuyển nhượng', phone: '-',
    category: 'Trái cây', zone: 'B', zoneName: 'Khu B — Rau củ & Trái cây', status: 'empty',
    complaintsCount: 0, daysLeftContract: 0, contractExpiry: '-', monthlyRevenue: '0đ',
    rating: 0, ratingCount: 0, foodSafetyCert: 'Chờ cấp', notes: 'Đang có hồ sơ chuyển nhượng của bà Lê Thu Hương chờ phê duyệt.'
  },

  // --- KHU C: THỰC PHẨM KHÔ & GIA VỊ ---
  {
    id: 'C02', code: 'C02', name: 'Gia vị & Đồ khô Bà Lan', merchant: 'Đỗ Thị Lan', phone: '0912 667 889',
    category: 'Gia vị', zone: 'C', zoneName: 'Khu C — Nhu yếu phẩm', status: 'complaint',
    complaintsCount: 1, complaintList: [{ id: 'cp-c02-1', text: 'Không niêm yết giá bán theo quy định chợ', time: 'Hôm nay 09:40', status: 'Chưa xử lý' }],
    daysLeftContract: 290, contractExpiry: '16/06/2027', monthlyRevenue: '36.000.000đ', rating: 4.4, ratingCount: 80,
    foodSafetyCert: 'Còn hiệu lực', notes: 'Đội quản lý giá đã lập biên bản nhắc nhở niêm yết giá.'
  },
  {
    id: 'C05', code: 'C05', name: 'Dầu ăn & Nước mắm Phan Thiết', merchant: 'Đặng Ngọc Anh', phone: '0937 665 544',
    category: 'Gia vị', zone: 'C', zoneName: 'Khu C — Nhu yếu phẩm', status: 'maintenance',
    complaintsCount: 0, daysLeftContract: 175, contractExpiry: '21/02/2027', monthlyRevenue: '28.000.000đ',
    rating: 4.7, ratingCount: 65, foodSafetyCert: 'Bổ sung ATTP', notes: 'Đang gia cố lại kệ đỡ hàng tải trọng cao.'
  },
  {
    id: 'C08', code: 'C08', name: 'Bánh kẹo & Mứt truyền thống', merchant: 'Trần Đình Trọng', phone: '0983 445 566',
    category: 'Bánh kẹo', zone: 'C', zoneName: 'Khu C — Nhu yếu phẩm', status: 'expiring',
    complaintsCount: 0, daysLeftContract: 6, contractExpiry: '05/09/2026', monthlyRevenue: '33.000.000đ',
    rating: 4.6, ratingCount: 78, foodSafetyCert: 'Còn hiệu lực', notes: 'Hạn hợp đồng còn 6 ngày (nguy cấp), cần tái ký gấp.'
  }
];

export const RECENT_ACTIVITIES = [
  { id: 'act-01', time: '10:42', type: 'complaint', text: 'Tiếp nhận phản ánh nước tràn sạp A12 từ khách hàng', user: 'Tổng đài viên 02' },
  { id: 'act-02', time: '10:30', type: 'contract', text: 'Tiểu thương sạp B07 gửi hồ sơ xin gia hạn thuê 12 tháng', user: 'Bộ phận Mặt bằng' },
  { id: 'act-03', time: '10:15', type: 'maintenance', text: 'Đội điện nước hoàn thành sửa chữa đường ống sạp A03', user: 'Kỹ thuật viên Tuấn' },
  { id: 'act-04', time: '09:50', type: 'alert', text: 'Cảnh báo tự động: Cống thoát nước dãy A bốc mùi liên tiếp 3 ngày', user: 'Hệ thống Cảm biến IoT' },
  { id: 'act-05', time: '09:20', type: 'fee', text: 'Sạp A05 thanh toán thành công phí dịch vụ tháng 8 qua QR Code', user: 'Cổng thanh toán SmartPay' }
];

export const MARKET_FEE_COLLECTION = {
  totalTarget: '240.000.000đ',
  collected: '223.200.000đ',
  percentage: 93,
  uncollectedCount: 14,
  overdueCount: 4,
  overdueAmount: '16.800.000đ',
  breakdown: [
    { zone: 'Khu A (Tươi sống)', target: '95.000.000đ', collected: '88.350.000đ', rate: 93 },
    { zone: 'Khu B (Rau quả)', target: '75.000.000đ', collected: '71.250.000đ', rate: 95 },
    { zone: 'Khu C (Nhu yếu phẩm)', target: '70.000.000đ', collected: '63.600.000đ', rate: 90 }
  ]
};
