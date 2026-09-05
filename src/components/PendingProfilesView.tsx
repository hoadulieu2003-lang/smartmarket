'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, Search, XCircle,
} from 'lucide-react';
import { URGENT_ACTIONS } from '../data/mockMarketData';

interface PendingProfilesViewProps {
  onBackToMap: () => void;
}

export default function PendingProfilesView({ onBackToMap }: PendingProfilesViewProps) {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const profilesList = [
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
      notes: 'Đã nộp đủ hồ sơ từ 4 ngày trước, chưa có cán bộ phụ trách thẩm tra.'
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
      notes: 'Sạp B10 vừa thanh lý mặt bằng, bên nhận chuyển nhượng muốn tiếp quản sớm.'
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
      notes: 'Bổ sung giấy tờ định kỳ năm 2026.'
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
      notes: 'Hợp đồng hiện tại còn 12 ngày, tiểu thương đề xuất gia hạn thêm 2 năm.'
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
      notes: 'Đăng ký từ Mini App, đã nộp kèm giấy khám sức khỏe và cam kết an toàn sinh học.'
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
      notes: 'Chuyển giao quyền đứng tên hộ kinh doanh gia đình cho con gái, đã có văn bản công chứng.'
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
      notes: 'Nộp bổ sung bảng kê chứng từ nguồn gốc hải sản theo yêu cầu của Đội Quản lý thị trường.'
    }
  ];

  const [profiles, setProfiles] = useState(profilesList);

  const handleApprove = (item: typeof profilesList[0]) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === item.id
          ? {
              ...p,
              status: 'approved',
              statusLabel: 'Đã phê duyệt',
              notes: `${p.notes} • BQL đã ký duyệt hồ sơ vào ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} hôm nay.`
            }
          : p
      )
    );
    setActionNotice(`Đã phê duyệt thành công hồ sơ ${item.id} cho tiểu thương ${item.applicant}! Đã cấp quyền sử dụng sạp ${item.stallCode}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRequestSupplement = (item: typeof profilesList[0]) => {
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
    setActionNotice(`Đã phát thông báo yêu cầu bổ sung hồ sơ ${item.id} tới SĐT ${item.phone} của tiểu thương ${item.applicant}.`);
    setTimeout(() => setActionNotice(null), 4000);
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
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-900 font-bold shadow-xs animate-in fade-in">
          <span className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{actionNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-100 cursor-pointer"
            aria-label="Đóng thông báo xử lý hồ sơ"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div data-testid="pending-profile-grid" className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {filtered.map((item) => (
          <div 
            key={item.id}
            className={`p-3.5 rounded-xl border transition-all ${
              item.status === 'approved'
                ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200'
                : item.status === 'overdue'
                ? 'bg-rose-50/40 border-rose-300'
                : item.status === 'supplementing'
                ? 'bg-amber-50/30 border-amber-300'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="font-mono font-bold text-[10px] text-slate-400 block">{item.id}</span>
                <h3 className="text-sm font-bold text-slate-900">{item.applicant}</h3>
                <span className="text-xs text-slate-500 font-sans">{item.type}</span>
              </div>
              <div className="shrink-0 sm:text-right">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 text-white inline-block mb-1">
                  SẠP {item.stallCode}
                </span>
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
              <span className="text-[10px] text-slate-400">Nộp ngày: {item.submittedDate}</span>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                {item.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã phê duyệt hồ sơ</span>
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApprove(item)}
                      className="min-h-11 cursor-pointer rounded-lg bg-[#0B7A3A] hover:bg-[#075A2B] px-3.5 py-2 font-bold text-white shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      Phê duyệt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestSupplement(item)}
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
    </div>
  );
}
