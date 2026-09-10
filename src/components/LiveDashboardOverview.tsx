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
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers
} from 'lucide-react';
import MarketFeeCollectionSection from './MarketFeeCollectionSection';
import DonutChartSvg from './DonutChartSvg';
import { CLIENT_STALLS, CLIENT_ZONES, CLIENT_TRADERS, CLIENT_COMPLAINTS } from '@/data/clientCmsData';
import type {
  DonutSegment,
  SlaMetricReport
} from '@/types/dashboard';

interface LiveDashboardOverviewProps {
  onNavigateToMap: (stallCode?: string) => void;
  onNavigateToProfiles?: () => void;
  dispatchedStalls?: Record<string, { teamName: string; status: string }>;
  onQuickDispatch?: (stallId: string, teamName: string) => void;
  resolvedComplaintCodes?: string[];
  onResolveComplaint?: (codeOrId: string) => void;
  selectedMarketId?: string;
  markets?: any[];
  stalls?: any[];
  zones?: any[];
  complaints?: any[];
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
        stallId: 'A-06',
        stallName: 'Gia Cầm Đông Lạnh Quốc Bảo',
        merchantName: 'Phan Quốc Bảo',
        phone: '0908 999 514',
        zone: 'Khu A · Tươi sống',
        title: 'Gian hàng gia cầm: Rã đông gà trên sàn xi măng vi phạm ATTP (PAKN #075)',
        description: 'Khách hàng phản ánh phát hiện sạp rã đông gia cầm trên sàn xi măng không có khay cách ly, thiếu tem chứng nhận kiểm dịch an toàn thực phẩm.',
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
        stallId: 'B-02',
        stallName: 'Đặc Sản Tây Bắc Đức Hạnh',
        merchantName: 'Hoàng Văn Đức',
        phone: '0936 789 005',
        zone: 'Khu B · Nông sản khô',
        title: 'Dấu hiệu không niêm yết giá nấm hương rừng rõ ràng (PAKN #081)',
        description: 'Ban Kiểm Tra Giá phát hiện sạp B-02 không niêm yết giá nấm hương rừng Điện Biên, có hiện tượng chênh lệch giá so với bảng niêm yết chung.',
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
        stallId: 'A-02',
        stallName: 'Hải Sản Tươi Sống Hùng Phát',
        merchantName: 'Trần Văn Hùng',
        phone: '0903 234 502',
        zone: 'Khu A · Tươi sống',
        title: 'Tranh chấp lối đi vận chuyển khay hải sản tươi sống cản trở lối đi (PAKN #084)',
        description: 'Nhân viên chuyển khay cá tôm cản trở lối đi chung của khách hàng và sạp lân cận. Cần tổ phản ứng nhanh giải tỏa trật tự.',
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
        stallName: 'Sạp Thịt Bò Tươi Cô Mai',
        merchantName: 'Nguyễn Thị Mai',
        phone: '0912 345 601',
        zone: 'Khu A · Tươi sống',
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
        stallId: 'B-06',
        stallName: 'Gia Vị Phở Bác Tùng',
        merchantName: 'Bùi Thanh Tùng',
        phone: '0944 556 677',
        zone: 'Khu B · Nông sản khô',
        title: 'Tập kết thùng hàng và bao tải lấn chiếm 0.8m lối đi bộ',
        description: 'Hàng chục bao quế hồi và gia vị xếp lấn quá vạch sơn ranh giới sạp 0.8m, người đi bộ phải lách qua khó khăn.',
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
        stallId: 'D-01',
        stallName: 'Bách Hóa & Trà Bích Thủy',
        merchantName: 'Nguyễn Bích Thủy',
        phone: '0968 901 208',
        zone: 'Khu D · Bách hóa',
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
        stallId: 'C-01',
        stallName: 'Bún Chả Gia Truyền Cô Nga',
        merchantName: 'Đỗ Thị Nga',
        phone: '0915 678 906',
        zone: 'Khu C · Ẩm thực',
        title: 'Xe đẩy bốc dỡ hàng đỗ sai vị trí cản trở cửa thoát hiểm',
        description: '3 xe đẩy chở thùng hàng để chắn ngang cửa thông gió và lối tiếp cận xe cấp cứu cổng phía Bắc.',
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
        stallName: 'Hải Sản Tươi Sống Hùng Phát',
        merchantName: 'Trần Văn Hùng',
        phone: '0903 234 502',
        zone: 'Khu A · Tươi sống',
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
        stallId: 'A-03',
        stallName: 'Gia Cầm Sạch Nam Hải',
        merchantName: 'Lê Hoàng Nam',
        phone: '0988 123 403',
        zone: 'Khu A · Tươi sống',
        title: 'Mùi hôi rãnh thoát nước sau sạp A-03 cần nạo vét khử mùi',
        description: 'Rãnh thu gom nước thải đọng cặn hữu cơ bốc mùi khó chịu trong bán kính 5m. Cần tổ môi trường phun dung dịch khử khuẩn.',
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
        stallName: 'Tôm Cua Cà Mau Minh Sang',
        merchantName: 'Đặng Minh Sang',
        phone: '0934 112 233',
        zone: 'Khu A · Tươi sống',
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
        stallId: 'C-04',
        stallName: 'Bún Riêu Cua Đồng Cô Liên',
        merchantName: 'Hoàng Thị Liên',
        phone: '0936 889 911',
        zone: 'Khu C · Ẩm thực',
        title: 'Đèn LED chiếu sáng hành lang ẩm thực chập chờn',
        description: 'Bóng đèn tuýp LED số 04 hành lang giữa chập chờn nhấp nháy, ánh sáng không đủ cho khách đi lại.',
        severity: 'Cơ sở hạ tầng',
        severityLevel: 'P2',
        reporter: 'Hoàng Thị Liên',
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
        stallId: 'E-01',
        stallName: 'Lụa Tơ Tằm Kim Cúc',
        merchantName: 'Lê Thị Kim Cúc',
        phone: '0904 567 809',
        zone: 'Khu E · Vải sợi',
        title: 'Rò rỉ van vòi nước rửa tay chung khu vực vải sợi',
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
        stallId: 'B-08',
        stallName: 'Khoai Sọ & Nông Sản Bắc Kạn',
        merchantName: 'Nguyễn Thị Thoa',
        phone: '0972 334 455',
        zone: 'Khu B · Nông sản khô',
        title: 'Quạt thông gió hành lang phía Nam phát tiếng ồn lớn',
        description: 'Quạt hút công nghiệp trục motor bị khô dầu phát ra tiếng rít lớn khi vận hành ở tốc độ cao.',
        severity: 'Cơ sở hạ tầng',
        severityLevel: 'P2',
        reporter: 'Nguyễn Thị Thoa',
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
        stallId: 'D-04',
        stallName: 'Bách Hóa Tổng Hợp Minh Châu',
        merchantName: 'Nguyễn Minh Châu',
        phone: '0975 667 788',
        zone: 'Khu D · Bách hóa',
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
        stallId: 'E-02',
        stallName: 'Thủ Công Mỹ Nghệ Trọng Phát',
        merchantName: 'Dương Đình Trọng',
        phone: '0983 234 510',
        zone: 'Khu E · Vải sợi',
        title: 'Khách góp ý nhân viên thanh toán chưa niềm nở trong giờ cao điểm',
        description: 'Khách hàng phản ánh nhân viên tính tiền chưa hướng dẫn quét mã chuyển khoản nhiệt tình trong giờ cao điểm.',
        severity: 'Cơ sở hạ tầng',
        severityLevel: 'P2',
        reporter: 'Khách hàng mua sắm',
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


// Danh sách 19 hộ tiểu thương tiêu biểu (đồng bộ 100% CLIENT_TRADERS)
const SAMPLE_TRADERS = CLIENT_TRADERS.map((t) => {
  const stall = CLIENT_STALLS.find((s) => s.currentContract?.merchant?.phone === t.phone || s.code === t.stall?.code);
  const contractDays = stall?.currentContract?.daysLeft ?? 114;
  const status = contractDays <= 30 ? `Sắp hết hạn (${contractDays} ngày)` : 'Hoàn tất hồ sơ';
  return {
    id: t.id,
    name: t.fullName,
    stall: t.stall?.code || stall?.code || 'A-01',
    category: t.category?.name || 'Thực phẩm',
    phone: t.phone ? t.phone.slice(0, 8) + ' ***' : '0908 999 ***',
    contractDays,
    status
  };
});



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
  onQuickDispatch,
  resolvedComplaintCodes = [],
  onResolveComplaint,
  selectedMarketId,
  markets,
  stalls,
  zones,
  complaints
}: LiveDashboardOverviewProps) {
  // 1. Phân giải Chợ hiện tại và Tiêu đề điều hành
  const currentMarket = useMemo(() => {
    if (!selectedMarketId || selectedMarketId === 'all') return null;
    return markets?.find((m: any) => m.id === selectedMarketId) || null;
  }, [selectedMarketId, markets]);

  const marketTitle = useMemo(() => {
    if (currentMarket) return `${currentMarket.name} (${currentMarket.code})`;
    if (markets && markets.length > 0) return `Toàn Hệ Thống (${markets.length} Chợ)`;
    return 'Toàn Hệ Thống Chợ';
  }, [currentMarket, markets]);

  // 2. Lấy danh sách Sạp thực tế tương ứng với Chợ được chọn
  const activeStalls = useMemo(() => {
    const source = (stalls && stalls.length > 0) ? stalls : CLIENT_STALLS;
    if (!selectedMarketId || selectedMarketId === 'all') return source;
    return source.filter((s: any) => s.marketId === selectedMarketId);
  }, [stalls, selectedMarketId]);

  // 3. Lấy danh sách Phân khu thực tế tương ứng
  const activeZones = useMemo(() => {
    if (zones && zones.length > 0) {
      if (selectedMarketId && selectedMarketId !== 'all') {
        const marketZones = zones.filter((z: any) => z.marketId === selectedMarketId);
        if (marketZones.length > 0) return marketZones;
      } else {
        return zones;
      }
    }
    // Dynamic fallback: trích xuất các phân khu duy nhất từ danh sách sạp
    const list: any[] = [];
    const seen = new Set<string>();
    activeStalls.forEach((s: any) => {
      const z = s.zones;
      if (z && z.id && !seen.has(z.id)) {
        seen.add(z.id);
        list.push({
          id: z.id,
          code: z.code || 'ZONE',
          name: z.name || 'Phân khu',
          description: z.description || z.name
        });
      }
    });
    if (list.length > 0) return list;
    return (!selectedMarketId || selectedMarketId === 'all') ? CLIENT_ZONES : [];
  }, [zones, selectedMarketId, activeStalls]);

  // 4. Lấy danh sách Khiếu nại thực tế tương ứng
  const activeComplaintsList = useMemo(() => {
    const source = (complaints && complaints.length > 0) ? complaints : CLIENT_COMPLAINTS;
    if (!selectedMarketId || selectedMarketId === 'all') return source;
    return source.filter((c: any) => c.marketId === selectedMarketId);
  }, [complaints, selectedMarketId]);

  // Trạng thái giải quyết/đóng phản ánh bền vững (Persistent Resolved Complaints State)
  const [internalResolvedCodes, setInternalResolvedCodes] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('smartmarket_resolved_complaints') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const allResolvedCodes = useMemo(() => {
    return Array.from(
      new Set([
        'PAKN-2026-108',
        'cp-13',
        'c13',
        ...resolvedComplaintCodes,
        ...internalResolvedCodes
      ])
    );
  }, [resolvedComplaintCodes, internalResolvedCodes]);

  const isComplaintResolved = (codeOrId?: string) => {
    if (!codeOrId) return false;
    return allResolvedCodes.includes(codeOrId);
  };

  const handleResolveComplaint = (codeOrId: string, altCodeOrId?: string) => {
    setInternalResolvedCodes((prev) => {
      const toAdd = [codeOrId, altCodeOrId].filter(Boolean) as string[];
      const next = Array.from(new Set([...prev, ...toAdd]));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('smartmarket_resolved_complaints', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
    if (onResolveComplaint) {
      onResolveComplaint(codeOrId);
    }
  };

  // 5. Cấu trúc nhóm phản ánh PAKN động theo dữ liệu Backend
  const dynamicComplaintGroups = useMemo(() => {
    if (complaints && complaints.length > 0) {
      const p0Items = activeComplaintsList.filter((c: any) => c.severityLevel === 'P0' || c.type === 'product_quality' || c.type === 'food_safety' || c.type === 'weighing_fraud');
      const p1Items = activeComplaintsList.filter((c: any) => c.severityLevel === 'P1' || c.type === 'service_attitude' || c.type === 'price_issue' || c.type === 'order_issue');
      const p2Items = activeComplaintsList.filter((c: any) => c.severityLevel === 'P2' || c.type === 'infrastructure' || c.type === 'other');

      const mapToItem = (c: any): ComplaintItem => ({
        id: c.id,
        code: c.code || `PAKN-${(c.id || '').slice(0, 6).toUpperCase()}`,
        stallId: c.stalls?.code || c.stallId || 'Chung',
        stallName: c.stalls?.name || 'Khu vực chung',
        merchantName: c.reporter?.fullName || 'Khách phản ánh',
        phone: c.reporter?.phone || '0908 999 ***',
        zone: c.zones?.name || c.zone || 'Khu vực chợ',
        title: c.title || c.content?.slice(0, 50) || 'Phản ánh chất lượng',
        description: c.content || '',
        severity: (c.severityLevel === 'P0' ? 'Khẩn cấp' : c.severityLevel === 'P1' ? 'Trật tự' : 'Cơ sở hạ tầng') as any,
        severityLevel: (c.severityLevel || 'P1') as any,
        reporter: c.reporter?.fullName || 'Người tiêu dùng',
        time: c.createdAt ? new Date(c.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Hôm nay',
        coordinator: {
          name: 'Ban Quản Lý Chợ',
          role: 'Tổ cơ động',
          phone: '0904.777.999'
        }
      });

      return [
        {
          id: 'food_safety_fraud',
          title: 'Gian Lận & An Toàn Thực Phẩm',
          subtitle: 'Mức khẩn cấp (SLA < 15 phút)',
          icon: Flame,
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          priorityTag: 'Khẩn cấp',
          count: p0Items.length,
          items: p0Items.map(mapToItem)
        },
        {
          id: 'order_space',
          title: 'Trật Tự & Lấn Chiếm Lối Đi',
          subtitle: 'Mức trật tự (SLA < 30 phút)',
          icon: ShieldAlert,
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          priorityTag: 'Trật tự',
          count: p1Items.length,
          items: p1Items.map(mapToItem)
        },
        {
          id: 'sanitation_infra',
          title: 'Vệ Sinh & Cơ Sở Hạ Tầng',
          subtitle: 'Mức hạ tầng (SLA < 2 giờ)',
          icon: Wrench,
          badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
          priorityTag: 'Hạ tầng',
          count: p2Items.length,
          items: p2Items.map(mapToItem)
        }
      ];
    }
    return COMPLAINT_GROUPS;
  }, [complaints, activeComplaintsList]);

  const activeComplaintCount = useMemo(() => {
    return dynamicComplaintGroups.reduce((acc, group) => {
      return acc + group.items.filter((item: any) => !isComplaintResolved(item.code) && !isComplaintResolved(item.id)).length;
    }, 0);
  }, [dynamicComplaintGroups, allResolvedCodes]);

  const resolvedCount = useMemo(() => {
    return dynamicComplaintGroups.reduce((acc, group) => {
      return acc + group.items.filter((item: any) => isComplaintResolved(item.code) || isComplaintResolved(item.id)).length;
    }, 0);
  }, [dynamicComplaintGroups, allResolvedCodes]);

  const criticalComplaintCount = useMemo(() => {
    const p0Group = dynamicComplaintGroups.find((g) => g.id === 'food_safety_fraud');
    if (!p0Group) return 0;
    return p0Group.items.filter((i: any) => !isComplaintResolved(i.code) && !isComplaintResolved(i.id)).length;
  }, [dynamicComplaintGroups, allResolvedCodes]);

  const infrastructureComplaintCount = useMemo(() => {
    const p2Group = dynamicComplaintGroups.find((g) => g.id === 'sanitation_infra');
    if (!p2Group) return 0;
    return p2Group.items.filter((i: any) => !isComplaintResolved(i.code) && !isComplaintResolved(i.id)).length;
  }, [dynamicComplaintGroups, allResolvedCodes]);

  const orderComplaintCount = useMemo(() => {
    const p1Group = dynamicComplaintGroups.find((g) => g.id === 'order_space');
    if (!p1Group) return 0;
    return p1Group.items.filter((i: any) => !isComplaintResolved(i.code) && !isComplaintResolved(i.id)).length;
  }, [dynamicComplaintGroups, allResolvedCodes]);

  // Bộ lọc hiển thị vụ việc đã đóng (Mặc định: ẩn để chỉ tập trung vào vụ việc còn tồn đọng)
  const [showResolvedComplaints, setShowResolvedComplaints] = useState<boolean>(false);
  // Tab lọc dữ liệu tại chỗ (STT 2)
  const [activeKpiTab, setActiveKpiTab] = useState<'stalls' | 'traders' | 'complaints' | 'billing'>('stalls');
  const [ratingRange, setRatingRange] = useState<'7days' | '30days'>('7days');

  // Pop-up Modal mở nhanh sơ đồ chợ (STT 3)
  const [quickMapStall, setQuickMapStall] = useState<{ code: string; name: string; issue?: string } | null>(null);

  // Modal Chi Tiết Sự Cố & Lệnh Điều Phối Tức Thì
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Trạng thái điều phối đồng bộ (Work Package C: Bidirectional Dispatch State)
  const [localDispatches, setLocalDispatches] = useState<Record<string, { teamName: string; status: string }>>({});
  const allDispatches = useMemo(() => ({
    ...dispatchedStalls,
    ...localDispatches
  }), [dispatchedStalls, localDispatches]);

  // Bộ lọc & phân trang tương tác tab Sạp hàng
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [stallStatusFilter, setStallStatusFilter] = useState<'all' | 'complaint' | 'expiring' | 'occupied' | 'vacant' | 'maintenance'>('all');
  const [stallSearchQuery, setStallSearchQuery] = useState<string>('');
  const [stallPage, setStallPage] = useState<number>(1);
  const STALLS_PER_PAGE = 8;

  // 6. Danh sách Tiểu thương đồng bộ từ sạp thực tế
  const activeTraders = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();
    activeStalls.forEach((s: any) => {
      const m = s.currentContract?.merchant;
      if (m && !seen.has(m.id || m.fullName)) {
        seen.add(m.id || m.fullName);
        const contractDays = s.currentContract?.daysLeft ?? 180;
        list.push({
          id: m.id || `tr-${list.length + 1}`,
          name: m.fullName,
          stall: s.code || 'Sạp',
          category: s.categories?.name || 'Nông sản',
          phone: m.phone ? m.phone.slice(0, 7) + ' ***' : '0908 999 ***',
          contractDays,
          status: contractDays <= 30 ? `Sắp hết hạn (${contractDays} ngày)` : 'Hoàn tất hồ sơ'
        });
      }
    });
    return list.length > 0 ? list : SAMPLE_TRADERS;
  }, [activeStalls]);

  const traderCount = useMemo(() => {
    if (currentMarket?.traderCount) return currentMarket.traderCount;
    return activeTraders.length || 15;
  }, [currentMarket, activeTraders]);

  // Bộ lọc & phân trang tương tác tab Tiểu thương
  const [traderSearchQuery, setTraderSearchQuery] = useState<string>('');
  const [traderPage, setTraderPage] = useState<number>(1);
  const TRADERS_PER_PAGE = 8;

  const filteredTraders = useMemo(() => {
    if (!traderSearchQuery.trim()) return activeTraders;
    const q = traderSearchQuery.trim().toLowerCase();
    return activeTraders.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.stall.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q)
    );
  }, [traderSearchQuery, activeTraders]);

  const totalTraderPages = Math.max(1, Math.ceil(filteredTraders.length / TRADERS_PER_PAGE));
  const paginatedTraders = useMemo(() => {
    const start = (traderPage - 1) * TRADERS_PER_PAGE;
    return filteredTraders.slice(start, start + TRADERS_PER_PAGE);
  }, [filteredTraders, traderPage]);

  // 7. Thống kê nhanh theo từng phân khu thực tế
  const zoneStats = useMemo(() => {
    return activeZones.map((zone: any) => {
      const stallsInZone = activeStalls.filter((s: any) => s.zoneId === zone.id || s.zones?.id === zone.id || s.zones?.code === zone.code);
      const occupied = stallsInZone.filter((s: any) => s.status === 'occupied').length;
      const complaintCount = stallsInZone.filter((s: any) => s.displayStatus === 'has_complaint' || (s.openComplaintCount && s.openComplaintCount > 0)).length;
      return {
        ...zone,
        total: stallsInZone.length || zone.stallCount || 0,
        occupied: occupied || zone.occupiedCount || 0,
        complaintCount
      };
    });
  }, [activeZones, activeStalls]);

  // 8. Đếm số lượng sạp theo từng trạng thái thực tế
  const stallCounts = useMemo(() => {
    let complaint = 0;
    let expiring = 0;
    let occupied = 0;
    let vacant = 0;
    let maintenance = 0;

    activeStalls.forEach((s: any) => {
      if (s.displayStatus === 'has_complaint' || (s.openComplaintCount && s.openComplaintCount > 0)) {
        complaint++;
      }
      if (s.displayStatus === 'expiring_soon' || (s.currentContract && s.currentContract.daysLeft != null && s.currentContract.daysLeft <= 30)) {
        expiring++;
      }
      if (s.status === 'occupied') {
        occupied++;
      } else if (s.status === 'vacant') {
        vacant++;
      } else if (s.status === 'maintenance' || s.status === 'reserved') {
        maintenance++;
      }
    });

    return {
      all: activeStalls.length,
      complaint,
      expiring,
      occupied,
      vacant,
      maintenance
    };
  }, [activeStalls]);

  // 9. Danh sách sạp sau khi lọc theo Phân khu, Trạng thái và Từ khóa tìm kiếm
  const filteredStalls = useMemo(() => {
    return activeStalls.filter((s: any) => {
      // 1. Lọc theo phân khu
      if (selectedZoneId !== 'all') {
        const matchZone = s.zoneId === selectedZoneId || s.zones?.id === selectedZoneId || s.zones?.code === selectedZoneId;
        if (!matchZone) return false;
      }

      // 2. Lọc theo trạng thái
      if (stallStatusFilter === 'complaint') {
        if (s.displayStatus !== 'has_complaint' && (!s.openComplaintCount || s.openComplaintCount === 0)) return false;
      } else if (stallStatusFilter === 'expiring') {
        if (s.displayStatus !== 'expiring_soon' && (!s.currentContract || s.currentContract.daysLeft == null || s.currentContract.daysLeft > 30)) return false;
      } else if (stallStatusFilter === 'occupied') {
        if (s.status !== 'occupied') return false;
      } else if (stallStatusFilter === 'vacant') {
        if (s.status !== 'vacant') return false;
      } else if (stallStatusFilter === 'maintenance') {
        if (s.status !== 'maintenance' && s.status !== 'reserved') return false;
      }

      // 3. Lọc theo từ khóa tìm kiếm
      if (stallSearchQuery.trim()) {
        const q = stallSearchQuery.trim().toLowerCase();
        const matchCode = (s.code || '').toLowerCase().includes(q);
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchZone = (s.zones?.name || '').toLowerCase().includes(q);
        const matchCategory = (s.categories?.name || '').toLowerCase().includes(q);
        const matchMerchant = (s.currentContract?.merchant?.fullName || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchZone && !matchCategory && !matchMerchant) {
          return false;
        }
      }

      return true;
    });
  }, [activeStalls, selectedZoneId, stallStatusFilter, stallSearchQuery]);

  // Phân trang
  const totalStallPages = Math.max(1, Math.ceil(filteredStalls.length / STALLS_PER_PAGE));
  const paginatedStalls = useMemo(() => {
    const startIndex = (stallPage - 1) * STALLS_PER_PAGE;
    return filteredStalls.slice(startIndex, startIndex + STALLS_PER_PAGE);
  }, [filteredStalls, stallPage, STALLS_PER_PAGE]);

  // Reset trang khi thay đổi bộ lọc
  const handleZoneSelect = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setStallPage(1);
  };

  const handleStatusSelect = (status: typeof stallStatusFilter) => {
    setStallStatusFilter(status);
    setStallPage(1);
  };

  const handleSearchChange = (query: string) => {
    setStallSearchQuery(query);
    setStallPage(1);
  };

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
              Tổng Quan Vận Hành — {marketTitle}
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
                {criticalComplaintCount}
              </div>
              <div>
                <div className="text-xs font-extrabold text-white">{criticalComplaintCount} Phản ánh khẩn cấp</div>
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
                {infrastructureComplaintCount}
              </div>
              <div>
                <div className="text-xs font-extrabold text-white">{infrastructureComplaintCount} Vấn đề hạ tầng & {orderComplaintCount} Trật tự</div>
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
                {stallCounts.occupied} / {stallCounts.all}
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
                ↑ {Math.round((stallCounts.occupied / stallCounts.all) * 100)}% đang thuê ({stallCounts.vacant} trống)
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
                {traderCount}
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
                <span>{traderCount} đang kinh doanh</span>
                <span className="text-[#B45309] font-black bg-[#FEF3C7] px-1.5 py-0.2 rounded border border-[#FCD34D]/60 text-[10px]">
                  {currentMarket?.vacantStallCount || stallCounts.vacant || 0} sạp trống
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
                {activeComplaintCount}
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
                {criticalComplaintCount} vụ khẩn cấp • {infrastructureComplaintCount} hạ tầng
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
                  <span>Quy Mô Sạp Hàng — {stallCounts.all} Sạp ({marketTitle})</span>
                </h3>
                <p className="text-xs text-[#7185A1] mt-0.5">
                  Phân bố {zoneStats.length} phân khu chức năng: {stallCounts.occupied} sạp đang thuê • {stallCounts.vacant} sạp trống • {stallCounts.maintenance} sạp bảo trì/giữ chỗ
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
                  { name: 'Đang thuê', value: stallCounts.occupied, color: '#0B7A3A' },
                  { name: 'Trống', value: stallCounts.vacant, color: '#94A3B8' },
                  { name: 'Bảo trì / Giữ chỗ', value: stallCounts.maintenance, color: '#F59E0B' },
                ]}
                centerValue={String(stallCounts.all)}
                centerLabel="Tổng sạp"
                size={140}
              />
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                <DetailStatCard label="Đã thuê" value={`${stallCounts.occupied} sạp`} toneClass="text-[#0B7A3A]" badge={`${Math.round((stallCounts.occupied / (stallCounts.all || 1)) * 100)}%`} />
                <DetailStatCard label="Còn trống" value={`${stallCounts.vacant} sạp`} toneClass="text-[#64748B]" badge={`${Math.round((stallCounts.vacant / (stallCounts.all || 1)) * 100)}%`} />
                <DetailStatCard label="Bảo trì / Giữ chỗ" value={`${stallCounts.maintenance} sạp`} toneClass="text-[#D97706]" badge={`${Math.round((stallCounts.maintenance / (stallCounts.all || 1)) * 100)}%`} />
                <DetailStatCard label="Biến động tháng" value="↑ +8%" toneClass="text-[#059669]" badge="Tháng này" />
              </div>
            </div>

            {/* Phân khu tác chiến & Lọc tương tác */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[#7185A1] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#0B7A3A]" />
                  <span>Phân khu tác chiến ({zoneStats.length} khu) — Nhấp để lọc theo khu</span>
                </div>
                {selectedZoneId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => handleZoneSelect('all')}
                    className="text-xs font-bold text-[#0B7A3A] hover:underline cursor-pointer"
                  >
                    Xem tất cả {zoneStats.length} phân khu
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs font-semibold">
                {zoneStats.map((z) => {
                  const isSelected = selectedZoneId === z.id;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => handleZoneSelect(isSelected ? 'all' : z.id)}
                      className={`p-2.5 rounded-lg text-left transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#E8F8EF] border-[#0B7A3A] ring-2 ring-[#0B7A3A]/20 shadow-xs'
                          : 'bg-[#F5FAF8] border-[#DCE8F1] hover:bg-white hover:border-[#0B7A3A]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`text-[10px] truncate ${isSelected ? 'text-[#0B7A3A] font-bold' : 'text-[#7185A1]'}`}>
                          {z.name.split('·')[0].trim()}
                        </div>
                        {z.complaintCount > 0 && (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-black bg-rose-500 text-white rounded-full">
                            {z.complaintCount} sự cố
                          </span>
                        )}
                      </div>
                      <div className="text-base font-black text-[#172F55] font-mono mt-0.5">{z.total} sạp</div>
                      <div className="text-[10px] text-emerald-600 font-bold">{z.occupied} đang thuê</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thanh công cụ: Lọc Exception-First & Tìm kiếm thông minh */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => handleStatusSelect('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                    stallStatusFilter === 'all'
                      ? 'bg-[#172F55] text-white shadow-xs'
                      : 'bg-[#F0F5FA] text-[#7185A1] hover:bg-[#E1EAF4] hover:text-[#172F55]'
                  }`}
                >
                  Tất cả ({stallCounts.all})
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusSelect('complaint')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                    stallStatusFilter === 'complaint'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Sự cố khẩn cấp ({stallCounts.complaint})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusSelect('expiring')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                    stallStatusFilter === 'expiring'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sắp hết hạn HĐ ({stallCounts.expiring})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusSelect('occupied')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                    stallStatusFilter === 'occupied'
                      ? 'bg-[#0B7A3A] text-white shadow-xs'
                      : 'bg-[#F0F5FA] text-[#7185A1] hover:bg-[#E1EAF4] hover:text-[#172F55]'
                  }`}
                >
                  Đang thuê ({stallCounts.occupied})
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusSelect('vacant')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                    stallStatusFilter === 'vacant'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Trống ({stallCounts.vacant})
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusSelect('maintenance')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                    stallStatusFilter === 'maintenance'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                  }`}
                >
                  Bảo trì / Giữ chỗ ({stallCounts.maintenance})
                </button>
              </div>

              {/* Ô tìm kiếm */}
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7185A1]" />
                <input
                  type="text"
                  value={stallSearchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Tìm mã sạp, tên sạp, tiểu thương..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#DCE8F1] rounded-lg focus:outline-none focus:border-[#0B7A3A] focus:ring-1 focus:ring-[#0B7A3A] text-[#172F55] placeholder-[#7185A1]"
                />
                {stallSearchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7185A1] hover:text-[#172F55]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Bảng danh sách 50 sạp đồng bộ thực tế kèm phân trang */}
            <div className="overflow-x-auto rounded-lg border border-[#DCE8F1]">
              <table className="w-full text-left text-xs border-collapse bg-white">
                <thead>
                  <tr className="border-b border-[#DCE8F1] bg-[#F8FAFC] text-[#7185A1] font-bold">
                    <th className="py-2.5 px-3">Mã sạp</th>
                    <th className="py-2.5 px-3">Tên sạp & Ngành hàng</th>
                    <th className="py-2.5 px-3">Phân khu</th>
                    <th className="py-2.5 px-3">Tiểu thương</th>
                    <th className="py-2.5 px-3">Tình trạng</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE8F1]/60">
                  {paginatedStalls.map((s) => {
                    const isComplaint = s.displayStatus === 'has_complaint' || (s.openComplaintCount && s.openComplaintCount > 0);
                    const isExpiring = s.displayStatus === 'expiring_soon' || (s.currentContract && s.currentContract.daysLeft != null && s.currentContract.daysLeft <= 30);
                    const isVacant = s.status === 'vacant';
                    const isMaintenance = s.status === 'maintenance';
                    const isReserved = s.status === 'reserved';
                    const merchantName = s.currentContract?.merchant?.fullName || (isVacant ? 'Chưa tiếp quản' : isMaintenance ? 'Đang bảo trì' : isReserved ? 'Đã giữ chỗ' : '—');
                    const phone = s.currentContract?.merchant?.phone || s.phone;

                    return (
                      <tr key={s.id} className="hover:bg-[#F5FAF8] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-black text-[#172F55]">
                          <span className="px-2 py-0.5 rounded bg-[#F0F5FA] border border-[#DCE8F1]">{s.code}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#172F55] leading-tight">{s.name || s.code}</div>
                          <div className="text-[11px] text-[#7185A1] mt-0.5 truncate max-w-xs">{s.categories?.name || s.description || '—'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[#7185A1]">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5FAF8] border border-[#DCE8F1]">
                            {s.zones?.name || s.zoneId}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#172F55]">
                          <div className="font-semibold">{merchantName}</div>
                          {phone && <div className="text-[10px] text-[#7185A1] font-mono">{phone}</div>}
                        </td>
                        <td className="py-2.5 px-3">
                          {isComplaint ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3" /> Sự cố khẩn cấp
                            </span>
                          ) : isExpiring ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> Hạn HĐ ({s.currentContract?.daysLeft ?? 0} ngày)
                            </span>
                          ) : isVacant ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">
                              Trống
                            </span>
                          ) : isMaintenance ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                              <Wrench className="w-3 h-3" /> Bảo trì
                            </span>
                          ) : isReserved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Giữ chỗ
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
                            onClick={() => setQuickMapStall({
                              code: s.code,
                              name: s.name || s.code,
                              issue: isComplaint ? 'Sự cố cần kiểm tra thực địa' : undefined
                            })}
                            className="px-2.5 py-1 text-[11px] font-extrabold text-[#0B7A3A] bg-[#E8F8EF] hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                          >
                            Xem trên sơ đồ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedStalls.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#7185A1]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Store className="w-8 h-8 text-[#A0B2C6]" />
                          <p className="text-xs font-semibold">Không tìm thấy sạp nào phù hợp với bộ lọc hiện tại.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedZoneId('all');
                              setStallStatusFilter('all');
                              setStallSearchQuery('');
                              setStallPage(1);
                            }}
                            className="text-xs font-bold text-[#0B7A3A] underline cursor-pointer"
                          >
                            Đặt lại bộ lọc
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Thanh điều khiển phân trang thông minh */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
              <div className="text-[#7185A1]">
                Hiển thị <span className="font-bold text-[#172F55]">{filteredStalls.length > 0 ? (stallPage - 1) * STALLS_PER_PAGE + 1 : 0}</span> -{' '}
                <span className="font-bold text-[#172F55]">{Math.min(stallPage * STALLS_PER_PAGE, filteredStalls.length)}</span> trong tổng số{' '}
                <span className="font-bold text-[#172F55]">{filteredStalls.length}</span> sạp
                {selectedZoneId !== 'all' && (
                  <span className="ml-1 text-[#0B7A3A] font-semibold">
                    (Khu {activeZones.find((z: any) => z.id === selectedZoneId)?.code.replace('KHU-', '') || ''})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={stallPage <= 1}
                  onClick={() => setStallPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-[#DCE8F1] bg-white font-semibold text-[#172F55] hover:bg-[#F5FAF8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  ← Trước
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalStallPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setStallPage(pageNum)}
                      className={`w-7 h-7 rounded text-xs font-bold transition-colors cursor-pointer ${
                        stallPage === pageNum
                          ? 'bg-[#0B7A3A] text-white shadow-xs'
                          : 'bg-white border border-[#DCE8F1] text-[#172F55] hover:bg-[#F5FAF8]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={stallPage >= totalStallPages}
                  onClick={() => setStallPage(p => Math.min(totalStallPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-[#DCE8F1] bg-white font-semibold text-[#172F55] hover:bg-[#F5FAF8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Sau →
                </button>
              </div>
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
                  <span>Danh Bạ {traderCount} Hộ Tiểu Thương Đang Kinh Doanh</span>
                </h3>
                <p className="text-xs text-[#7185A1] mt-0.5">
                  {traderCount} hộ hiện hữu đã ký hợp đồng thuê sạp • Có {currentMarket?.vacantStallCount || stallCounts.vacant || 0} sạp còn trống
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
                  { name: 'Cố định (có sạp)', value: traderCount, color: '#1F78C7' },
                  { name: 'Chờ duyệt hồ sơ', value: 7, color: '#F59E0B' },
                ]}
                centerValue={String(traderCount)}
                centerLabel="Tiểu thương"
                size={140}
              />
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                <DetailStatCard label="Cố định (có sạp)" value={`${traderCount} hộ`} toneClass="text-[#1F78C7]" badge="Kinh doanh" />
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

            {/* Thanh tìm kiếm & thống kê tiểu thương */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[#7185A1] font-semibold">
                Hiển thị <span className="font-bold text-[#172F55]">{filteredTraders.length > 0 ? (traderPage - 1) * TRADERS_PER_PAGE + 1 : 0}</span> -{' '}
                <span className="font-bold text-[#172F55]">{Math.min(traderPage * TRADERS_PER_PAGE, filteredTraders.length)}</span> trong tổng số{' '}
                <span className="font-bold text-[#172F55]">{filteredTraders.length}</span> hộ tiểu thương
              </div>
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7185A1]" />
                <input
                  type="text"
                  value={traderSearchQuery}
                  onChange={(e) => {
                    setTraderSearchQuery(e.target.value);
                    setTraderPage(1);
                  }}
                  placeholder="Tìm họ tên, ngành hàng, sạp..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#DCE8F1] rounded-lg focus:outline-none focus:border-[#1974C8] focus:ring-1 focus:ring-[#1974C8] text-[#172F55] placeholder-[#7185A1]"
                />
                {traderSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setTraderSearchQuery('');
                      setTraderPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7185A1] hover:text-[#172F55] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
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
                  {paginatedTraders.map((t) => (
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
                  {paginatedTraders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#7185A1]">
                        Không tìm thấy tiểu thương nào phù hợp với từ khóa "{traderSearchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Thanh điều khiển phân trang tiểu thương */}
            {totalTraderPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
                <div className="text-[#7185A1]">
                  Trang <span className="font-bold text-[#172F55]">{traderPage}</span> / {totalTraderPages}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={traderPage <= 1}
                    onClick={() => setTraderPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded border border-[#DCE8F1] bg-white font-semibold text-[#172F55] hover:bg-[#F5FAF8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    ← Trước
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalTraderPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setTraderPage(pageNum)}
                        className={`w-7 h-7 rounded text-xs font-bold transition-colors cursor-pointer ${
                          traderPage === pageNum
                            ? 'bg-[#1974C8] text-white shadow-xs'
                            : 'bg-white border border-[#DCE8F1] text-[#172F55] hover:bg-[#F5FAF8]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={traderPage >= totalTraderPages}
                    onClick={() => setTraderPage((p) => Math.min(totalTraderPages, p + 1))}
                    className="px-2.5 py-1 rounded border border-[#DCE8F1] bg-white font-semibold text-[#172F55] hover:bg-[#F5FAF8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PHẢN ÁNH (3 CẤP ĐỘ TÁC CHIẾN: P0 KHẨN CẤP, P1 TRẬT TỰ, P2 HẠ TẦNG) */}
        {activeKpiTab === 'complaints' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE8F1]">
              <div>
                <h3 className="text-base font-black text-[#172F55] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#D3484D]" />
                  <span>Hệ Thống {activeComplaintCount} Sự Cố Phản Ánh PAKN — 3 Cấp Độ Tác Chiến</span>
                </h3>
                <p className="text-xs text-[#7185A1] mt-0.5">
                  Bấm vào từng sự cố để xem chi tiết đối tượng vi phạm và kết nối gọi trực tiếp cán bộ điều phối hiện trường
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowResolvedComplaints((v) => !v)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    showResolvedComplaints
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {showResolvedComplaints ? 'Đang hiện cả vụ đã đóng' : 'Ẩn vụ việc đã xử lý'}
                </button>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  {criticalComplaintCount} Khẩn cấp
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  {orderComplaintCount} Trật tự
                </span>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                  {infrastructureComplaintCount} Hạ tầng
                </span>
              </div>
            </div>

            {/* Khối biểu đồ Donut & Chỉ số SLA phản ánh (kết nối chuẩn từ staff sandbox) */}
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#DCE8F1]">
              <DonutChartSvg
                data={[
                  { name: 'Chưa xử lý', value: activeComplaintCount, color: '#D3484D' },
                  { name: 'Đã giải quyết (tuần)', value: 42 + resolvedCount, color: '#0B7A3A' },
                ]}
                centerValue={String(activeComplaintCount)}
                centerLabel="PAKN mở"
                size={140}
              />
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                <DetailStatCard label="Chưa xử lý" value={`${activeComplaintCount} vụ`} toneClass="text-[#D3484D]" badge="Trong ca" />
                <DetailStatCard label="Đã giải quyết" value={`${42 + resolvedCount} vụ`} toneClass="text-[#0B7A3A]" badge="Tuần này" />
                <DetailStatCard label="Sắp đến hạn SLA" value="3 vụ" toneClass="text-[#D97706]" badge="< 15 phút" />
                <DetailStatCard label="Quá hạn SLA" value="0 vụ" toneClass="text-[#059669]" badge="Đúng chuẩn" />
              </div>
            </div>

            {/* 3 Cột Phân Nhóm Cấp Độ Nghiệp Vụ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              {dynamicComplaintGroups.map((group) => {
                const IconComp = group.icon;
                const openItems = group.items.filter(
                   (i: any) => !isComplaintResolved(i.code) && !isComplaintResolved(i.id)
                );
                const displayItems = showResolvedComplaints ? group.items : openItems;
                const openItemsCount = openItems.length;
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
                        {openItemsCount} / {group.items.length} vụ
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {displayItems.length === 0 ? (
                        <div className="p-5 rounded-xl bg-white border border-dashed border-[#CBD5E1] text-center text-slate-500 text-xs font-bold flex flex-col items-center justify-center gap-1.5 py-8">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          <span className="text-slate-700 font-black">Nhóm này đã xử lý xong toàn bộ!</span>
                          <span className="text-[10px] text-slate-400 font-normal">Không còn sự cố tồn đọng trong ca trực.</span>
                        </div>
                      ) : (
                        displayItems.map((item: any) => {
                          const isResolved = isComplaintResolved(item.code) || isComplaintResolved(item.id);
                          return (
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
                            className={`p-3 rounded-xl border shadow-2xs space-y-2 transition-all cursor-pointer group ${
                              isResolved
                                ? 'bg-[#F0FDF4] border-emerald-200 hover:border-emerald-400'
                                : 'bg-white border-[#DCE8F1] hover:border-[#1974C8] hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-mono font-black px-1.5 py-0.5 rounded ${
                                  isResolved ? 'text-emerald-800 bg-emerald-100' : 'text-rose-600 bg-rose-50'
                                }`}>
                                  Sạp {item.stallId}
                                </span>
                                <span className="font-mono font-bold text-[#7185A1]">
                                  {item.code}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                                  isResolved
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : item.severityLevel === 'P0'
                                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                                    : item.severityLevel === 'P1'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-sky-100 text-sky-800 border-sky-200'
                                }`}
                              >
                                {isResolved ? '✓ Đã giải quyết' : item.severity}
                              </span>
                            </div>

                            <p className={`text-xs font-bold leading-snug transition-colors ${
                              isResolved ? 'text-emerald-900' : 'text-[#172F55] group-hover:text-[#1974C8]'
                            }`}>
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
                                  if (isResolved) {
                                    return (
                                      <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1 text-[10px]">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Đã xử lý dứt điểm</span>
                                      </span>
                                    );
                                  }

                                  const dispatchInfo =
                                    allDispatches[item.stallId] ||
                                    allDispatches[item.code] ||
                                    (item.stallId === 'A-06' ? allDispatches['D900-06'] : null) ||
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
                        );
                      }))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: THU PHÍ & TÀI CHÍNH TÁC CHIẾN (HỢP NHẤT TOÀN DIỆN) */}
        {activeKpiTab === 'billing' && (
          <div className="pt-1">
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

            {/* Modal Footer: Đúng 2 nút nghiệp vụ trọng tâm (Đóng phản ánh & Gọi người điều phối) */}
            <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-[#DCE8F1] bg-[#F5FAF8]">
              {/* 1. Nút Đóng phản ánh */}
              {!isComplaintResolved(selectedComplaint.code) && !isComplaintResolved(selectedComplaint.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    const primaryCode = selectedComplaint.code || selectedComplaint.id;
                    handleResolveComplaint(primaryCode, selectedComplaint.id);
                    setDispatchSuccessMsg(
                      `Đã nghiệm thu và đóng phản ánh ${selectedComplaint.code} thành công! Trạng thái chuyển sang: Đã giải quyết.`
                    );
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#0B7A3A] hover:bg-[#075A2B] text-white text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Đóng phản ánh</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Hồ sơ đã đóng hoàn tất</span>
                </div>
              )}

              {/* 2. Nút Gọi người điều phối */}
              <a
                href={`tel:${selectedComplaint.coordinator.phone.replace(/[^0-9]/g, '')}`}
                onClick={() => {
                  setDispatchSuccessMsg(
                    `Đang kết nối cuộc gọi thoại tới Đ/c ${selectedComplaint.coordinator.name} (${selectedComplaint.coordinator.phone})...`
                  );
                }}
                className="px-4 py-2.5 rounded-xl bg-[#153154] hover:bg-[#0E2038] text-white text-xs font-black transition-transform hover:-translate-y-0.5 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 animate-bounce" />
                <span>Gọi người điều phối</span>
              </a>
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
                    {quickMapStall.name} • {marketTitle}
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

              {/* Sơ đồ mặt bằng vector trực quan với 5 phân khu chuẩn Chợ Đồng Xuân & ghim sạp động */}
              <div className="relative w-full h-72 sm:h-80 bg-[#F8FAFC] rounded-xl border border-[#DCE8F1] overflow-hidden flex items-center justify-center p-2 sm:p-3">
                {(() => {
                  const getTargetStallPosition = (rawCode?: string) => {
                    let code = rawCode || 'A-06';
                    if (code === 'D900-06') code = 'A-06';
                    if (code === 'D900-01') code = 'A-01';
                    if (code === 'D900-03') code = 'A-03';
                    if (code === 'D900-08') code = 'C-04';
                    if (code === 'D04-05') code = 'B-06';
                    if (code === 'D04-06') code = 'E-01';
                    if (code === 'D04-07') code = 'D-01';
                    if (code === 'D04-08') code = 'D-04';
                    if (code === 'D04-09') code = 'D-02';
                    if (code === 'D04-10') code = 'B-08';
                    if (code === 'CỔNG-BẮC') code = 'C-01';

                    const COORDS: Record<string, { x: number; y: number; w: number; h: number }> = {
                      'A-01': { x: 26, y: 66, w: 40, h: 24 },
                      'A-02': { x: 72, y: 66, w: 40, h: 24 },
                      'A-03': { x: 118, y: 66, w: 40, h: 24 },
                      'A-04': { x: 26, y: 98, w: 40, h: 24 },
                      'A-05': { x: 72, y: 98, w: 40, h: 24 },
                      'A-06': { x: 118, y: 98, w: 40, h: 24 },
                      'A-07': { x: 118, y: 98, w: 40, h: 24 },
                      'B-01': { x: 439, y: 66, w: 40, h: 24 },
                      'B-02': { x: 485, y: 66, w: 40, h: 24 },
                      'B-03': { x: 531, y: 66, w: 40, h: 24 },
                      'B-05': { x: 439, y: 98, w: 40, h: 24 },
                      'B-06': { x: 485, y: 98, w: 40, h: 24 },
                      'B-08': { x: 531, y: 98, w: 40, h: 24 },
                      'D-01': { x: 210, y: 105, w: 56, h: 28 },
                      'D-02': { x: 272, y: 105, w: 56, h: 28 },
                      'D-03': { x: 334, y: 105, w: 56, h: 28 },
                      'D-04': { x: 210, y: 148, w: 56, h: 28 },
                      'D-05': { x: 272, y: 148, w: 56, h: 28 },
                      'D-06': { x: 334, y: 148, w: 56, h: 28 },
                      'C-01': { x: 26, y: 180, w: 40, h: 24 },
                      'C-02': { x: 72, y: 180, w: 40, h: 24 },
                      'C-03': { x: 118, y: 180, w: 40, h: 24 },
                      'C-04': { x: 26, y: 212, w: 40, h: 24 },
                      'C-05': { x: 72, y: 212, w: 40, h: 24 },
                      'C-06': { x: 118, y: 212, w: 40, h: 24 },
                      'E-01': { x: 439, y: 180, w: 40, h: 24 },
                      'E-02': { x: 485, y: 180, w: 40, h: 24 },
                      'E-03': { x: 531, y: 180, w: 40, h: 24 },
                      'E-04': { x: 439, y: 212, w: 40, h: 24 },
                      'E-05': { x: 485, y: 212, w: 40, h: 24 },
                      'E-06': { x: 531, y: 212, w: 40, h: 24 }
                    };

                    if (COORDS[code]) {
                      return { ...COORDS[code], normalizedCode: code };
                    }
                    if (code.startsWith('A-')) return { x: 72, y: 98, w: 40, h: 24, normalizedCode: code };
                    if (code.startsWith('B-')) return { x: 485, y: 98, w: 40, h: 24, normalizedCode: code };
                    if (code.startsWith('C-')) return { x: 72, y: 212, w: 40, h: 24, normalizedCode: code };
                    if (code.startsWith('D-')) return { x: 272, y: 148, w: 56, h: 28, normalizedCode: code };
                    if (code.startsWith('E-')) return { x: 485, y: 212, w: 40, h: 24, normalizedCode: code };
                    return { x: 272, y: 148, w: 56, h: 28, normalizedCode: code };
                  };

                  const targetPos = getTargetStallPosition(quickMapStall.code);

                  return (
                    <svg viewBox="0 0 600 290" className="w-full h-full object-contain">
                      {/* Cổng chính Phố Hàng Khoai */}
                      <rect x="180" y="8" width="240" height="20" rx="4" fill="#172F55" />
                      <text x="300" y="22" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                        CỔNG 1 (BẮC) • PHỐ HÀNG KHOAI
                      </text>

                      {/* Cổng chính Phố Cầu Đông */}
                      <rect x="180" y="262" width="240" height="20" rx="4" fill="#172F55" />
                      <text x="300" y="276" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                        CỔNG 2 (NAM) • PHỐ CẦU ĐÔNG
                      </text>

                      {/* KHU A: THỰC PHẨM TƯƠI SỐNG (Tây Bắc) */}
                      <rect x="16" y="38" width="155" height="100" rx="8" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.5" />
                      <text x="93" y="56" textAnchor="middle" fill="#065F46" fontSize="10" fontWeight="bold">
                        Khu A · Tươi Sống
                      </text>
                      <rect x="26" y="66" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="46" y="82" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">A-01</text>
                      <rect x="72" y="66" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="92" y="82" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">A-02</text>
                      <rect x="118" y="66" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="138" y="82" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">A-03</text>
                      <rect x="26" y="98" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="46" y="114" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">A-04</text>
                      <rect x="72" y="98" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="92" y="114" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">A-05</text>
                      <rect x="118" y="98" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="138" y="114" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">A-06</text>

                      {/* KHU B: NÔNG SẢN & GIA VỊ KHÔ (Đông Bắc) */}
                      <rect x="429" y="38" width="155" height="100" rx="8" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="1.5" />
                      <text x="506" y="56" textAnchor="middle" fill="#92400E" fontSize="10" fontWeight="bold">
                        Khu B · Nông Sản Khô
                      </text>
                      <rect x="439" y="66" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="459" y="82" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">B-01</text>
                      <rect x="485" y="66" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="505" y="82" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">B-02</text>
                      <rect x="531" y="66" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="551" y="82" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">B-03</text>
                      <rect x="439" y="98" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="459" y="114" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">B-05</text>
                      <rect x="485" y="98" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="505" y="114" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">B-06</text>
                      <rect x="531" y="98" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="551" y="114" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">B-08</text>

                      {/* KHU D: BÁCH HÓA & ĐẶC SẢN (Trung Tâm) */}
                      <rect x="195" y="65" width="210" height="160" rx="8" fill="#F0F9FF" stroke="#0EA5E9" strokeWidth="1.5" />
                      <text x="300" y="88" textAnchor="middle" fill="#075985" fontSize="10" fontWeight="bold">
                        Khu D · Bách Hóa & Đặc Sản
                      </text>
                      <rect x="210" y="105" width="56" height="28" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="238" y="122" textAnchor="middle" fill="#64748B" fontSize="8.5" fontWeight="bold">D-01</text>
                      <rect x="272" y="105" width="56" height="28" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="300" y="122" textAnchor="middle" fill="#64748B" fontSize="8.5" fontWeight="bold">D-02</text>
                      <rect x="334" y="105" width="56" height="28" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="362" y="122" textAnchor="middle" fill="#64748B" fontSize="8.5" fontWeight="bold">D-03</text>
                      <rect x="210" y="148" width="56" height="28" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="238" y="165" textAnchor="middle" fill="#64748B" fontSize="8.5" fontWeight="bold">D-04</text>
                      <rect x="272" y="148" width="56" height="28" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="300" y="165" textAnchor="middle" fill="#64748B" fontSize="8.5" fontWeight="bold">D-05</text>
                      <rect x="334" y="148" width="56" height="28" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="362" y="165" textAnchor="middle" fill="#64748B" fontSize="8.5" fontWeight="bold">D-06</text>

                      {/* KHU C: ẨM THỰC (Tây Nam) */}
                      <rect x="16" y="152" width="155" height="100" rx="8" fill="#FFF1F2" stroke="#F43F5E" strokeWidth="1.5" />
                      <text x="93" y="170" textAnchor="middle" fill="#9F1239" fontSize="10" fontWeight="bold">
                        Khu C · Ẩm Thực
                      </text>
                      <rect x="26" y="180" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="46" y="196" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">C-01</text>
                      <rect x="72" y="180" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="92" y="196" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">C-02</text>
                      <rect x="118" y="180" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="138" y="196" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">C-03</text>
                      <rect x="26" y="212" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="46" y="228" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">C-04</text>
                      <rect x="72" y="212" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="92" y="228" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">C-05</text>
                      <rect x="118" y="212" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="138" y="228" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">C-06</text>

                      {/* KHU E: VẢI SỢI (Đông Nam) */}
                      <rect x="429" y="152" width="155" height="100" rx="8" fill="#F5F3FF" stroke="#8B5CF6" strokeWidth="1.5" />
                      <text x="506" y="170" textAnchor="middle" fill="#5B21B6" fontSize="10" fontWeight="bold">
                        Khu E · Vải Sợi
                      </text>
                      <rect x="439" y="180" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="459" y="196" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">E-01</text>
                      <rect x="485" y="180" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="505" y="196" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">E-02</text>
                      <rect x="531" y="180" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="551" y="196" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">E-03</text>
                      <rect x="439" y="212" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="459" y="228" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">E-04</text>
                      <rect x="485" y="212" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="505" y="228" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">E-05</text>
                      <rect x="531" y="212" width="40" height="24" rx="3" fill="#ffffff" stroke="#CBD5E1" strokeWidth="1" />
                      <text x="551" y="228" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">E-06</text>

                      {/* GHIM SẠP MỤC TIÊU VỚI RADAR BEACON ĐỎ NHẤP NHÁY */}
                      <g transform={`translate(${targetPos.x}, ${targetPos.y})`}>
                        <rect x="0" y="0" width={targetPos.w} height={targetPos.h} rx="4" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2.5" />
                        <text x={targetPos.w / 2} y={targetPos.h / 2 + 3.5} textAnchor="middle" fill="#991B1B" fontSize="9" fontWeight="900">
                          {targetPos.normalizedCode}
                        </text>
                        <circle cx={targetPos.w / 2} cy="0" r="10" fill="#EF4444" opacity="0.3" className="animate-ping" />
                        <circle cx={targetPos.w / 2} cy="0" r="4.5" fill="#DC2626" />
                      </g>
                    </svg>
                  );
                })()}
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
                  let targetCode = quickMapStall?.code || 'A-06';
                  if (targetCode === 'D900-06') targetCode = 'A-06';
                  if (targetCode === 'D900-01') targetCode = 'A-01';
                  if (targetCode === 'D900-03') targetCode = 'A-03';
                  if (targetCode === 'D900-08') targetCode = 'C-04';
                  if (targetCode === 'D04-05') targetCode = 'B-06';
                  if (targetCode === 'D04-06') targetCode = 'E-01';
                  if (targetCode === 'D04-07') targetCode = 'D-01';
                  if (targetCode === 'D04-08') targetCode = 'D-04';
                  if (targetCode === 'D04-09') targetCode = 'D-02';
                  if (targetCode === 'D04-10') targetCode = 'B-08';
                  if (targetCode === 'CỔNG-BẮC') targetCode = 'C-01';
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
