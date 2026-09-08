'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  Users2,
  Store,
  Receipt,
  Box,
  Clock,
  ChevronDown,
  Calendar,
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  FileText,
  Phone,
  PhoneCall,
  Radio,
  ShieldCheck,
  ShieldAlert,
  Droplets,
  Scale,
  ShoppingBag,
  Flame,
  Wrench,
  Coins,
  Check,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import MarketFeeCollectionSection from './MarketFeeCollectionSection';
import DonutChartSvg from './DonutChartSvg';
import type {
  DonutSegment,
  ShopFinancialMetric,
  RevenueAnomaly,
  SlaMetricReport
} from '@/types/dashboard';

interface LiveDashboardOverviewProps {
  onNavigateToMap: (stallCode?: string) => void;
  onNavigateToProfiles?: () => void;
  dispatchedStalls?: Record<string, { teamName: string; status: string }>;
  onQuickDispatch?: (stallId: string, teamName: string) => void;
}

export interface ComplaintItem {
  id: string;
  code: string;
  stallId: string;
  stallName: string;
  merchantName: string;
  phone: string;
  zone: string;
  title: string;
  description: string;
  severity: 'Khẩn cấp' | 'Trật tự' | 'Cơ sở hạ tầng';
  severityLevel: 'P0' | 'P1' | 'P2';
  reporter: string;
  time: string;
  coordinator: {
    name: string;
    role: string;
    phone: string;
  };
}

// 15 sự cố PAKN phân thành 3 nhóm theo ma trận ưu tiên vận hành: Khẩn cấp (Gian lận & ATTP), Trật tự, Cơ sở hạ tầng
export const COMPLAINT_GROUPS: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  priorityTag: string;
  count: number;
  items: ComplaintItem[];
}[] = [
  {
    id: 'food_safety_fraud',
    title: 'Gian Lận & An Toàn Thực Phẩm',
    subtitle: 'Mức khẩn cấp (SLA < 15 phút)',
    icon: Flame,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    priorityTag: 'Khẩn cấp',
    count: 3,
    items: [
      {
        id: 'c1',
        code: 'PAKN-2026-075',
        stallId: 'D900-06',
        stallName: 'Gian hàng gia vị & Hạt nêm Tây Bắc',
        merchantName: 'Phạm Khánh Linh',
        phone: '0983 124 888',
        zone: 'Khu Thực phẩm tươi 1',
        title: 'Gian hàng gia vị: Hàng không tem mác nguồn gốc xuất xứ (PAKN #075)',
        description: 'Khách hàng phản ánh phát hiện nhiều bao hạt nêm và gia vị khô không có nhãn phụ tiếng Việt, thiếu hạn sử dụng và thiếu tem chứng nhận an toàn thực phẩm.',
        severity: 'Khẩn cấp',
        severityLevel: 'P0',
        reporter: 'Khách mua hàng & Tổ QLTT',
        time: '15 phút trước',
        coordinator: {
          name: 'Nguyễn Hoàng Long',
          role: 'Đội trưởng An ninh & QLTT Khu Thực Phẩm',
          phone: '0904.777.999'
        }
      },
      {
        id: 'c2',
        code: 'PAKN-2026-081',
        stallId: 'D900-01',
        stallName: 'Thịt bò sạch & Thực phẩm tươi Minh Quân',
        merchantName: 'Trần Văn Mạnh',
        phone: '0912 888 111',
        zone: 'Khu Thực phẩm tươi 1',
        title: 'Dấu hiệu cân sai lệch 15% khi kiểm tra đột xuất thịt bò tươi',
        description: 'Ban Kiểm Tra Giá phát hiện quả cân điện tử tại sạp D900-01 sai lệch +150g trên mỗi 1kg hàng bán ra. Đề nghị lập biên bản và niêm phong cân đối chứng.',
        severity: 'Khẩn cấp',
        severityLevel: 'P0',
        reporter: 'Ban Kiểm Tra Giá',
        time: '35 phút trước',
        coordinator: {
          name: 'Nguyễn Hoàng Long',
          role: 'Đội trưởng An ninh & QLTT Khu Thực Phẩm',
          phone: '0904.777.999'
        }
      },
      {
        id: 'c3',
        code: 'PAKN-2026-084',
        stallId: 'D260802V1-S10',
        stallName: 'Thủy hải sản tươi sống Quang Huy',
        merchantName: 'Nguyễn Quang Huy',
        phone: '0978 999 222',
        zone: 'Khu Thực phẩm tươi 1',
        title: 'Xô xát to tiếng, tranh giành khách cản trở lối đi công cộng',
        description: 'Hai nhân viên tại sạp xô xát to tiếng với khách hàng về giá cá hồi, gây tụ tập đông người cản trở lối đi chung. Cần tổ phản ứng nhanh giải tán.',
        severity: 'Khẩn cấp',
        severityLevel: 'P0',
        reporter: 'Tổ Trật Tự Chợ',
        time: '20 phút trước',
        coordinator: {
          name: 'Nguyễn Hoàng Long',
          role: 'Đội trưởng An ninh & QLTT Khu Thực Phẩm',
          phone: '0904.777.999'
        }
      }
    ]
  },
  {
    id: 'order_space',
    title: 'Trật Tự & Quy Chế Mặt Bằng',
    subtitle: 'Mức cần xử lý (SLA < 2 giờ)',
    icon: Scale,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    priorityTag: 'Trật tự',
    count: 4,
    items: [
      {
        id: 'c4',
        code: 'PAKN-2026-088',
        stallId: 'A-01',
        stallName: 'Rau củ hữu cơ Đà Lạt',
        merchantName: 'Trần Thị Lan',
        phone: '0978 654 321',
        zone: 'Khu A — Rau củ quả',
        title: 'Dựng dù bạt che khuất tầm nhìn biển chỉ dẫn an toàn PCCC',
        description: 'Chủ sạp dựng thêm mái che dù bạt vươn ra ngoài 1.2m, che khuất hoàn toàn hộp họng nước chữa cháy vách tường và biển thoát hiểm số 1.',
        severity: 'Trật tự',
        severityLevel: 'P1',
        reporter: 'Ban Quản Lý Chợ',
        time: '50 phút trước',
        coordinator: {
          name: 'Trần Văn Hùng',
          role: 'Tổ trưởng Phản ứng nhanh Khu A',
          phone: '0912.888.666'
        }
      },
      {
        id: 'c5',
        code: 'PAKN-2026-090',
        stallId: 'D04-05',
        stallName: 'Gạo ST25 & Nông sản Việt',
        merchantName: 'Đỗ Thu Trang',
        phone: '0936 789 456',
        zone: 'Khu Nông sản 2',
        title: 'Tập kết thùng hàng và bao tải lấn chiếm 0.8m lối đi bộ',
        description: 'Hàng chục bao gạo và thùng nông sản xếp lấn quá vạch sơn ranh giới sạp 0.8m, người đi bộ phải lách qua khó khăn.',
        severity: 'Trật tự',
        severityLevel: 'P1',
        reporter: 'Lê Hoàng Nam',
        time: '1 giờ trước',
        coordinator: {
          name: 'Lê Văn Khoa',
          role: 'Tổ trưởng Kỹ thuật & Hạ tầng',
          phone: '0936.555.222'
        }
      },
      {
        id: 'c6',
        code: 'PAKN-2026-092',
        stallId: 'D04-07',
        stallName: 'Trà sen & Đặc sản Hà Nội',
        merchantName: 'Vũ Đức Thịnh',
        phone: '0988 234 567',
        zone: 'Khu Đặc sản 3',
        title: 'Kê thêm quầy phụ trưng bày ngoài phạm vi vạch sơn phân định',
        description: 'Sạp tự ý kê thêm tủ kính mini bày mẫu trà ngoài ranh giới cho thuê đã được ký trong hợp đồng mặt bằng.',
        severity: 'Trật tự',
        severityLevel: 'P1',
        reporter: 'Tổ Trật Tự',
        time: '2 giờ trước',
        coordinator: {
          name: 'Lê Văn Khoa',
          role: 'Tổ trưởng Kỹ thuật & Hạ tầng',
          phone: '0936.555.222'
        }
      },
      {
        id: 'c7',
        code: 'PAKN-2026-095',
        stallId: 'CỔNG-BẮC',
        stallName: 'Khu vực Cổng Phố Hàng Khoai',
        merchantName: 'Đội bốc dỡ hàng hóa',
        phone: '0915 678 999',
        zone: 'Khu Hàng thiết yếu 4',
        title: 'Xe đẩy bốc dỡ hàng đỗ sai vị trí cản trở cửa thoát hiểm',
        description: '3 xe đẩy chở thùng carton để chắn ngang cửa thông gió và lối tiếp cận xe cấp cứu cổng phía Bắc.',
        severity: 'Trật tự',
        severityLevel: 'P1',
        reporter: 'Tổ Bảo Vệ',
        time: '3 giờ trước',
        coordinator: {
          name: 'Trần Văn Hùng',
          role: 'Tổ trưởng Phản ứng nhanh Khu A',
          phone: '0912.888.666'
        }
      }
    ]
  },
  {
    id: 'sanitation_infra',
    title: 'Hạ Tầng & Vệ Sinh Môi Trường',
    subtitle: 'Mức hạ tầng cơ sở (SLA trong ca / 24h)',
    icon: Wrench,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    priorityTag: 'Cơ sở hạ tầng',
    count: 8,
    items: [
      {
        id: 'c8',
        code: 'PAKN-2026-096',
        stallId: 'A-02',
        stallName: 'Trái cây sạch Miền Tây',
        merchantName: 'Lê Hoàng Nam',
        phone: '0904 567 890',
        zone: 'Khu A — Rau củ quả',
        title: 'Nước tràn lối đi trước sạp A-02 do rò rỉ đường ống thoát sàn',
        description: 'Đường ống dẫn thoát nước sàn phía sau sạp A-02 bị cặn rác nghẹt khiến nước tràn nhẹ ra lối đi chung gây ẩm ướt trơn trượt.',
        severity: 'Cơ sở hạ tầng',
        severityLevel: 'P2',
        reporter: 'Ban Kiểm Tra',
        time: '25 phút trước',
        coordinator: {
          name: 'Lê Văn Khoa',
          role: 'Tổ trưởng Kỹ thuật & Hạ tầng',
          phone: '0936.555.222'
        }
      },
      {
        id: 'c9',
        code: 'PAKN-2026-098',
        stallId: 'D900-03',
        stallName: 'Hải sản tươi sống Minh Quang',
        merchantName: 'Nguyễn Văn Minh',
        phone: '0912 345 678',
        zone: 'Khu Thực phẩm tươi 1',
        title: 'Mùi hôi rãnh thoát nước sau sạp D900-03 cần nạo vét khử mùi',
        description: 'Rãnh thu gom nước thải cá tôm đọng cặn hữu cơ bốc mùi khó chịu trong bán kính 5m. Cần tổ môi trường phun dung dịch khử khuẩn.',
        severity: 'Cơ sở hạ tầng',
        severityLevel: 'P2',
        reporter: 'Tiểu thương lân cận',
        time: '40 phút trước',
        coordinator: {
          name: 'Lê Văn Khoa',
          role: 'Tổ trưởng Kỹ thuật & Hạ tầng',
          phone: '0936.555.222'
        }
      },
      {
        id: 'c10',
        code: 'PAKN-2026-101',
        stallId: 'A-05',
        stallName: 'Kho phụ & Cửa thoát hiểm 2',
        merchantName: 'Tổ Vệ Sinh Chợ',
        phone: '0945 111 222',
        zone: 'Khu A — Rau củ quả',
        title: 'Ứ đọng rác thải hữu cơ tại cửa thoát hiểm số 2 cần thu gom',
        description: 'Thùng rác hữu cơ đầy tràn nắp chưa được xe ép rác chuyên dụng chuyển đi trong ca sáng, cần điều xe rác tăng cường.',
        severity: 'Cơ sở hạ tầng',
        severityLevel: 'P2',
        reporter: 'Tổ Vệ Sinh',
        time: '1 giờ trước',
        coordinator: {
          name: 'Lê Văn Khoa',
          role: 'Tổ trưởng Kỹ thuật & Hạ tầng',
          phone: '0936.555.222'
        }
      },
      {
        id: 'c11',
        code: 'PAKN-2026-103',
        stallId: 'D900-08',
        stallName: 'Thực phẩm chế biến đóng gói',
        merchantName: 'Trần Văn Hưng',
        phone: '0966 333 444',
        zone: 'Khu Thực phẩm tươi 1',
        title: 'Đèn LED chiếu sáng hành lang phân khu 1 chập chờn',
        description: 'Bóng đèn tuýp LED số 04 hành lang giữa chập chờn nhấp nháy, ánh sáng không đủ cho khách đi lại.',
        severity: 'Cơ sở hạ tầng',
        severityLevel: 'P2',
        reporter: 'Trần Văn Hưng',
        time: '2 giờ trước',
        coordinator: {
          name: 'Lê Văn Khoa',
          role: 'Tổ trưởng Kỹ thuật & Hạ tầng',
          phone: '0936.555.222'
        }
      },
      {
        id: 'c12',
        code: 'PAKN-2026-105',
        stallId: 'D04-06',
        stallName: 'Nông sản sấy khô Hà Nam',
        merchantName: 'Hoàng Kim Oanh',
        phone: '0915 678 123',
        zone: 'Khu Nông sản 2',
        title: 'Rò rỉ van vòi nước rửa tay chung khu vực nông sản',
        description: 'Van khóa vòi inox bồn rửa tay số 2 bị rỉ nước liên tục, cần thợ cơ điện thay gioăng cao su chống thất thoát nước.',
        severity: 'Cơ sở hạ tầng',
        severityLevel: 'P2',
        reporter: 'Khách mua hàng',
        time: '2 giờ trước',
        coordinator: {
          name: 'Lê Văn Khoa',
          role: 'Tổ trưởng Kỹ thuật & Hạ tầng',
          phone: '0936.555.222'
        }
      },
      {
        id: 'c13',
        code: 'PAKN-2026-108',
        stallId: 'D04-10',
        stallName: 'Gia dụng & Thiết yếu Đồng Xuân',
        merchantName: 'Đặng Quốc Bảo',
        phone: '0982 444 555',
        zone: 'Khu Hàng thiết yếu 4',
        title: 'Quạt thông gió hành lang phía Nam phát tiếng ồn lớn',
        description: 'Quạt hút công nghiệp trục motor bị khô dầu phát ra tiếng rít lớn khi vận hành ở tốc độ cao.',
        severity: 'Cơ sở hạ tầng',
        severityLevel: 'P2',
        reporter: 'Đỗ Thu Trang',
        time: '3 giờ trước',
        coordinator: {
          name: 'Lê Văn Khoa',
          role: 'Tổ trưởng Kỹ thuật & Hạ tầng',
          phone: '0936.555.222'
        }
      },
      {
        id: 'c14',
        code: 'PAKN-2026-110',
        stallId: 'D04-08',
        stallName: 'Mật ong & Đặc sản Tây Bắc',
        merchantName: 'Lê Minh Tuấn',
        phone: '0973 555 666',
        zone: 'Khu Đặc sản 3',
        title: 'Mã QR truy xuất nguồn gốc gắn tại cột sạp bị mờ',
        description: 'Biển mica in mã QR truy xuất bị trầy xước góc, camera điện thoại khó nhận diện, cần in dán lại mã mới.',
        severity: 'Cơ sở hạ tầng',
        severityLevel: 'P2',
        reporter: 'Khách hàng',
        time: '4 giờ trước',
        coordinator: {
          name: 'Lê Văn Khoa',
          role: 'Tổ trưởng Kỹ thuật & Hạ tầng',
          phone: '0936.555.222'
        }
      },
      {
        id: 'c15',
        code: 'PAKN-2026-112',
        stallId: 'A-03',
        stallName: 'Rau xanh & Nấm tươi',
        merchantName: 'Nguyễn Thị Mai',
        phone: '0903 777 888',
        zone: 'Khu A — Rau củ quả',
        title: 'Khách góp ý nhân viên thanh toán chưa niềm nở',
        description: 'Khách hàng phản ánh nhân viên tính tiền chưa hướng dẫn quét mã chuyển khoản nhiệt tình trong giờ cao điểm.',
        severity: 'Cơ sở hạ tầng',
        severityLevel: 'P2',
        reporter: 'Nguyễn Thị Mai',
        time: '5 giờ trước',
        coordinator: {
          name: 'Trần Văn Hùng',
          role: 'Tổ trưởng Phản ứng nhanh Khu A',
          phone: '0912.888.666'
        }
      }
    ]
  }
];

// Danh sách sạp tiêu biểu theo phân khu
const SAMPLE_STALLS = [
  { code: 'D900-06', name: 'Gia vị & Hạt nêm Tây Bắc', zone: 'Khu Thực phẩm tươi 1', merchant: 'Phạm Khánh Linh', status: 'complaint', rent: 'Đang thuê', fee: 'Đã nộp' },
  { code: 'D900-03', name: 'Hải sản tươi sống Minh Quang', zone: 'Khu Thực phẩm tươi 1', merchant: 'Nguyễn Văn Minh', status: 'complaint', rent: 'Đang thuê', fee: 'Đã nộp' },
  { code: 'A-01', name: 'Rau củ hữu cơ Đà Lạt', zone: 'Khu A Rau củ', merchant: 'Trần Thị Lan', status: 'occupied', rent: 'Đang thuê', fee: 'Đã nộp' },
  { code: 'A-02', name: 'Trái cây sạch Miền Tây', zone: 'Khu A Rau củ', merchant: 'Lê Hoàng Nam', status: 'complaint', rent: 'Đang thuê', fee: 'Nợ phí 4.2tr' },
  { code: 'D04-05', name: 'Gạo ST25 & Nông sản Việt', zone: 'Khu Nông sản 2', merchant: 'Đỗ Thu Trang', status: 'occupied', rent: 'Đang thuê', fee: 'Đã nộp' },
  { code: 'D04-07', name: 'Trà sen & Đặc sản Hà Nội', zone: 'Khu Đặc sản 3', merchant: 'Vũ Đức Thịnh', status: 'occupied', rent: 'Đang thuê', fee: 'Nợ phí 3.8tr' },
  { code: 'D04-09', name: 'Bách hóa tổng hợp Đồng Xuân', zone: 'Khu Thiết yếu 4', merchant: 'Hoàng Kim Oanh', status: 'occupied', rent: 'Đang thuê', fee: 'Đã nộp' },
  { code: 'D900-04', name: 'Sạp trống sẵn sàng kinh doanh', zone: 'Khu Thực phẩm tươi 1', merchant: 'Chưa có', status: 'empty', rent: 'Trống', fee: '—' },
  { code: 'A-06', name: 'Sạp trống chuẩn bị bàn giao', zone: 'Khu A Rau củ', merchant: 'Chưa có', status: 'empty', rent: 'Trống', fee: '—' }
];

// Danh sách 19 hộ tiểu thương
const SAMPLE_TRADERS = [
  { id: 't1', name: 'Phạm Khánh Linh', stall: 'D900-06', category: 'Gia vị & Hàng khô', phone: '0983 124 ***', contractDays: 240, status: 'Hoàn tất hồ sơ' },
  { id: 't2', name: 'Nguyễn Văn Minh', stall: 'D900-03', category: 'Thực phẩm tươi sống', phone: '0912 345 ***', contractDays: 180, status: 'Hoàn tất hồ sơ' },
  { id: 't3', name: 'Trần Thị Lan', stall: 'A-01', category: 'Rau củ hữu cơ', phone: '0978 654 ***', contractDays: 320, status: 'Hoàn tất hồ sơ' },
  { id: 't4', name: 'Lê Hoàng Nam', stall: 'A-02', category: 'Trái cây sạch', phone: '0904 567 ***', contractDays: 28, status: 'Sắp hết hạn (28 ngày)' },
  { id: 't5', name: 'Đỗ Thu Trang', stall: 'D04-05', category: 'Nông sản & Lương thực', phone: '0936 789 ***', contractDays: 310, status: 'Hoàn tất hồ sơ' },
  { id: 't6', name: 'Vũ Đức Thịnh', stall: 'D04-07', category: 'Đặc sản vùng miền', phone: '0988 234 ***', contractDays: 15, status: 'Sắp hết hạn (15 ngày)' },
  { id: 't7', name: 'Hoàng Kim Oanh', stall: 'D04-09', category: 'Hàng thiết yếu', phone: '0915 678 ***', contractDays: 195, status: 'Hoàn tất hồ sơ' }
];

// Dữ liệu doanh thu theo Shop (đồng bộ nghiệp vụ từ staff sandbox)
const SAMPLE_SHOP_FINANCIALS: ShopFinancialMetric[] = [
  { stallId: 'D900-01', stallName: 'Thịt bò sạch Minh Quân', revenue: 68500000, cogs: 49000000, profit: 19500000, marginPercent: 28.5 },
  { stallId: 'D900-06', stallName: 'Gia vị & Hạt nêm Tây Bắc', revenue: 42300000, cogs: 28000000, profit: 14300000, marginPercent: 33.8 },
  { stallId: 'A-01', stallName: 'Rau củ hữu cơ Đà Lạt', revenue: 38900000, cogs: 26500000, profit: 12400000, marginPercent: 31.9 },
  { stallId: 'A-02', stallName: 'Trái cây sạch Miền Tây', revenue: 34200000, cogs: 24000000, profit: 10200000, marginPercent: 29.8 },
  { stallId: 'D04-05', stallName: 'Gạo ST25 & Nông sản Việt', revenue: 29800000, cogs: 22000000, profit: 7800000, marginPercent: 26.2 },
];

// Cảnh báo đối chiếu lệch doanh thu POS vs Cashless (từ staff sandbox)
const SAMPLE_REVENUE_ANOMALIES: RevenueAnomaly[] = [
  {
    stallId: 'D900-01',
    stallName: 'Thịt bò sạch & Thực phẩm tươi Minh Quân',
    posRevenue: 42500000,
    cashlessRevenue: 31000000,
    diffPercent: 27.1,
    severity: 'high',
    note: 'Chênh lệch dòng tiền POS so với quét QR lớn bất thường, nghi vấn dùng tài khoản cá nhân ngoài luồng.'
  },
  {
    stallId: 'D900-06',
    stallName: 'Gia vị & Hạt nêm Tây Bắc',
    posRevenue: 18200000,
    cashlessRevenue: 15100000,
    diffPercent: 17.0,
    severity: 'medium',
    note: 'Lệch biên độ doanh thu giữa ca sáng và ca chiều, cần đối chiếu lại hóa đơn bán lẻ.'
  },
  {
    stallId: 'A-02',
    stallName: 'Trái cây sạch Miền Tây',
    posRevenue: 25000000,
    cashlessRevenue: 23500000,
    diffPercent: 6.0,
    severity: 'low',
    note: 'Chênh lệch 6% nằm trong biên độ làm tròn tiền mặt thông thường.'
  }
];

// Đo lường chuẩn SLA xử lý phản ánh PAKN
const SAMPLE_SLA_REPORT: SlaMetricReport = {
  totalPending: 15,
  dueSoon: 3,
  overdue: 0,
  avgResponseMins: 12.4
};

function DetailStatCard({
  label,
  value,
  toneClass = 'text-[#172F55]',
  badge
}: {
  label: string;
  value: React.ReactNode;
  toneClass?: string;
  badge?: string;
}) {
  return (
    <div className="flex-1 min-w-[130px] border border-dashed border-[#D7E2EB] rounded-xl p-3 bg-white shadow-2xs hover:border-[#1974C8]/40 transition-colors">
      <div className="text-[11px] font-bold text-[#6D84A3] flex items-center justify-between gap-1">
        <span className="truncate">{label}</span>
        {badge && (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
            {badge}
          </span>
        )}
      </div>
      <div className={`text-lg sm:text-xl font-black font-mono mt-1 ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

export default function LiveDashboardOverview({
  onNavigateToMap,
  onNavigateToProfiles,
  dispatchedStalls = {},
  onQuickDispatch
}: LiveDashboardOverviewProps) {
  // Tab lọc dữ liệu tại chỗ (STT 2)
  const [activeKpiTab, setActiveKpiTab] = useState<'stalls' | 'traders' | 'complaints' | 'billing'>('stalls');
  const [ratingRange, setRatingRange] = useState<'7days' | '30days'>('7days');

  // Pop-up Modal mở nhanh sơ đồ chợ (STT 3)
  const [quickMapStall, setQuickMapStall] = useState<{ code: string; name: string; issue?: string } | null>(null);

  // Modal Chi Tiết Sự Cố & Lệnh Điều Phối Tức Thì (Yêu cầu mới)
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Trạng thái điều phối đồng bộ (Work Package C: Bidirectional Dispatch State)
  const [localDispatches, setLocalDispatches] = useState<Record<string, { teamName: string; status: string }>>({});
  const allDispatches = useMemo(() => ({
    ...dispatchedStalls,
    ...localDispatches
  }), [dispatchedStalls, localDispatches]);

  // Đóng modal bằng Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (quickMapStall) setQuickMapStall(null);
        if (selectedComplaint) {
          setSelectedComplaint(null);
          setDispatchSuccessMsg(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickMapStall, selectedComplaint]);

  return (
    <div className="space-y-4 font-sans pb-8 text-[#172F55]">
      {/* ========================================================================= */}
      {/* 1. KHUNG NHẮC VIỆC TỰ ĐỘNG BQL (ACTION TO-DO STRIP VẬN HÀNH) */}
      {/* ========================================================================= */}
      <div
        className="relative overflow-hidden rounded-xl px-4 py-4 sm:px-6 sm:py-5 text-white shadow-[0_14px_30px_rgba(11,122,58,0.18)]"
        style={{
          background: 'linear-gradient(115deg, #075A2B 0%, #0B7A3A 45%, #168DB2 100%)'
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/20">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black tracking-wider uppercase text-[#B9F4CA]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BẢN TIN VẬN HÀNH BQL • HÔM NAY</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1 leading-tight tracking-tight">
              Khung Nhắc Việc Tác Chiến & Điểm Nóng Cần Xử Lý
            </h2>
            <div className="text-[11px] text-[#B9F4CA]/90 font-bold mt-0.5">
              Tổng Quan Vận Hành — Chợ Đồng Xuân (Demo Live)
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-xs border border-white/25 text-white text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#B9F4CA]" />
              <span>Thứ 7, 05/09/2026</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToMap()}
              aria-label="Mở sơ đồ chợ tác chiến"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#0B672E] hover:bg-[#F1FFF5] text-xs font-black shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Mở sơ đồ chợ</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Khối Nhắc Việc Hành Động (Action To-do Strip: Khẩn cấp, Hạ tầng & Trật tự, Thu phí) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
          {/* TO-DO 1: SỰ CỐ KHẨN CẤP */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveKpiTab('complaints')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveKpiTab('complaints'); }}
            className="bg-white/10 hover:bg-white/18 border border-white/20 rounded-lg p-2.5 transition-colors cursor-pointer flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                3
              </div>
              <div>
                <div className="text-xs font-extrabold text-white">3 Phản ánh khẩn cấp</div>
                <div className="text-[10px] text-white/80">Gian lận & ATTP cần xử lý ngay</div>
              </div>
            </div>
            <span className="text-[11px] font-black text-[#B9F4CA] underline shrink-0">Xử lý ngay →</span>
          </div>

          {/* TO-DO 2: SỰ CỐ HẠ TẦNG & TRẬT TỰ */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveKpiTab('complaints')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveKpiTab('complaints'); }}
            className="bg-white/10 hover:bg-white/18 border border-white/20 rounded-lg p-2.5 transition-colors cursor-pointer flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                8
              </div>
              <div>
                <div className="text-xs font-extrabold text-white">8 Vấn đề hạ tầng & 4 Trật tự</div>
                <div className="text-[10px] text-white/80">Bảo trì & Trật tự trong ca</div>
              </div>
            </div>
            <span className="text-[11px] font-black text-[#B9F4CA] underline shrink-0">Điều phối →</span>
          </div>

          {/* TO-DO 3: THU PHÍ & CÔNG NỢ */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveKpiTab('billing')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveKpiTab('billing'); }}
            className="bg-white/10 hover:bg-white/18 border border-white/20 rounded-lg p-2.5 transition-colors cursor-pointer flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-400 text-slate-900 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                4
              </div>
              <div>
                <div className="text-xs font-extrabold text-white">4 Sạp đến hạn nộp phí</div>
                <div className="text-[10px] text-white/80">Nợ 16.8tr • 5 sắp hết hạn HĐ</div>
              </div>
            </div>
            <span className="text-[11px] font-black text-[#B9F4CA] underline shrink-0">Đôn đốc →</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-HEADER: SMART MARKET CMS — TỔNG QUAN */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
        <div>
          <div className="text-[11px] font-black text-[#1974C8] uppercase tracking-[1.45px]">
            SMART MARKET CMS
          </div>
          <h1 className="text-2xl sm:text-[28px] font-black text-[#172F55] tracking-tight leading-tight">
            Tổng quan chỉ số điều hành
          </h1>
          <p className="text-xs text-[#6D84A3]">
            Bấm từng thẻ chỉ số dưới đây để lọc nhanh dữ liệu tại chỗ (In-page Tab Filtering)
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E8F8EF] text-[#168F4B] text-xs font-extrabold border border-[#B9F4CA]/60">
            <span className="w-2 h-2 rounded-full bg-[#168F4B] animate-pulse"></span>
            <span>● Hệ thống đang hoạt động</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TÁI CẤU TRÚC 4 KHỐI CHỈ SỐ (BỘ ICON CHUẨN QUỐC TẾ & SOFT-SQUIRCLE GLASS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* CARD 1: SẠP HÀNG (Tab: 'stalls') */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Thẻ chỉ số sạp hàng"
          onClick={() => setActiveKpiTab('stalls')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveKpiTab('stalls'); }}
          className={`relative overflow-hidden bg-white rounded-2xl p-3 sm:p-4 transition-all cursor-pointer group border ${
            activeKpiTab === 'stalls'
              ? 'border-[#0B7A3A] ring-2 ring-[#0B7A3A]/20 shadow-[0_8px_20px_rgba(11,122,58,0.12)] bg-[#F0FAF3]'
              : 'border-[#DCE8F1] shadow-[0_4px_16px_rgba(42,72,108,0.05)] hover:border-[#55C477] hover:shadow-md'
          }`}
        >
          <div className="absolute -right-4 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-white/0 to-emerald-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5 relative z-10">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#E8F8EF] text-[#0B7A3A] ring-1 ring-inset ring-[#55C477]/40 shadow-[0_4px_16px_rgba(11,122,58,0.12)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl sm:text-2xl lg:text-[26px] font-black text-[#172F55] leading-none tracking-tight font-mono">
                24 / 50
              </div>
              <div className="text-xs sm:text-[13px] font-bold text-[#637B9C] mt-1 flex items-center justify-between">
                <span>Sạp hàng</span>
                {activeKpiTab === 'stalls' && (
                  <span className="text-[10px] text-[#0B7A3A] font-black bg-[#E8F8EF] px-1.5 py-0.5 rounded-md">
                    Đang xem
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] font-extrabold text-[#12934D] mt-0.5">
                ↑ 48% đang thuê (21 trống)
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: TIỂU THƯƠNG (Tab: 'traders') */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Thẻ chỉ số tiểu thương"
          onClick={() => setActiveKpiTab('traders')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveKpiTab('traders'); }}
          className={`relative overflow-hidden bg-white rounded-2xl p-3 sm:p-4 transition-all cursor-pointer group border ${
            activeKpiTab === 'traders'
              ? 'border-[#1974C8] ring-2 ring-[#1974C8]/20 shadow-[0_8px_20px_rgba(25,116,200,0.12)] bg-[#F0F7FD]'
              : 'border-[#DCE8F1] shadow-[0_4px_16px_rgba(42,72,108,0.05)] hover:border-[#82A9E6] hover:shadow-md'
          }`}
        >
          <div className="absolute -right-4 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-white/0 to-blue-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5 relative z-10">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#EFF6FF] text-[#1974C8] ring-1 ring-inset ring-[#82A9E6]/40 shadow-[0_4px_16px_rgba(25,116,200,0.12)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users2 className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl sm:text-2xl lg:text-[26px] font-black text-[#172F55] leading-none tracking-tight font-mono">
                19
              </div>
              <div className="text-xs sm:text-[13px] font-bold text-[#637B9C] mt-1 flex items-center justify-between">
                <span>Tiểu thương</span>
                {activeKpiTab === 'traders' && (
                  <span className="text-[10px] text-[#1974C8] font-black bg-blue-50 px-1.5 py-0.5 rounded-md">
                    Đang xem
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] font-extrabold text-[#1974C8] mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>19 đang kinh doanh</span>
                <span className="text-[#B45309] font-black bg-[#FEF3C7] px-1.5 py-0.2 rounded border border-[#FCD34D]/60 text-[10px]">
                  7 chờ duyệt
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: PHẢN ÁNH (Tab: 'complaints') */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Thẻ chỉ số phản ánh"
          onClick={() => setActiveKpiTab('complaints')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveKpiTab('complaints'); }}
          className={`relative overflow-hidden bg-white rounded-2xl p-3 sm:p-4 transition-all cursor-pointer group border ${
            activeKpiTab === 'complaints'
              ? 'border-[#D3484D] ring-2 ring-[#D3484D]/20 shadow-[0_8px_20px_rgba(211,72,77,0.12)] bg-[#FEF2F2]'
              : 'border-[#DCE8F1] shadow-[0_4px_16px_rgba(42,72,108,0.05)] hover:border-[#FDA4AF] hover:shadow-md'
          }`}
        >
          <div className="absolute -right-4 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-white/0 to-rose-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5 relative z-10">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#FFF1F2] text-[#D3484D] ring-1 ring-inset ring-[#FDA4AF]/40 shadow-[0_4px_16px_rgba(211,72,77,0.12)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl sm:text-2xl lg:text-[26px] font-black text-[#D3484D] leading-none tracking-tight font-mono">
                15
              </div>
              <div className="text-xs sm:text-[13px] font-bold text-[#637B9C] mt-1 flex items-center justify-between">
                <span>Phản ánh PAKN</span>
                {activeKpiTab === 'complaints' && (
                  <span className="text-[10px] text-[#D3484D] font-black bg-rose-50 px-1.5 py-0.5 rounded-md">
                    Đang xem
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] font-extrabold text-[#D3484D] mt-0.5">
                3 vụ khẩn cấp • 8 hạ tầng
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: THU PHÍ (Tab: 'billing') */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Thẻ chỉ số thu phí"
          onClick={() => setActiveKpiTab('billing')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveKpiTab('billing'); }}
          className={`relative overflow-hidden bg-white rounded-2xl p-3 sm:p-4 transition-all cursor-pointer group border ${
            activeKpiTab === 'billing'
              ? 'border-[#076C31] ring-2 ring-[#076C31]/20 shadow-[0_8px_20px_rgba(7,108,49,0.12)] bg-[#F0FAF4]'
              : 'border-[#DCE8F1] shadow-[0_4px_16px_rgba(42,72,108,0.05)] hover:border-[#55C477] hover:shadow-md'
          }`}
        >
          <div className="absolute -right-4 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-white/0 to-teal-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5 relative z-10">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#F0FDFA] text-[#0D9488] ring-1 ring-inset ring-[#99F6E4]/50 shadow-[0_4px_16px_rgba(13,148,136,0.12)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Coins className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg sm:text-xl lg:text-[22px] font-black text-[#172F55] leading-none tracking-tight font-mono">
                223.2 tr
              </div>
              <div className="text-xs sm:text-[13px] font-bold text-[#637B9C] mt-1 flex items-center justify-between">
                <span>Thu phí chợ</span>
                {activeKpiTab === 'billing' && (
                  <span className="text-[10px] text-[#076C31] font-black bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    Đang xem
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] font-extrabold text-[#12934D] mt-0.5">
                Đạt 93% (Nợ 16.8tr)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. KHU VỰC NỘI DUNG LỌC TẠI CHỖ (IN-PAGE TAB FILTERING CONTAINER) */}
      {/* ========================================================================= */}
      <div id="kpi-tab-container" className="bg-white rounded-xl border border-[#DCE8F1] p-4 sm:p-5 shadow-[0_10px_30px_rgba(42,72,108,0.055)] transition-all">
        {/* TAB 1: SẠP HÀNG */}
        {activeKpiTab === 'stalls' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE8F1]">
              <div>
                <h3 className="text-base font-black text-[#172F55] flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#0B7A3A]" />
                  <span>Quy Mô Sạp Hàng — 50 Sạp Chợ Đồng Xuân</span>
                </h3>
                <p className="text-xs text-[#7185A1] mt-0.5">
                  Phân bố 5 phân khu chức năng: 24 sạp đang thuê • 21 sạp trống • 5 sạp giữ chỗ
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToMap()}
                className="px-4 py-2 bg-[#0B7A3A] hover:bg-[#075A2B] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>Mở Sơ Đồ Không Gian Đầy Đủ</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Khối biểu đồ Donut & Chỉ số chi tiết sạp hàng (kết nối chuẩn từ staff sandbox) */}
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE8F1]">
              <DonutChartSvg
                data={[
                  { name: 'Đang thuê', value: 24, color: '#0B7A3A' },
                  { name: 'Trống', value: 21, color: '#94A3B8' },
                  { name: 'Bảo trì / Giữ chỗ', value: 5, color: '#F59E0B' },
                ]}
                centerValue="50"
                centerLabel="Tổng sạp"
                size={140}
              />
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                <DetailStatCard label="Đã thuê" value="24 sạp" toneClass="text-[#0B7A3A]" badge="48%" />
                <DetailStatCard label="Còn trống" value="21 sạp" toneClass="text-[#64748B]" badge="42%" />
                <DetailStatCard label="Bảo trì / Giữ chỗ" value="5 sạp" toneClass="text-[#D97706]" badge="10%" />
                <DetailStatCard label="Biến động tháng" value="↑ +8%" toneClass="text-[#059669]" badge="Tháng này" />
              </div>
            </div>

            {/* Bảng phân khu tóm tắt */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-semibold">
              <div className="p-2.5 rounded-lg bg-[#F5FAF8] border border-[#DCE8F1]">
                <div className="text-[10px] text-[#7185A1]">Khu A (Rau củ)</div>
                <div className="text-base font-black text-[#172F55] font-mono mt-0.5">10 sạp</div>
                <div className="text-[10px] text-emerald-600 font-bold">8 đang thuê</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5FAF8] border border-[#DCE8F1]">
                <div className="text-[10px] text-[#7185A1]">TP Tươi Sống 1</div>
                <div className="text-base font-black text-[#172F55] font-mono mt-0.5">10 sạp</div>
                <div className="text-[10px] text-emerald-600 font-bold">6 đang thuê</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5FAF8] border border-[#DCE8F1]">
                <div className="text-[10px] text-[#7185A1]">Nông Sản Chọn Lọc 2</div>
                <div className="text-base font-black text-[#172F55] font-mono mt-0.5">10 sạp</div>
                <div className="text-[10px] text-emerald-600 font-bold">5 đang thuê</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5FAF8] border border-[#DCE8F1]">
                <div className="text-[10px] text-[#7185A1]">Đặc Sản Địa Phương 3</div>
                <div className="text-base font-black text-[#172F55] font-mono mt-0.5">10 sạp</div>
                <div className="text-[10px] text-emerald-600 font-bold">3 đang thuê</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5FAF8] border border-[#DCE8F1] col-span-2 sm:col-span-1">
                <div className="text-[10px] text-[#7185A1]">Hàng Thiết Yếu 4</div>
                <div className="text-base font-black text-[#172F55] font-mono mt-0.5">10 sạp</div>
                <div className="text-[10px] text-emerald-600 font-bold">2 đang thuê</div>
              </div>
            </div>

            {/* Bảng danh sách sạp tiêu biểu */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE8F1] text-[#7185A1] font-bold">
                    <th className="py-2.5 px-3">Mã sạp</th>
                    <th className="py-2.5 px-3">Tên sạp & Ngành hàng</th>
                    <th className="py-2.5 px-3">Phân khu</th>
                    <th className="py-2.5 px-3">Tiểu thương</th>
                    <th className="py-2.5 px-3">Tình trạng</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE8F1]/60">
                  {SAMPLE_STALLS.map((s) => (
                    <tr key={s.code} className="hover:bg-[#F5FAF8] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-black text-[#172F55]">{s.code}</td>
                      <td className="py-2.5 px-3 font-bold text-[#172F55]">{s.name}</td>
                      <td className="py-2.5 px-3 text-[#7185A1]">{s.zone}</td>
                      <td className="py-2.5 px-3 text-[#172F55]">{s.merchant}</td>
                      <td className="py-2.5 px-3">
                        {s.status === 'complaint' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" /> Sự cố khẩn cấp
                          </span>
                        ) : s.status === 'empty' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">
                            Trống
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">
                            Đang hoạt động
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setQuickMapStall({ code: s.code, name: s.name, issue: s.status === 'complaint' ? 'Sự cố cần kiểm tra' : undefined })}
                          className="px-2.5 py-1 text-[11px] font-extrabold text-[#0B7A3A] bg-[#E8F8EF] hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                        >
                          Xem trên sơ đồ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: TIỂU THƯƠNG */}
        {activeKpiTab === 'traders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE8F1]">
              <div>
                <h3 className="text-base font-black text-[#172F55] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1974C8]" />
                  <span>Danh Bạ 19 Hộ Tiểu Thương Đang Kinh Doanh</span>
                </h3>
                <p className="text-xs text-[#7185A1] mt-0.5">
                  19 hộ hiện hữu đã ký hợp đồng thuê sạp • Có 7 hồ sơ mới đang chờ BQL phê duyệt
                </p>
              </div>
              {onNavigateToProfiles && (
                <button
                  type="button"
                  onClick={onNavigateToProfiles}
                  className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <span>Duyệt 7 hồ sơ chờ xử lý</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Khối biểu đồ Donut & Chỉ số chi tiết tiểu thương (kết nối chuẩn từ staff sandbox) */}
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE8F1]">
              <DonutChartSvg
                data={[
                  { name: 'Cố định (có sạp)', value: 19, color: '#1F78C7' },
                  { name: 'Chờ duyệt hồ sơ', value: 7, color: '#F59E0B' },
                ]}
                centerValue="19"
                centerLabel="Tiểu thương"
                size={140}
              />
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                <DetailStatCard label="Cố định (có sạp)" value="19 hộ" toneClass="text-[#1F78C7]" badge="Kinh doanh" />
                <DetailStatCard label="Vãng lai" value="0 hộ" toneClass="text-[#64748B]" badge="Ổn định" />
                <DetailStatCard label="Hồ sơ chờ duyệt" value="7 hồ sơ" toneClass="text-[#D97706]" badge="2 quá hạn" />
                <DetailStatCard label="Đã xác minh" value="100%" toneClass="text-[#059669]" badge="Đạt chuẩn" />
              </div>
            </div>

            {/* Khối liên kết hàng đợi thẩm định 7 hồ sơ */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#D97706] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                  7
                </div>
                <div>
                  <div className="text-xs font-bold text-[#92400E]">
                    Hàng đợi phê duyệt: 7 hồ sơ tiểu thương mới gửi từ Mini App (2 hồ sơ quá hạn SLA)
                  </div>
                  <div className="text-[11px] text-[#B45309]">
                    Gồm 4 hồ sơ đăng ký thuê sạp mới/chuyển nhượng và 3 hồ sơ xin gia hạn/bổ sung giấy tờ ATTP.
                  </div>
                </div>
              </div>
              {onNavigateToProfiles && (
                <button
                  type="button"
                  onClick={onNavigateToProfiles}
                  className="text-xs font-black text-[#92400E] hover:underline flex items-center gap-1 self-end sm:self-auto shrink-0 cursor-pointer"
                >
                  <span>Vào thẩm định ngay →</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE8F1] text-[#7185A1] font-bold">
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-3">Sạp kinh doanh</th>
                    <th className="py-2.5 px-3">Ngành hàng</th>
                    <th className="py-2.5 px-3">Điện thoại liên hệ</th>
                    <th className="py-2.5 px-3">Hạn hợp đồng</th>
                    <th className="py-2.5 px-3 text-right">Hồ sơ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE8F1]/60">
                  {SAMPLE_TRADERS.map((t) => (
                    <tr key={t.id} className="hover:bg-[#F5FAF8] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#172F55] flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1974C8]/10 text-[#1974C8] flex items-center justify-center font-bold text-xs">
                          {t.name.charAt(0)}
                        </div>
                        <span>{t.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0B7A3A]">{t.stall}</td>
                      <td className="py-2.5 px-3 text-[#7185A1]">{t.category}</td>
                      <td className="py-2.5 px-3 font-mono text-[#172F55]">{t.phone}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] font-bold ${t.contractDays <= 30 ? 'text-amber-600' : 'text-slate-600'}`}>
                          {t.contractDays} ngày
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700">
                          <CheckCircle2 className="w-3 h-3" /> {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PHẢN ÁNH (3 CẤP ĐỘ TÁC CHIẾN: P0 KHẨN CẤP, P1 TRẬT TỰ, P2 HẠ TẦNG) */}
        {activeKpiTab === 'complaints' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE8F1]">
              <div>
                <h3 className="text-base font-black text-[#172F55] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#D3484D]" />
                  <span>Hệ Thống 15 Sự Cố Phản Ánh PAKN — 3 Cấp Độ Tác Chiến</span>
                </h3>
                <p className="text-xs text-[#7185A1] mt-0.5">
                  Bấm vào từng sự cố để xem chi tiết đối tượng vi phạm và kết nối gọi trực tiếp cán bộ điều phối hiện trường
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  3 Khẩn cấp
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  4 Trật tự
                </span>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                  8 Hạ tầng
                </span>
              </div>
            </div>

            {/* Khối biểu đồ Donut & Chỉ số SLA phản ánh (kết nối chuẩn từ staff sandbox) */}
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE8F1]">
              <DonutChartSvg
                data={[
                  { name: 'Chưa xử lý', value: 15, color: '#D3484D' },
                  { name: 'Đã giải quyết (tuần)', value: 42, color: '#0B7A3A' },
                ]}
                centerValue="15"
                centerLabel="PAKN mở"
                size={140}
              />
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                <DetailStatCard label="Chưa xử lý" value="15 vụ" toneClass="text-[#D3484D]" badge="Trong ca" />
                <DetailStatCard label="Đã giải quyết" value="42 vụ" toneClass="text-[#0B7A3A]" badge="Tuần này" />
                <DetailStatCard label="Sắp đến hạn SLA" value="3 vụ" toneClass="text-[#D97706]" badge="< 15 phút" />
                <DetailStatCard label="Quá hạn SLA" value="0 vụ" toneClass="text-[#059669]" badge="Đúng chuẩn" />
              </div>
            </div>

            {/* 3 Cột Phân Nhóm Cấp Độ Nghiệp Vụ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              {COMPLAINT_GROUPS.map((group) => {
                const IconComp = group.icon;
                return (
                  <div key={group.id} className="rounded-2xl border border-[#DCE8F1] bg-[#F8FAFC]/70 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#DCE8F1]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-[#172F55] border border-[#DCE8F1]">
                          <IconComp className="w-4.5 h-4.5 text-[#172F55]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#172F55]">{group.title}</h4>
                          <div className="text-[10px] text-[#7185A1] font-medium">{group.subtitle}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${group.badgeColor}`}>
                        {group.count} vụ
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Chi tiết sự cố ${item.code} sạp ${item.stallId}`}
                          onClick={() => {
                            setSelectedComplaint(item);
                            setDispatchSuccessMsg(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedComplaint(item);
                              setDispatchSuccessMsg(null);
                            }
                          }}
                          className="p-3 rounded-xl bg-white border border-[#DCE8F1] shadow-2xs space-y-2 hover:border-[#1974C8] hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                Sạp {item.stallId}
                              </span>
                              <span className="font-mono font-bold text-[#7185A1]">
                                {item.code}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                                item.severityLevel === 'P0'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : item.severityLevel === 'P1'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-sky-100 text-sky-800 border-sky-200'
                              }`}
                            >
                              {item.severity}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-[#172F55] leading-snug group-hover:text-[#1974C8] transition-colors">
                            {item.title}
                          </p>

                          <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-[#DCE8F1] text-[10px]">
                            <span className="text-[#7185A1] truncate max-w-[120px]">
                              Báo bởi: {item.reporter}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickMapStall({ code: item.stallId, name: item.zone, issue: item.title });
                                }}
                                className="font-extrabold text-[#0B7A3A] hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>Sơ đồ</span>
                              </button>
                              {(() => {
                                const dispatchInfo =
                                  allDispatches[item.stallId] ||
                                  allDispatches[item.code] ||
                                  (item.stallId.startsWith('D900-') ? allDispatches[item.stallId.replace('D900-', 'B')] : null) ||
                                  (item.stallId.startsWith('A-') ? allDispatches[item.stallId.replace('A-', 'A')] : null) ||
                                  (item.stallId.startsWith('D04-') ? allDispatches[item.stallId.replace('D04-', 'D')] : null);

                                if (dispatchInfo) {
                                  return (
                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 text-[10px]">
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span>Đã điều phối ({dispatchInfo.teamName || 'Tổ An Ninh'})</span>
                                    </span>
                                  );
                                }

                                return (
                                  <span className="font-extrabold text-[#1974C8] group-hover:underline flex items-center gap-0.5">
                                    <PhoneCall className="w-3 h-3 text-[#1974C8]" />
                                    <span>Điều phối →</span>
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: THU PHÍ & TÀI CHÍNH TÁC CHIẾN */}
        {activeKpiTab === 'billing' && (
          <div className="space-y-5 pt-1">
            {/* 1. Biểu đồ Donut & Chỉ số thu phí (kết nối chuẩn từ staff sandbox) */}
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE8F1]">
              <DonutChartSvg
                data={[
                  { name: 'Đã thu', value: 223200000, color: '#0B7A3A' },
                  { name: 'Còn nợ', value: 16800000, color: '#D3484D' },
                ]}
                centerValue="93%"
                centerLabel="Thu phí"
                size={140}
              />
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                <DetailStatCard label="Tổng phải thu" value="240.0 tr" toneClass="text-[#172F55]" badge="Tháng 08" />
                <DetailStatCard label="Đã thu thực tế" value="223.2 tr" toneClass="text-[#0B7A3A]" badge="93%" />
                <DetailStatCard label="Còn nợ đôn đốc" value="16.8 tr" toneClass="text-[#D3484D]" badge="4 sạp nợ" />
                <DetailStatCard label="Lệch POS vs QR" value="3 sạp" toneClass="text-[#D97706]" badge="1 cảnh báo cao" />
              </div>
            </div>

            {/* 2. Cảnh báo đối chiếu bất thường doanh thu POS vs Cashless (từ staff sandbox) */}
            <div className="rounded-xl border border-[#DCE8F1] bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#DCE8F1]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#172F55] flex items-center gap-1.5">
                      <span>Cảnh Báo Đối Chiếu Doanh Thu Bất Thường (POS vs Cashless)</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {SAMPLE_REVENUE_ANOMALIES.filter((a) => a.severity === 'high').length} Cảnh báo cao
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#6D84A3]">
                      Tự động rà soát chênh lệch dòng tiền giữa máy POS tại quầy và cổng thanh toán QR/Không tiền mặt.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {SAMPLE_REVENUE_ANOMALIES.map((anomaly) => (
                  <div
                    key={anomaly.stallId}
                    className={`rounded-xl p-3.5 border transition-all ${
                      anomaly.severity === 'high'
                        ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                        : anomaly.severity === 'medium'
                        ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                        : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="font-bold text-[#172F55] truncate">
                        Sạp {anomaly.stallId}
                      </div>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                          anomaly.severity === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : anomaly.severity === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        Lệch {anomaly.diffPercent}%
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                      {anomaly.stallName}
                    </div>
                    <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-[11px] flex justify-between font-mono">
                      <span className="text-slate-500">POS: <strong>{(anomaly.posRevenue / 1000000).toFixed(1)}tr</strong></span>
                      <span className="text-slate-500">QR: <strong>{(anomaly.cashlessRevenue / 1000000).toFixed(1)}tr</strong></span>
                    </div>
                    {anomaly.note && (
                      <p className="text-[10px] text-slate-600 mt-2 line-clamp-2 italic">
                        "{anomaly.note}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Bảng Doanh Thu Theo Shop (Shop Financials từ staff sandbox) */}
            <div className="rounded-xl border border-[#DCE8F1] bg-white p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#DCE8F1]">
                <div>
                  <h4 className="text-sm font-black text-[#172F55] flex items-center gap-2">
                    <span>Doanh Thu & Hiệu Quả Kinh Doanh Theo Shop</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6D84A3] bg-slate-100 px-2 py-0.5 rounded-md">
                      <Info className="w-3 h-3 text-[#1974C8]" />
                      BQL & Cấp Tỉnh
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#6D84A3]">
                    Theo dõi doanh thu, giá vốn hàng bán và lợi nhuận gộp từng điểm sạp phục vụ điều phối và hỗ trợ tiểu thương.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#DCE8F1] text-[#7185A1] font-bold">
                      <th className="py-2.5 px-3">Mã sạp</th>
                      <th className="py-2.5 px-3">Tên sạp / Hộ kinh doanh</th>
                      <th className="py-2.5 px-3 text-right">Doanh thu</th>
                      <th className="py-2.5 px-3 text-right">Giá vốn (COGS)</th>
                      <th className="py-2.5 px-3 text-right">Lợi nhuận gộp</th>
                      <th className="py-2.5 px-3 text-right">Biên LN (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE8F1]/60">
                    {SAMPLE_SHOP_FINANCIALS.map((shop) => (
                      <tr key={shop.stallId} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-black text-[#172F55]">
                          {shop.stallId}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#172F55]">
                          {shop.stallName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1974C8]">
                          {new Intl.NumberFormat('vi-VN').format(shop.revenue)}đ
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#6D84A3]">
                          {shop.cogs ? `${new Intl.NumberFormat('vi-VN').format(shop.cogs)}đ` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-[#0B7A3A]">
                          {shop.profit ? `${new Intl.NumberFormat('vi-VN').format(shop.profit)}đ` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {shop.marginPercent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Nghiệp vụ thu nợ & biên lai */}
            <MarketFeeCollectionSection
              onOpenQuickMap={(stall) => setQuickMapStall(stall)}
              onNavigateToMap={onNavigateToMap}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. 3 THẺ NGHIỆP VỤ VẬN HÀNH TINH GỌN (STT 4: GỠ BỎ ĐỐI SOÁT QR THỦ CÔNG) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* 1. Thu phí & công nợ */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setActiveKpiTab('billing');
            document.getElementById('kpi-tab-container')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setActiveKpiTab('billing');
              document.getElementById('kpi-tab-container')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="bg-white rounded-xl border border-[#DCE8F1] border-t-[3px] border-t-[#0B7A3A] p-4 shadow-[0_10px_30px_rgba(42,72,108,0.055)] hover:-translate-y-0.5 transition-all cursor-pointer group hover:border-[#0B7A3A]/40"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0B7A3A]/10 text-[#0B7A3A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-[#173457]">Thu phí & công nợ</span>
            </div>
            <span className="text-[11px] font-bold text-[#0B7A3A] group-hover:underline flex items-center gap-0.5">
              <span>Mở tác chiến</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-[#7185A1] mt-1.5 min-h-[16px]">Kỳ thu, phải thu và số đã thu tháng 08/2026.</p>
          <div className="mt-3 pt-2.5 flex items-center gap-2">
            <div className="flex-1 border border-dashed border-[#D7E2EB] p-2 rounded-lg bg-[#F5FAF8]/50">
              <div className="text-[10px] text-[#7185A1] font-bold">Đã thu</div>
              <div className="text-xs font-black text-[#0B7A3A] font-mono mt-0.5">223.200.000đ</div>
            </div>
            <div className="flex-1 border border-dashed border-[#D7E2EB] p-2 rounded-lg bg-[#F5FAF8]/50">
              <div className="text-[10px] text-[#7185A1] font-bold">Còn nợ</div>
              <div className="text-xs font-black text-[#D3484D] font-mono mt-0.5">16.800.000đ</div>
            </div>
          </div>
        </div>

        {/* 2. Truy xuất nguồn gốc */}
        <div className="bg-white rounded-xl border border-[#DCE8F1] border-t-[3px] border-t-[#B87808] p-4 shadow-[0_10px_30px_rgba(42,72,108,0.055)] hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#B87808]/10 text-[#B87808] flex items-center justify-center shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <span className="text-sm font-black text-[#173457]">Truy xuất nguồn gốc</span>
          </div>
          <p className="text-[11px] text-[#7185A1] mt-1.5 min-h-[16px]">Mã QR sản phẩm và lượt quét công khai.</p>
          <div className="mt-3 pt-2.5 flex items-center gap-2">
            <div className="flex-1 border border-dashed border-[#D7E2EB] p-2 rounded-lg bg-[#F5FAF8]/50">
              <div className="text-[10px] text-[#7185A1] font-bold">Đã cấp QR</div>
              <div className="text-xs font-black text-[#B87808] font-mono mt-0.5">50 sản phẩm</div>
            </div>
            <div className="flex-1 border border-dashed border-[#D7E2EB] p-2 rounded-lg bg-[#F5FAF8]/50">
              <div className="text-[10px] text-[#7185A1] font-bold">Lượt quét</div>
              <div className="text-xs font-black text-[#173457] font-mono mt-0.5">1.420 lượt</div>
            </div>
          </div>
        </div>

        {/* 3. SLA xử lý PAKN */}
        <div className="bg-white rounded-xl border border-[#DCE8F1] border-t-[3px] border-t-[#D3484D] p-4 shadow-[0_10px_30px_rgba(42,72,108,0.055)] hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D3484D]/10 text-[#D3484D] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-sm font-black text-[#173457]">SLA xử lý PAKN</span>
          </div>
          <p className="text-[11px] text-[#7185A1] mt-1.5 min-h-[16px]">Quy chuẩn xử lý sự cố ≤ 15 phút.</p>
          <div className="mt-3 pt-2.5 flex items-center gap-2">
            <div className="flex-1 border border-dashed border-[#D7E2EB] p-2 rounded-lg bg-[#F5FAF8]/50">
              <div className="text-[10px] text-[#7185A1] font-bold">Sắp đến hạn</div>
              <div className="text-xs font-black text-[#D3484D] font-mono mt-0.5">0</div>
            </div>
            <div className="flex-1 border border-dashed border-[#D7E2EB] p-2 rounded-lg bg-[#F5FAF8]/50">
              <div className="text-[10px] text-[#7185A1] font-bold">Quá hạn</div>
              <div className="text-xs font-black text-[#D3484D] font-mono mt-0.5">0</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. 2 KHỐI BIỂU ĐỒ TRỰC QUAN (RATING & PAKN DONUT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* BIỂU ĐỒ 1: ĐÁNH GIÁ SẠP HÀNG (7 COLUMNS) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#DCE8F1] p-5 shadow-[0_10px_30px_rgba(42,72,108,0.055)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F1]">
            <h3 className="text-sm sm:text-base font-black text-[#172F55] tracking-tight">
              Đánh giá chất lượng sạp hàng
            </h3>
            <div className="flex items-center gap-1 bg-[#F5FAF8] p-0.5 rounded-lg border border-[#DCE8F1] text-xs font-bold">
              <button
                type="button"
                onClick={() => setRatingRange('7days')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  ratingRange === '7days' ? 'bg-white text-[#172F55] shadow-xs' : 'text-[#7185A1]'
                }`}
              >
                7 ngày qua
              </button>
              <button
                type="button"
                onClick={() => setRatingRange('30days')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  ratingRange === '30days' ? 'bg-white text-[#172F55] shadow-xs' : 'text-[#7185A1]'
                }`}
              >
                30 ngày
              </button>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="min-w-[150px] text-center sm:text-left">
              <div className="text-5xl sm:text-6xl font-black text-[#172F55] leading-none tracking-tighter font-mono">
                4.3
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1 text-[#FFAD1F] mt-2.5 text-xl">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span className="text-[#D7E2EC]">★</span>
              </div>
              <p className="text-xs text-[#5E7798] mt-2 font-medium">
                Tổng số đánh giá: <strong className="text-[#172F55] font-bold">798</strong>
              </p>
            </div>

            <div className="flex-1 w-full h-36 relative">
              <svg viewBox="0 0 350 120" className="w-full h-full overflow-visible">
                <line x1="25" y1="20" x2="345" y2="20" stroke="#E1EAF3" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="25" y1="55" x2="345" y2="55" stroke="#E1EAF3" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="25" y1="90" x2="345" y2="90" stroke="#E1EAF3" strokeWidth="1" strokeDasharray="3 3" />

                <text x="10" y="24" fontSize="10" fill="#7B92AF" fontWeight="bold">5</text>
                <text x="10" y="59" fontSize="10" fill="#7B92AF" fontWeight="bold">4</text>
                <text x="10" y="94" fontSize="10" fill="#7B92AF" fontWeight="bold">2</text>

                <polyline
                  fill="none"
                  stroke="#21A154"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="35,90 85,90 135,90 185,90 235,90 285,90 335,90"
                />

                {[35, 85, 135, 185, 235, 285, 335].map((cx, i) => (
                  <circle
                    key={i}
                    cx={cx}
                    cy={90}
                    r="4"
                    fill="#FFFFFF"
                    stroke="#21A154"
                    strokeWidth="3"
                  />
                ))}

                <text x="22" y="112" fontSize="10" fill="#7B92AF">30/08</text>
                <text x="72" y="112" fontSize="10" fill="#7B92AF">31/08</text>
                <text x="122" y="112" fontSize="10" fill="#7B92AF">01/09</text>
                <text x="172" y="112" fontSize="10" fill="#7B92AF">02/09</text>
                <text x="222" y="112" fontSize="10" fill="#7B92AF">03/09</text>
                <text x="272" y="112" fontSize="10" fill="#7B92AF">04/09</text>
                <text x="320" y="112" fontSize="10" fill="#7B92AF">05/09</text>
              </svg>
            </div>
          </div>
        </div>

        {/* BIỂU ĐỒ 2: PHẢN ÁNH & KHIẾU NẠI (5 COLUMNS: DONUT CHART) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#DCE8F1] p-5 shadow-[0_10px_30px_rgba(42,72,108,0.055)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8F1]">
            <h3 className="text-sm sm:text-base font-black text-[#172F55] tracking-tight">
              Tỷ lệ giải quyết PAKN
            </h3>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-[#55708F] bg-white px-2.5 py-1 rounded-lg border border-[#D9E5F1] shadow-2xs">
              <span>7 ngày qua</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <div
                className="w-36 h-36 rounded-full shadow-[0_14px_30px_rgba(40,70,100,0.12)] flex items-center justify-center"
                style={{
                  background:
                    'conic-gradient(#F0444D 0% 35%, #FFAE2E 35% 76%, #51C878 76% 95%, #42B4D4 95% 100%)'
                }}
              >
                <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center text-center shadow-xs">
                  <span className="text-[11px] text-[#6F84A0] font-bold">Tổng số</span>
                  <span className="text-2xl font-black text-[#172F55] leading-none font-mono">15</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-[#F0444D]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F0444D]"></span>
                  <span>Mới tiếp nhận</span>
                </span>
                <strong className="text-[#294463] font-mono font-black text-sm">15</strong>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-[#FFAE2E]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFAE2E]"></span>
                  <span>Đang xử lý</span>
                </span>
                <strong className="text-[#294463] font-mono font-black text-sm">7</strong>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-[#51C878]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#51C878]"></span>
                  <span>Đã phản hồi</span>
                </span>
                <strong className="text-[#294463] font-mono font-black text-sm">3</strong>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-[#42B4D4]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#42B4D4]"></span>
                  <span>Đã đóng</span>
                </span>
                <strong className="text-[#294463] font-mono font-black text-sm">0</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7.5. MODAL CHI TIẾT SỰ CỐ & ĐIỀU PHỐI HIỆN TRƯỜNG TỨC THÌ */}
      {/* ========================================================================= */}
      {selectedComplaint && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="complaint-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DCE8F1] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE8F1] bg-[#F5FAF8]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ${
                    selectedComplaint.severityLevel === 'P0'
                      ? 'bg-rose-50 text-rose-600 ring-rose-200'
                      : selectedComplaint.severityLevel === 'P1'
                      ? 'bg-amber-50 text-amber-600 ring-amber-200'
                      : 'bg-sky-50 text-sky-600 ring-sky-200'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#7185A1]">
                      {selectedComplaint.code}
                    </span>
                    <span
                      className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${
                        selectedComplaint.severityLevel === 'P0'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : selectedComplaint.severityLevel === 'P1'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-sky-100 text-sky-800 border-sky-300'
                      }`}
                    >
                      {selectedComplaint.severity}
                    </span>
                  </div>
                  <h3 id="complaint-modal-title" className="text-base font-black text-[#172F55] mt-0.5 leading-tight">
                    Chi Tiết Sự Cố & Lệnh Điều Phối
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedComplaint(null);
                  setDispatchSuccessMsg(null);
                }}
                aria-label="Đóng chi tiết sự cố"
                className="w-8 h-8 rounded-lg text-[#7185A1] hover:bg-slate-200/70 hover:text-[#172F55] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Thông báo phát lệnh điều động thành công */}
              {dispatchSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{dispatchSuccessMsg}</span>
                </div>
              )}

              {/* Khối Nội Dung Phản Ánh */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#DCE8F1] space-y-2">
                <div className="text-[11px] font-black text-[#1974C8] uppercase tracking-wider">
                  NỘI DUNG PHẢN ÁNH THỰC ĐỊA
                </div>
                <div className="font-extrabold text-[#172F55] text-sm leading-snug">
                  {selectedComplaint.title}
                </div>
                <p className="text-[#637B9C] leading-relaxed">
                  {selectedComplaint.description}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#DCE8F1] text-[11px] text-[#7185A1]">
                  <span>Người phản ánh: <strong className="text-[#172F55]">{selectedComplaint.reporter}</strong></span>
                  <span>Thời gian: <strong className="text-[#172F55]">{selectedComplaint.time}</strong></span>
                </div>
              </div>

              {/* Khối Thông Tin Đối Tượng Bị Phản Ánh */}
              <div className="p-3.5 rounded-xl bg-white border border-[#DCE8F1] shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#DCE8F1]">
                  <span className="text-[11px] font-black text-[#0B7A3A] uppercase tracking-wider">
                    ĐỐI TƯỢNG BỊ PHẢN ÁNH
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickMapStall({
                        code: selectedComplaint.stallId,
                        name: selectedComplaint.zone,
                        issue: selectedComplaint.title
                      });
                    }}
                    className="text-[11px] font-bold text-[#0B7A3A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Xem vị trí sạp trên sơ đồ</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#7185A1]">Sạp hàng:</span>{' '}
                    <strong className="font-mono text-rose-600 font-black">{selectedComplaint.stallId}</strong>
                  </div>
                  <div>
                    <span className="text-[#7185A1]">Phân khu:</span>{' '}
                    <strong className="text-[#172F55]">{selectedComplaint.zone}</strong>
                  </div>
                  <div>
                    <span className="text-[#7185A1]">Chủ hộ:</span>{' '}
                    <strong className="text-[#172F55]">{selectedComplaint.merchantName}</strong>
                  </div>
                  <div>
                    <span className="text-[#7185A1]">SĐT chủ sạp:</span>{' '}
                    <strong className="font-mono text-[#172F55]">{selectedComplaint.phone}</strong>
                  </div>
                </div>
              </div>

              {/* Khối Điều Phối Viên Phụ Trách Khu Vực */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#F5FAF8] to-[#EFF6FF] border border-[#BFDBFE] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[#1D63ED] uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#1D63ED]" />
                    <span>CÁN BỘ ĐIỀU PHỐI KHU VỰC</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    ● Đang trong ca trực
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div>
                    <div className="text-sm font-black text-[#172F55]">
                      {selectedComplaint.coordinator.name}
                    </div>
                    <div className="text-[11px] text-[#637B9C] font-medium">
                      {selectedComplaint.coordinator.role}
                    </div>
                  </div>
                  <div className="text-right font-mono text-sm font-black text-[#0B7A3A] bg-white px-2.5 py-1 rounded-lg border border-[#DCE8F1] shadow-2xs">
                    {selectedComplaint.coordinator.phone}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer: Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-5 py-3.5 border-t border-[#DCE8F1] bg-[#F5FAF8]">
              <button
                type="button"
                onClick={() => {
                  setSelectedComplaint(null);
                  setDispatchSuccessMsg(null);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#DCE8F1] bg-white text-xs font-bold text-[#172F55] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setDispatchSuccessMsg(
                      `Đã phát lệnh điều động tới bộ đàm của Đ/c ${selectedComplaint.coordinator.name}! Trạng thái chuyển sang: Đang xử lý tại hiện trường.`
                    );
                    setLocalDispatches((prev) => ({
                      ...prev,
                      [selectedComplaint.stallId]: { teamName: selectedComplaint.coordinator.name, status: 'in_progress' },
                      [selectedComplaint.code]: { teamName: selectedComplaint.coordinator.name, status: 'in_progress' }
                    }));
                    if (onQuickDispatch) {
                      onQuickDispatch(selectedComplaint.stallId, selectedComplaint.coordinator.name);
                    }
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Phát lệnh điều động</span>
                </button>

                <a
                  href={`tel:${selectedComplaint.coordinator.phone.replace(/[^0-9]/g, '')}`}
                  onClick={() => {
                    setDispatchSuccessMsg(
                      `Đang kết nối cuộc gọi thoại tới Đ/c ${selectedComplaint.coordinator.name} (${selectedComplaint.coordinator.phone})...`
                    );
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#0B7A3A] hover:bg-[#075A2B] text-white text-xs font-black transition-transform hover:-translate-y-0.5 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 animate-bounce" />
                  <span>Gọi người điều phối ngay</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. POP-UP MODAL MỞ NHANH SƠ ĐỒ CHỢ (STT 3: QUICK MAP POPUP MODAL) */}
      {/* ========================================================================= */}
      {quickMapStall && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-map-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-[#DCE8F1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE8F1] bg-[#F5FAF8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B7A3A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="quick-map-modal-title" className="text-base font-black text-[#172F55] flex items-center gap-2">
                    <span>Vị Trí Sạp {quickMapStall.code}</span>
                    <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      Ghim vi phạm
                    </span>
                  </h3>
                  <p className="text-xs text-[#7185A1] mt-0.5">
                    {quickMapStall.name} • Tầng 1 Chợ Đồng Xuân
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickMapStall(null)}
                aria-label="Đóng pop-up sơ đồ sạp"
                className="w-8 h-8 rounded-lg text-[#7185A1] hover:bg-slate-200/70 hover:text-[#172F55] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Sơ đồ tương tác thu nhỏ có ghim sạp */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {quickMapStall.issue && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black">Nội dung phản ánh cần kiểm tra:</span> {quickMapStall.issue}
                  </div>
                </div>
              )}

              {/* Sơ đồ mặt bằng vector trực quan với sạp được ghim nổi bật */}
              <div className="relative w-full h-64 sm:h-72 bg-[#F5FAF8] rounded-xl border border-[#DCE8F1] overflow-hidden flex items-center justify-center p-3">
                <svg viewBox="0 0 600 300" className="w-full h-full object-contain">
                  {/* Cổng chính Phố Hàng Khoai */}
                  <rect x="180" y="10" width="240" height="24" rx="4" fill="#172F55" />
                  <text x="300" y="26" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                    CỔNG BẮC • PHỐ HÀNG KHOAI
                  </text>

                  {/* Khu A */}
                  <rect x="20" y="50" width="160" height="220" rx="8" fill="#E8F8EF" stroke="#5CBD68" strokeWidth="1.5" />
                  <text x="100" y="70" textAnchor="middle" fill="#0B7A3A" fontSize="11" fontWeight="bold">
                    Khu A (Rau củ quả)
                  </text>

                  {/* Khu Thực phẩm tươi 1 */}
                  <rect x="200" y="50" width="200" height="220" rx="8" fill="#FFF9E6" stroke="#FFA834" strokeWidth="1.5" />
                  <text x="300" y="70" textAnchor="middle" fill="#B87808" fontSize="11" fontWeight="bold">
                    Khu Thực Phẩm Tươi 1
                  </text>

                  {/* Khu Nông sản & Thiết yếu */}
                  <rect x="420" y="50" width="160" height="220" rx="8" fill="#EFF6FF" stroke="#82A9E6" strokeWidth="1.5" />
                  <text x="500" y="70" textAnchor="middle" fill="#1974C8" fontSize="11" fontWeight="bold">
                    Khu Nông Sản & Thiết Yếu
                  </text>

                  {/* Các ô sạp mô phỏng */}
                  {/* Sạp thông thường */}
                  <rect x="40" y="90" width="50" height="35" rx="4" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="65" y="112" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="bold">A-01</text>

                  <rect x="110" y="90" width="50" height="35" rx="4" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="135" y="112" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="bold">A-02</text>

                  <rect x="220" y="90" width="65" height="35" rx="4" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="252" y="112" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="bold">D900-01</text>

                  <rect x="310" y="90" width="65" height="35" rx="4" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="342" y="112" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="bold">D900-03</text>

                  <rect x="220" y="145" width="65" height="35" rx="4" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="252" y="167" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="bold">D900-06</text>

                  <rect x="310" y="145" width="65" height="35" rx="4" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="342" y="167" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="bold">D900-08</text>

                  <rect x="440" y="90" width="55" height="35" rx="4" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="467" y="112" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="bold">D04-05</text>

                  <rect x="510" y="90" width="55" height="35" rx="4" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="537" y="112" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="bold">D04-07</text>

                  {/* GHIM SẠP MỤC TIÊU VỚI RADAR BEACON ĐỎ NHẤP NHÁY */}
                  {quickMapStall.code === 'D900-06' ? (
                    <g transform="translate(220, 145)">
                      <rect x="0" y="0" width="65" height="35" rx="4" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2.5" />
                      <text x="32" y="22" textAnchor="middle" fill="#991B1B" fontSize="10" fontWeight="900">D900-06</text>
                      <circle cx="32" cy="0" r="10" fill="#EF4444" opacity="0.3" className="animate-ping" />
                      <circle cx="32" cy="0" r="5" fill="#DC2626" />
                    </g>
                  ) : quickMapStall.code === 'D900-03' ? (
                    <g transform="translate(310, 90)">
                      <rect x="0" y="0" width="65" height="35" rx="4" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2.5" />
                      <text x="32" y="22" textAnchor="middle" fill="#991B1B" fontSize="10" fontWeight="900">D900-03</text>
                      <circle cx="32" cy="0" r="10" fill="#EF4444" opacity="0.3" className="animate-ping" />
                      <circle cx="32" cy="0" r="5" fill="#DC2626" />
                    </g>
                  ) : quickMapStall.code === 'A-02' ? (
                    <g transform="translate(110, 90)">
                      <rect x="0" y="0" width="50" height="35" rx="4" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2.5" />
                      <text x="25" y="22" textAnchor="middle" fill="#991B1B" fontSize="10" fontWeight="900">A-02</text>
                      <circle cx="25" cy="0" r="10" fill="#EF4444" opacity="0.3" className="animate-ping" />
                      <circle cx="25" cy="0" r="5" fill="#DC2626" />
                    </g>
                  ) : (
                    <g transform="translate(440, 90)">
                      <rect x="0" y="0" width="55" height="35" rx="4" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2.5" />
                      <text x="27" y="22" textAnchor="middle" fill="#991B1B" fontSize="10" fontWeight="900">{quickMapStall.code}</text>
                      <circle cx="27" cy="0" r="10" fill="#EF4444" opacity="0.3" className="animate-ping" />
                      <circle cx="27" cy="0" r="5" fill="#DC2626" />
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#DCE8F1] bg-[#F5FAF8]">
              <button
                type="button"
                onClick={() => setQuickMapStall(null)}
                className="px-4 py-2 rounded-lg border border-[#DCE8F1] bg-white text-xs font-bold text-[#172F55] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetCode = quickMapStall?.code;
                  setQuickMapStall(null);
                  onNavigateToMap(targetCode);
                }}
                className="px-4 py-2 rounded-lg bg-[#0B7A3A] hover:bg-[#075A2B] text-white text-xs font-black transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Mở Sơ Đồ Tác Chiến Toàn Diện</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
