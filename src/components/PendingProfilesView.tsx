'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, CheckCircle2, Search, XCircle, X,
  User, Phone, MapPin, Calendar, Clock, ShieldCheck,
  FileText, Store, CreditCard, Sparkles, Building2,
  AlertTriangle, PhoneCall, ExternalLink, ChevronRight
} from 'lucide-react';
import { URGENT_ACTIONS } from '../data/mockMarketData';

interface PendingProfilesViewProps {
  onBackToMap: () => void;
  onNavigateToMap?: (stallCode: string) => void;
  applications?: any[];
  stalls?: any[];
  selectedMarketId?: string;
  onApproveApplication?: (id: string, stallId?: string, note?: string) => Promise<any> | void;
  onRejectApplication?: (id: string, reason?: string) => Promise<void> | void;
  onRequestSupplement?: (id: string, note?: string) => Promise<void> | void;
}

export interface PendingProfile {
  id: string;
  stallCode: string;
  stallZone: string;
  applicant: string;
  avatar?: string | null;
  phone: string;
  type: string;
  category: string;
  submittedDate: string;
  deadline: string;
  status: string;
  statusLabel: string;
  documents: string[];
  documentUrls?: string[];
  notes: string;
  idNumber?: string;
  birthDate?: string;
  hometown?: string;
  address?: string;
  experience?: string;
  acreage?: number;
  monthlyRent?: number;
  targetProducts?: string[];
  paymentMethods?: string;
  officerInCharge?: string;
  verificationItems?: { name: string; status: 'verified' | 'pending' | 'supplementary'; note: string }[];
}

function mapBackendApplications(apps: any[], stallsList?: any[], marketId?: string): PendingProfile[] {
  const filtered = marketId && marketId !== 'all' ? apps.filter((a) => a.marketId === marketId) : apps;
  if (!filtered || filtered.length === 0) return [];

  return filtered.map((app) => {
    const marketName = app.markets?.name || 'Chợ';
    const categoryName = app.categories?.name || 'Ngành hàng chung';

    // Xác định mã sạp
    let stallCode = app.desiredStallNote || 'Chờ gán sạp';
    if (stallsList && stallsList.length > 0) {
      const match = stallsList.find((s: any) => s.id === app.desiredStallNote || s.code === app.desiredStallNote);
      if (match) stallCode = match.code;
    }

    let status = 'pending';
    let statusLabel = 'Đang xử lý';
    if (app.status === 'approved') {
      status = 'approved';
      statusLabel = 'Đã phê duyệt';
    } else if (app.status === 'need_more_info') {
      status = 'supplementing';
      statusLabel = 'Chờ bổ sung giấy tờ';
    } else if (app.status === 'rejected') {
      status = 'rejected';
      statusLabel = 'Đã từ chối';
    } else if (app.status === 'cancelled') {
      status = 'cancelled';
      statusLabel = 'Đã hủy';
    } else {
      const created = app.createdAt ? new Date(app.createdAt).getTime() : Date.now();
      if (Date.now() - created > 48 * 3600000) {
        status = 'overdue';
        statusLabel = 'Quá hạn xử lý';
      }
    }

    const submittedDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay';
    const deadline = app.createdAt
      ? new Date(new Date(app.createdAt).getTime() + 3 * 86400000).toLocaleDateString('vi-VN')
      : '3 ngày tới';

    const documentUrls: string[] = [];
    const documents: string[] = [];
    if (app.documents && Array.isArray(app.documents)) {
      app.documents.forEach((d: any, idx: number) => {
        const url = typeof d === 'string' ? d : d.url;
        if (url) {
          documentUrls.push(url);
          documents.push(`Ảnh tài liệu #${idx + 1}`);
        }
      });
    }
    if (documents.length === 0) {
      documents.push('Đơn đăng ký qua Zalo Mini App', 'CCCD gắn chip');
    }

    return {
      id: app.id,
      stallCode,
      stallZone: `${marketName} — ${categoryName}`,
      applicant: app.fullName || app.applicant?.fullName || 'Tiểu thương Zalo',
      avatar: app.applicant?.avatar || null,
      phone: app.phone || app.applicant?.phone || '0908 *** ***',
      type: app.desiredStallNote ? `Đăng ký sạp (${app.desiredStallNote})` : 'Thuê mới sạp kinh doanh',
      category: categoryName,
      submittedDate,
      deadline,
      status,
      statusLabel,
      documents,
      documentUrls,
      notes: app.businessDescription || app.adminNote || 'Hồ sơ số hóa trực tiếp từ Zalo Mini App.',
      idNumber: app.idNumber || 'Đang cập nhật',
      address: marketName,
      targetProducts: app.businessDescription ? [app.businessDescription] : ['Mặt hàng đăng ký theo ngành'],
      officerInCharge: app.reviewer?.fullName || 'Ban Quản Lý Chợ',
      verificationItems: [
        { name: 'Xác thực định danh Zalo Mini App', status: 'verified', note: 'Đã liên kết Zalo ID chính chủ' },
        { name: 'Căn cước công dân (CCCD)', status: app.idNumber ? 'verified' : 'pending', note: app.idNumber ? `Số CCCD: ${app.idNumber}` : 'Chờ bổ sung CCCD' },
        { name: 'Mô tả ngành nghề kinh doanh', status: app.businessDescription ? 'verified' : 'pending', note: app.businessDescription || 'Chờ hoàn thiện mô tả' },
        { name: 'Tài liệu & Chứng chỉ đính kèm', status: documentUrls.length > 0 ? 'verified' : 'pending', note: `${documentUrls.length} tệp chứng từ đã tải lên` }
      ]
    };
  });
}

export default function PendingProfilesView({
  onBackToMap,
  onNavigateToMap,
  applications,
  stalls,
  selectedMarketId,
  onApproveApplication,
  onRejectApplication,
  onRequestSupplement,
}: PendingProfilesViewProps) {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState<{ message: string; stallCode?: string } | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PendingProfile | null>(null);
  const [selectedStallCode, setSelectedStallCode] = useState<string>('');

  const vacantStalls = useMemo(() => {
    if (!stalls || stalls.length === 0) return [];
    if (selectedMarketId && selectedMarketId !== 'all') {
      return stalls.filter((s) => s.status === 'vacant' && s.marketId === selectedMarketId);
    }
    return stalls.filter((s) => s.status === 'vacant');
  }, [stalls, selectedMarketId]);

  // Đóng modal bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedProfile) {
        setSelectedProfile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProfile]);

  const profilesList: PendingProfile[] = [
    {
      id: 'HS-2026-081',
      stallCode: 'A06',
      stallZone: 'Khu A — Thực phẩm tươi sống',
      applicant: 'Ngô Thanh Tùng',
      phone: '0912 334 556',
      type: 'Thuê mới sạp trống',
      category: 'Hải sản đông lạnh',
      submittedDate: '26/08/2026',
      deadline: '29/08/2026',
      status: 'overdue',
      statusLabel: 'Quá hạn xử lý (1 ngày)',
      documents: ['Đơn xin thuê sạp', 'CCCD công chứng', 'Giấy khám sức khỏe', 'Kế hoạch kinh doanh'],
      notes: 'Đã nộp đủ hồ sơ từ 4 ngày trước, chưa có cán bộ phụ trách thẩm tra.',
      idNumber: '001201004567',
      birthDate: '14/05/1982',
      hometown: 'Hải Phòng',
      address: 'Số 38 Phố Hàng Chiếu, Hoàn Kiếm, Hà Nội',
      experience: '12 năm kinh doanh thủy hải sản tại các chợ đầu mối miền Bắc',
      acreage: 12.5,
      monthlyRent: 4500000,
      targetProducts: ['Cá thu một nắng Cửa Lò', 'Tôm sú biển bóc nõn cấp đông', 'Mực ống câu Phú Quốc', 'Chả mực Hạ Long giã tay'],
      paymentMethods: 'Quét mã VietQR chuyển khoản (60%) + Tiền mặt (40%)',
      officerInCharge: 'Nguyễn Văn Quản Lý',
      verificationItems: [
        { name: 'Đơn xin thuê sạp kinh doanh mới', status: 'verified', note: 'Đã ký số & có cam kết quy chế chợ' },
        { name: 'CCCD gắn chip công chứng 2 mặt', status: 'verified', note: 'Khớp dữ liệu dân cư quốc gia' },
        { name: 'Giấy khám sức khỏe định kỳ đủ điều kiện', status: 'verified', note: 'BV Đa khoa Xanh Pôn cấp còn hạn 11 tháng' },
        { name: 'Chứng chỉ tập huấn An toàn thực phẩm', status: 'verified', note: 'Chi cục ATVSTP Hà Nội cấp' },
        { name: 'Hồ sơ chứng minh nguồn gốc hải sản', status: 'pending', note: 'Cần xác nhận lại hợp đồng tàu cá' }
      ]
    },
    {
      id: 'HS-2026-079',
      stallCode: 'B10',
      stallZone: 'Khu B — Rau củ & Trái cây',
      applicant: 'Lê Thu Hương',
      phone: '0988 221 443',
      type: 'Chuyển nhượng quyền thuê',
      category: 'Trái cây hữu cơ',
      submittedDate: '27/08/2026',
      deadline: '30/08/2026',
      status: 'overdue',
      statusLabel: 'Hạn chót hôm nay',
      documents: ['Hợp đồng chuyển nhượng', 'Văn bản chấp thuận của chủ cũ', 'CCCD'],
      notes: 'Sạp B10 vừa thanh lý mặt bằng, bên nhận chuyển nhượng muốn tiếp quản sớm.',
      idNumber: '001203009812',
      birthDate: '22/09/1988',
      hometown: 'Hưng Yên',
      address: 'Số 15 Phố Hàng Đậu, Ba Đình, Hà Nội',
      experience: '6 năm phân phối hoa quả hữu cơ Đà Lạt & Miền Tây',
      acreage: 10.5,
      monthlyRent: 3600000,
      targetProducts: ['Cam sành Hàm Yên', 'Xoài cát Hòa Lộc', 'Bưởi da xanh Bến Tre', 'Nho mẫu đơn hữu cơ'],
      paymentMethods: 'VietQR / Napas247 không tiền mặt (80%)',
      officerInCharge: 'Trần Thị Thu Hà',
      verificationItems: [
        { name: 'Văn bản chuyển nhượng quyền sử dụng sạp B10', status: 'verified', note: 'Chủ cũ đã ký xác nhận bàn giao' },
        { name: 'Biên bản thanh lý công nợ điện nước sạp B10', status: 'verified', note: 'Không còn dư nợ tồn' },
        { name: 'Bản sao CCCD công chứng bên nhận chuyển nhượng', status: 'verified', note: 'Đầy đủ, hợp lệ' },
        { name: 'Chứng nhận VietGAP vườn trồng', status: 'verified', note: 'Hợp tác xã nông nghiệp cấp' }
      ]
    },
    {
      id: 'HS-2026-084',
      stallCode: 'C05',
      stallZone: 'Khu C — Nhu yếu phẩm',
      applicant: 'Đặng Ngọc Anh',
      phone: '0937 665 544',
      type: 'Bổ sung chứng nhận ATTP',
      category: 'Dầu ăn & Nước mắm',
      submittedDate: '29/08/2026',
      deadline: '02/09/2026',
      status: 'pending',
      statusLabel: 'Đang xử lý',
      documents: ['Giấy chứng nhận cơ sở đủ ĐK ATTP', 'Kết quả xét nghiệm mẫu'],
      notes: 'Bổ sung giấy tờ định kỳ năm 2026.',
      idNumber: '001200007890',
      birthDate: '03/11/1985',
      hometown: 'Nghệ An',
      address: 'Số 78 Phố Cầu Đông, Hoàn Kiếm, Hà Nội',
      experience: '9 năm kinh doanh gia vị & nước mắm truyền thống',
      acreage: 11.0,
      monthlyRent: 4200000,
      targetProducts: ['Nước mắm Cốt Ba Làng', 'Nước mắm Phú Quốc 40 độ đạm', 'Dầu đậu nành ép lạnh'],
      paymentMethods: 'VietQR + Tiền mặt',
      officerInCharge: 'Nguyễn Văn Quản Lý',
      verificationItems: [
        { name: 'Giấy chứng nhận cơ sở đủ ĐK ATTP', status: 'verified', note: 'Số cấp: 128/2026/ATTP-HN' },
        { name: 'Kết quả xét nghiệm mẫu sản phẩm định kỳ', status: 'verified', note: 'Viện Kiểm nghiệm ATVSTP Quốc gia' }
      ]
    },
    {
      id: 'HS-2026-085',
      stallCode: 'B07',
      stallZone: 'Khu B — Rau củ & Trái cây',
      applicant: 'Trần Văn Tuấn',
      phone: '0975 889 900',
      type: 'Gia hạn hợp đồng thuê sạp',
      category: 'Rau sạch Mộc Châu',
      submittedDate: '30/08/2026',
      deadline: '04/09/2026',
      status: 'pending',
      statusLabel: 'Đang xử lý',
      documents: ['Đơn xin gia hạn hợp đồng', 'Báo cáo doanh thu', 'Xác nhận nộp phí'],
      notes: 'Hợp đồng hiện tại còn 12 ngày, tiểu thương đề xuất gia hạn thêm 2 năm.',
      idNumber: '001198006543',
      birthDate: '19/07/1979',
      hometown: 'Sơn La',
      address: 'Số 12 Ngõ Gạch, Hàng Buồm, Hoàn Kiếm, Hà Nội',
      experience: '15 năm tiểu thương kỳ cựu Chợ Đồng Xuân',
      acreage: 10.0,
      monthlyRent: 3500000,
      targetProducts: ['Cải mèo Mộc Châu', 'Su su Tam Đảo', 'Cà chua organic', 'Khoai tây Đà Lạt'],
      paymentMethods: 'Quét mã VietQR 100%',
      officerInCharge: 'Trần Thị Thu Hà',
      verificationItems: [
        { name: 'Đơn xin gia hạn hợp đồng thuê sạp', status: 'verified', note: 'Đề xuất gia hạn 2 năm tiếp theo' },
        { name: 'Xác nhận chấp hành tốt quy chế PCCC & Vệ sinh 2025', status: 'verified', note: 'Đội trật tự ký xác nhận' },
        { name: 'Báo cáo nộp phí dịch vụ đầy đủ không nợ đọng', status: 'verified', note: 'Kế toán xác nhận' }
      ]
    },
    {
      id: 'HS-2026-088',
      stallCode: 'D900-04',
      stallZone: 'Khu Thực phẩm tươi 1',
      applicant: 'Hoàng Minh Trí',
      phone: '0903 456 789',
      type: 'Thuê mới sạp trống',
      category: 'Thịt lợn sinh học & Giò chả',
      submittedDate: '31/08/2026',
      deadline: '05/09/2026',
      status: 'pending',
      statusLabel: 'Đang xử lý',
      documents: ['Đơn xin thuê sạp', 'CCCD công chứng', 'Chứng nhận kiểm dịch thú y'],
      notes: 'Đăng ký từ Mini App, đã nộp kèm giấy khám sức khỏe và cam kết an toàn sinh học.',
      idNumber: '001202008765',
      birthDate: '08/12/1991',
      hometown: 'Bắc Ninh',
      address: 'Số 56 Phố Hàng Khoai, Hoàn Kiếm, Hà Nội',
      experience: '5 năm phát triển chuỗi thực phẩm sạch online',
      acreage: 11.0,
      monthlyRent: 3600000,
      targetProducts: ['Thịt lợn giun quế hữu cơ', 'Giò lụa Ước Lễ truyền thống', 'Chả quế nướng mật ong'],
      paymentMethods: 'Quét mã QR qua Smartmarket Mini App',
      officerInCharge: 'Lê Văn Khoa',
      verificationItems: [
        { name: 'Đơn đăng ký qua Smartmarket Mini App', status: 'verified', note: 'Dữ liệu số hóa đồng bộ' },
        { name: 'Chứng nhận kiểm dịch thú y chuỗi trang trại', status: 'verified', note: 'Chi cục Thú y cấp' },
        { name: 'Bản cam kết không sử dụng chất cấm & chất tạo nạc', status: 'verified', note: 'Có công chứng' }
      ]
    },
    {
      id: 'HS-2026-090',
      stallCode: 'D04-02',
      stallZone: 'Khu Nông sản 2',
      applicant: 'Nguyễn Thị Mai',
      phone: '0914 222 333',
      type: 'Cập nhật người đại diện hộ kinh doanh',
      category: 'Gạo & Ngũ cốc Tây Bắc',
      submittedDate: '01/09/2026',
      deadline: '06/09/2026',
      status: 'pending',
      statusLabel: 'Đang xử lý',
      documents: ['Văn bản ủy quyền gia đình', 'Đăng ký kinh doanh sửa đổi', 'CCCD'],
      notes: 'Chuyển giao quyền đứng tên hộ kinh doanh gia đình cho con gái, đã có văn bản công chứng.',
      idNumber: '001204001234',
      birthDate: '05/03/1995',
      hometown: 'Hà Nội',
      address: 'Số 9 Phố Hàng Mã, Hoàn Kiếm, Hà Nội',
      experience: 'Kế thừa hộ kinh doanh gia đình truyền thống',
      acreage: 10.0,
      monthlyRent: 3400000,
      targetProducts: ['Gạo ST25 Ông Cua', 'Gạo nếp nương Điện Biên', 'Hạt sen sấy giòn Hưng Yên'],
      paymentMethods: 'VietQR + Tiền mặt',
      officerInCharge: 'Nguyễn Văn Quản Lý',
      verificationItems: [
        { name: 'Văn bản ủy quyền gia đình có công chứng', status: 'verified', note: 'Phòng Công chứng số 1 Hà Nội' },
        { name: 'Đăng ký kinh doanh sửa đổi của UBND Quận', status: 'verified', note: 'Đã hoàn tất thủ tục' }
      ]
    },
    {
      id: 'HS-2026-092',
      stallCode: 'A15',
      stallZone: 'Khu A — Thực phẩm tươi sống',
      applicant: 'Phan Thanh Hà',
      phone: '0989 112 445',
      type: 'Bổ sung cam kết nguồn gốc xuất xứ',
      category: 'Thủy hải sản tươi Quảng Ninh',
      submittedDate: '02/09/2026',
      deadline: '07/09/2026',
      status: 'pending',
      statusLabel: 'Đang xử lý',
      documents: ['Bảng kê chứng từ nguồn gốc', 'Hóa đơn nhập cảng', 'Cam kết niêm yết giá'],
      notes: 'Nộp bổ sung bảng kê chứng từ nguồn gốc hải sản theo yêu cầu của Đội Quản lý thị trường.',
      idNumber: '001201005678',
      birthDate: '17/10/1987',
      hometown: 'Quảng Ninh',
      address: 'Số 102 Phố Hàng Giấy, Đồng Xuân, Hoàn Kiếm, Hà Nội',
      experience: '7 năm vận hành vựa hải sản Cô Tô - Vân Đồn',
      acreage: 12.0,
      monthlyRent: 4600000,
      targetProducts: ['Cua biển Cà Mau', 'Ghẹ xanh Cô Tô', 'Tu hài Vân Đồn', 'Bề bề thuyền bơi oxy'],
      paymentMethods: 'Quét mã VietQR + Tiền mặt',
      officerInCharge: 'Lê Văn Khoa',
      verificationItems: [
        { name: 'Bảng kê chứng từ nguồn gốc hải sản nhập cảng', status: 'verified', note: 'Có xác nhận của Cảng Cái Rồng' },
        { name: 'Hóa đơn nhập hàng theo chuyến tàu', status: 'verified', note: 'Đầy đủ chứng từ GTGT' },
        { name: 'Bản cam kết niêm yết giá bán công khai', status: 'verified', note: 'Đội QLTT yêu cầu' }
      ]
    }
  ];

  const initialProfiles = useMemo(() => {
    if (applications && applications.length > 0) {
      const mapped = mapBackendApplications(applications, stalls, selectedMarketId);
      if (mapped.length > 0) return mapped;
    }
    return profilesList;
  }, [applications, stalls, selectedMarketId]);

  const [profiles, setProfiles] = useState<PendingProfile[]>(initialProfiles);

  useEffect(() => {
    setProfiles(initialProfiles);
  }, [initialProfiles]);

  const handleApprove = async (item: PendingProfile, customStallCode?: string) => {
    const allocatedCode = customStallCode || selectedStallCode || item.stallCode;
    const targetStall = stalls?.find((s) => s.code === allocatedCode || s.id === allocatedCode);
    const targetStallId = targetStall?.id;

    if (onApproveApplication) {
      try {
        if (targetStallId) {
          await onApproveApplication(item.id, targetStallId);
        } else {
          await onApproveApplication(item.id);
        }
      } catch (e) {
        console.warn('onApproveApplication error:', e);
      }
    }
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === item.id
          ? {
              ...p,
              stallCode: allocatedCode,
              status: 'approved',
              statusLabel: 'Đã phê duyệt',
              notes: `${p.notes} • BQL đã ký duyệt hồ sơ & cấp sạp ${allocatedCode} vào ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} hôm nay.`
            }
          : p
      )
    );
    if (selectedProfile && selectedProfile.id === item.id) {
      setSelectedProfile((prev) => prev ? {
        ...prev,
        stallCode: allocatedCode,
        status: 'approved',
        statusLabel: 'Đã phê duyệt',
        notes: `${prev.notes} • BQL đã ký duyệt hồ sơ & cấp sạp ${allocatedCode} vào ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} hôm nay.`
      } : null);
    }
    setActionNotice({
      message: `Đã phê duyệt thành công hồ sơ ${item.id} cho tiểu thương ${item.applicant}! Đã cấp quyền sử dụng sạp ${allocatedCode}.`,
      stallCode: allocatedCode,
    });
    setTimeout(() => setActionNotice(null), 8000);
  };

  const handleRequestSupplement = async (item: PendingProfile) => {
    if (onRequestSupplement) {
      try {
        await onRequestSupplement(item.id, 'Vui lòng bổ sung giấy tờ và hình ảnh xác thực');
      } catch (e) {
        console.warn('onRequestSupplement error:', e);
      }
    }
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === item.id
          ? {
              ...p,
              status: 'supplementing',
              statusLabel: 'Chờ bổ sung giấy tờ',
              notes: `${p.notes} • Đã gửi yêu cầu bổ sung giấy tờ qua Zalo lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.`
            }
          : p
      )
    );
    if (selectedProfile && selectedProfile.id === item.id) {
      setSelectedProfile((prev) => prev ? {
        ...prev,
        status: 'supplementing',
        statusLabel: 'Chờ bổ sung giấy tờ',
        notes: `${prev.notes} • Đã gửi yêu cầu bổ sung giấy tờ qua Zalo lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.`
      } : null);
    }
    setActionNotice({ message: `Đã phát thông báo yêu cầu bổ sung hồ sơ ${item.id} tới SĐT ${item.phone} của tiểu thương ${item.applicant}.` });
    setTimeout(() => setActionNotice(null), 5000);
  };

  const filtered = profiles.filter((p) => {
    if (filterType === 'overdue' && p.status !== 'overdue') return false;
    if (filterType === 'pending' && p.status !== 'pending') return false;
    if (filterType === 'approved' && p.status !== 'approved') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.applicant.toLowerCase().includes(q) || p.stallCode.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPendingProfiles = profiles.length;
  const overdueProfiles = profiles.filter((p) => p.status === 'overdue').length;
  const pendingProfiles = profiles.filter((p) => p.status === 'pending').length;
  const approvedProfiles = profiles.filter((p) => p.status === 'approved').length;

  return (
    <div className="max-w-full overflow-hidden rounded border border-slate-200 bg-white p-4 text-xs shadow-xs font-sans">
      {/* Thông báo hành động kèm nút xem sạp trên sơ đồ */}
      {actionNotice && (
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 p-3.5 text-xs text-emerald-950 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{actionNotice.message}</span>
          </div>
          {actionNotice.stallCode && onNavigateToMap && (
            <button
              type="button"
              onClick={() => onNavigateToMap(actionNotice.stallCode!)}
              className="px-3.5 py-1.5 rounded-lg bg-[#0B7A3A] hover:bg-[#075A2B] text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Xem sạp {actionNotice.stallCode} trên sơ đồ chợ</span>
            </button>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onBackToMap}
            className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded bg-slate-100 px-3 py-2 font-bold text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Về sơ đồ mặt bằng
          </button>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              Thẩm Định Hồ Sơ Đăng Ký & Chuyển Nhượng Sạp
            </h2>
            <p className="text-[11px] text-slate-500">
              Tổng cộng có <strong className="font-mono">{totalPendingProfiles}</strong> hồ sơ ({overdueProfiles} quá hạn SLA, {pendingProfiles} đang xử lý{approvedProfiles > 0 ? `, ${approvedProfiles} đã duyệt` : ''})
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative block min-w-0 sm:w-64">
            <span className="sr-only">Tìm hồ sơ theo tiểu thương hoặc mã sạp</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tiểu thương hoặc mã sạp"
              className="min-h-11 w-full rounded border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </label>
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            aria-pressed={filterType === 'all'}
            onClick={() => setFilterType('all')}
            className={`min-h-11 flex-none cursor-pointer rounded px-3 py-2 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Tất cả ({totalPendingProfiles})
          </button>
          <button
            type="button"
            aria-pressed={filterType === 'overdue'}
            onClick={() => setFilterType('overdue')}
            className={`min-h-11 flex-none cursor-pointer rounded px-3 py-2 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              filterType === 'overdue' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800'
            }`}
          >
            Quá hạn ({overdueProfiles})
          </button>
          <button
            type="button"
            aria-pressed={filterType === 'pending'}
            onClick={() => setFilterType('pending')}
            className={`min-h-11 flex-none cursor-pointer rounded px-3 py-2 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              filterType === 'pending' ? 'bg-amber-500 text-slate-950' : 'bg-amber-50 text-amber-800'
            }`}
          >
            Đang xử lý ({pendingProfiles})
          </button>
          {approvedProfiles > 0 && (
            <button
              type="button"
              aria-pressed={filterType === 'approved'}
              onClick={() => setFilterType('approved')}
              className={`min-h-11 flex-none cursor-pointer rounded px-3 py-2 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                filterType === 'approved' ? 'bg-[#0B7A3A] text-white' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              Đã duyệt ({approvedProfiles})
            </button>
          )}
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-900 font-bold shadow-xs animate-in fade-in">
          <span className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{actionNotice.message}</span>
          </span>
          <div className="flex items-center gap-2">
            {actionNotice.stallCode && onNavigateToMap && (
              <button
                type="button"
                onClick={() => onNavigateToMap(actionNotice.stallCode!)}
                className="px-3 py-1 rounded-lg bg-[#0B7A3A] hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>Xem sạp {actionNotice.stallCode} trên sơ đồ</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="flex min-h-8 min-w-8 items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-100 cursor-pointer"
              aria-label="Đóng thông báo xử lý hồ sơ"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div data-testid="pending-profile-grid" className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {filtered.map((item) => (
          <div 
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedProfile(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedProfile(item);
              }
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:border-[#0B7A3A]/60 group relative ${
              item.status === 'approved'
                ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200'
                : item.status === 'overdue'
                ? 'bg-rose-50/40 border-rose-300'
                : item.status === 'supplementing'
                ? 'bg-amber-50/30 border-amber-300'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="font-mono font-bold text-[10px] text-slate-400 block">{item.id}</span>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-[#0B7A3A] transition-colors flex items-center gap-1.5">
                  <span>{item.applicant}</span>
                  <span className="text-[10px] text-slate-400 font-normal group-hover:text-[#0B7A3A]">↗</span>
                </h3>
                <span className="text-xs text-slate-500 font-sans">{item.type}</span>
              </div>
              <div className="shrink-0 sm:text-right">
                {onNavigateToMap ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToMap(item.stallCode);
                    }}
                    title={`Xem sạp ${item.stallCode} trên sơ đồ quy hoạch`}
                    className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-slate-900 hover:bg-[#0B7A3A] text-white inline-flex items-center gap-1 mb-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>SẠP {item.stallCode}</span>
                  </button>
                ) : (
                  <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-slate-900 text-white inline-block mb-1">
                    SẠP {item.stallCode}
                  </span>
                )}
                <div className={`text-[10px] font-bold ${
                  item.status === 'approved'
                    ? 'text-emerald-700'
                    : item.status === 'overdue'
                    ? 'text-rose-700'
                    : 'text-amber-700'
                }`}>
                  {item.statusLabel}
                </div>
              </div>
            </div>

            <div className="text-slate-600 space-y-1 my-2 text-[11px]">
              <div>Ngành hàng: <strong className="text-slate-800">{item.category}</strong></div>
              <div>Số điện thoại: <strong className="font-mono text-slate-800">{item.phone}</strong></div>
              <div>Ghi chú: <span className="italic text-slate-700">{item.notes}</span></div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Nộp ngày: {item.submittedDate}</span>
                <span className="text-[10px] font-bold text-[#0B7A3A] group-hover:underline flex items-center gap-0.5">
                  <span>Xem chi tiết</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center" onClick={(e) => e.stopPropagation()}>
                {item.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã phê duyệt hồ sơ</span>
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(item);
                      }}
                      className="min-h-11 cursor-pointer rounded-lg bg-[#0B7A3A] hover:bg-[#075A2B] px-3.5 py-2 font-bold text-white shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      Phê duyệt
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestSupplement(item);
                      }}
                      className="min-h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      Yêu cầu bổ sung
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* MODAL CHI TIẾT HỒ SƠ TIỂU THƯƠNG (MERCHANT PROFILE DOSSIER MODAL) */}
      {/* ========================================================================= */}
      {selectedProfile && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trader-profile-modal-title"
          onClick={() => setSelectedProfile(null)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0B7A3A] to-[#153154] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                  {selectedProfile.avatar ? (
                    <img src={selectedProfile.avatar} alt={selectedProfile.applicant} className="w-full h-full object-cover" />
                  ) : (
                    selectedProfile.applicant.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="trader-profile-modal-title" className="text-base font-black text-slate-900">
                      {selectedProfile.applicant}
                    </h3>
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                      SẠP {selectedProfile.stallCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono font-bold text-[#1974C8]">{selectedProfile.id}</span>
                    <span>•</span>
                    <span>{selectedProfile.type}</span>
                    <span>•</span>
                    <span className={`font-bold ${
                      selectedProfile.status === 'approved'
                        ? 'text-emerald-700'
                        : selectedProfile.status === 'overdue'
                        ? 'text-rose-700'
                        : 'text-amber-700'
                    }`}>
                      {selectedProfile.statusLabel}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                aria-label="Đóng chi tiết hồ sơ tiểu thương"
                className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* KHỐI 1: THÔNG TIN NHÂN THÂN & PHÁP LÝ TIỂU THƯƠNG */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-black text-[#0B7A3A] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#0B7A3A]" />
                    <span>THÔNG TIN NHÂN THÂN & PHÁP LÝ TIỂU THƯƠNG</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Đã xác thực CCCD gắn chip
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-500">Số định danh / CCCD:</span>{' '}
                    <strong className="font-mono text-slate-900 font-bold">{selectedProfile.idNumber || '001201004567'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Ngày sinh & Quê quán:</span>{' '}
                    <strong className="text-slate-900">{selectedProfile.birthDate || '14/05/1982'} ({selectedProfile.hometown || 'Hà Nội'})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Số điện thoại liên lạc:</span>{' '}
                    <strong className="font-mono text-slate-900 font-bold">{selectedProfile.phone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Thâm niên kinh doanh:</span>{' '}
                    <strong className="text-slate-900">{selectedProfile.experience || '8 năm kinh doanh truyền thống'}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">Địa chỉ thường trú:</span>{' '}
                    <strong className="text-slate-900">{selectedProfile.address || 'Số 38 Phố Hàng Chiếu, Hoàn Kiếm, Hà Nội'}</strong>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: THÔNG TIN MẶT BẰNG & PHƯƠNG ÁN KINH DOANH */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-[11px] font-black text-[#1974C8] uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-[#1974C8]" />
                    <span>MẶT BẰNG & PHƯƠNG ÁN KINH DOANH ĐĂNG KÝ</span>
                  </span>
                  {onNavigateToMap && (
                    <button
                      type="button"
                      onClick={() => {
                        const code = selectedProfile.stallCode;
                        setSelectedProfile(null);
                        onNavigateToMap(code);
                      }}
                      className="text-[11px] font-bold text-[#0B7A3A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Xem vị trí sạp trên sơ đồ</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-500">Phân khu quy hoạch:</span>{' '}
                    <strong className="text-slate-900">{selectedProfile.stallZone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Diện tích sạp:</span>{' '}
                    <strong className="text-slate-900 font-mono">{selectedProfile.acreage || 12.0} m²</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Ngành hàng chủ đạo:</span>{' '}
                    <strong className="text-[#0B7A3A] font-bold">{selectedProfile.category}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Mức phí thuê dự kiến:</span>{' '}
                    <strong className="text-slate-900 font-mono font-bold">
                      {new Intl.NumberFormat('vi-VN').format(selectedProfile.monthlyRent || 4000000)}đ / tháng
                    </strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">Phương thức thanh toán:</span>{' '}
                    <strong className="text-slate-900">{selectedProfile.paymentMethods || 'VietQR chuyển khoản & Tiền mặt'}</strong>
                  </div>
                </div>

                {selectedProfile.targetProducts && (
                  <div className="pt-2 border-t border-dashed border-slate-200">
                    <span className="text-slate-500 block mb-1.5 font-bold">Danh mục mặt hàng đăng ký bán:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProfile.targetProducts.map((prod, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-bold shadow-2xs">
                          {prod}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* LỰA CHỌN SẠP THỰC TẾ PHÂN BỔ TRƯỚC KHI DUYỆT */}
                {selectedProfile.status !== 'approved' && (
                  <div className="pt-3 border-t border-slate-200 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                    <label className="text-xs font-bold text-[#153154] flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-[#0B7A3A]" />
                        <span>Chỉ định sạp kinh doanh trên sơ đồ chợ:</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {vacantStalls.length} sạp trống sẵn sàng
                      </span>
                    </label>
                    <select
                      value={selectedStallCode || selectedProfile.stallCode}
                      onChange={(e) => setSelectedStallCode(e.target.value)}
                      className="w-full text-xs font-bold py-2 px-3 rounded-lg border border-emerald-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B7A3A]"
                    >
                      <option value={selectedProfile.stallCode}>
                        Sạp mặc định: {selectedProfile.stallCode} ({selectedProfile.stallZone})
                      </option>
                      {vacantStalls
                        .filter((s) => s.code !== selectedProfile.stallCode)
                        .map((s) => (
                          <option key={s.id} value={s.code}>
                            Sạp {s.code} — {s.name || s.zones?.name || 'Sạp trống'} ({s.acreage || 12} m² - {s.basePrice ? `${(s.basePrice/1000000).toFixed(1)} tr/tháng` : 'Tiêu chuẩn'})
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Sau khi phê duyệt, tiểu thương sẽ lập tức xuất hiện tại vị trí sạp này trên sơ đồ mặt bằng tương tác.
                    </p>
                  </div>
                )}
              </div>

              {/* KHỐI 3: DANH MỤC HỒ SƠ & GIẤY TỜ THẨM ĐỊNH PHÁP LÝ */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-700" />
                    <span>HỒ SƠ & GIẤY TỜ ĐÍNH KÈM THẨM ĐỊNH</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {selectedProfile.documents.length} văn bản đính kèm
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {(selectedProfile.verificationItems || selectedProfile.documents.map((doc) => ({
                    name: doc,
                    status: 'verified' as const,
                    note: 'Hồ sơ số hóa hợp lệ'
                  }))).map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 italic shrink-0">
                        {item.note}
                      </span>
                    </div>
                  ))}
                </div>

                {selectedProfile.documentUrls && selectedProfile.documentUrls.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700 block mb-2">Ảnh tài liệu gốc đính kèm:</span>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedProfile.documentUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative group/doc block w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-[#0B7A3A] shadow-xs">
                          <img src={url} alt={`Tài liệu ${i + 1}`} className="w-full h-full object-cover group-hover/doc:scale-105 transition-transform" />
                          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover/doc:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">Xem ảnh</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* KHỐI 4: Ý KIẾN THẨM TRA & GHI CHÚ BAN QUẢN LÝ */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>GHI CHÚ THẨM TRA HIỆN TRƯỜNG</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Hạn xử lý: {selectedProfile.deadline}
                  </span>
                </div>
                <p className="text-xs text-amber-950 font-medium leading-relaxed">
                  {selectedProfile.notes}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 text-[11px] text-amber-900">
                  <span>Cán bộ phụ trách: <strong>{selectedProfile.officerInCharge || 'Nguyễn Văn Quản Lý'}</strong></span>
                  <span>Ngày nộp: <strong>{selectedProfile.submittedDate}</strong></span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-5 py-3.5 border-t border-slate-200 bg-[#F8FAFC]">
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`tel:${selectedProfile.phone}`}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#0B7A3A]" />
                  <span>Gọi tiểu thương</span>
                </a>

                {selectedProfile.status === 'approved' ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Hồ sơ đã phê duyệt</span>
                    </span>
                    {onNavigateToMap && (
                      <button
                        type="button"
                        onClick={() => {
                          const code = selectedProfile.stallCode;
                          setSelectedProfile(null);
                          onNavigateToMap(code);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#0B7A3A] hover:bg-[#075A2B] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Xem sạp {selectedProfile.stallCode} trên sơ đồ</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRequestSupplement(selectedProfile)}
                      className="px-3.5 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Yêu cầu bổ sung
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedProfile)}
                      className="px-4 py-2 rounded-xl bg-[#0B7A3A] hover:bg-[#075A2B] text-white text-xs font-black transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Phê duyệt & Cấp sạp</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

