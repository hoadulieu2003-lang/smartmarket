'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, Search, XCircle,
} from 'lucide-react';

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
    }
  ];

  const handleAction = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filtered = profilesList.filter((p) => {
    if (filterType === 'overdue' && p.status !== 'overdue') return false;
    if (filterType === 'pending' && p.status !== 'pending') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.applicant.toLowerCase().includes(q) || p.stallCode.toLowerCase().includes(q);
    }
    return true;
  });

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
              Tổng cộng có <strong className="font-mono">{profilesList.length}</strong> hồ sơ đang trong quy trình xử lý
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
            Tất cả ({profilesList.length})
          </button>
          <button
            type="button"
            aria-pressed={filterType === 'overdue'}
            onClick={() => setFilterType('overdue')}
            className={`min-h-11 flex-none cursor-pointer rounded px-3 py-2 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              filterType === 'overdue' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800'
            }`}
          >
            Quá hạn ({profilesList.filter(p => p.status === 'overdue').length})
          </button>
          <button
            type="button"
            aria-pressed={filterType === 'pending'}
            onClick={() => setFilterType('pending')}
            className={`min-h-11 flex-none cursor-pointer rounded px-3 py-2 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
              filterType === 'pending' ? 'bg-amber-500 text-slate-950' : 'bg-amber-50 text-amber-800'
            }`}
          >
            Đang xử lý ({profilesList.filter(p => p.status === 'pending').length})
          </button>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded border border-emerald-300 bg-emerald-50 p-2.5 text-emerald-800 font-bold">
          <span className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{actionNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
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
            className={`p-3.5 rounded border transition-all ${
              item.status === 'overdue'
                ? 'bg-rose-50/40 border-rose-300'
                : 'bg-white border-slate-200'
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
                  item.status === 'overdue' ? 'text-rose-700' : 'text-amber-700'
                }`}>
                  {item.statusLabel}
                </div>
              </div>
            </div>

            <div className="text-slate-600 space-y-1 my-2 text-[11px]">
              <div>Ngành hàng: <strong className="text-slate-800">{item.category}</strong></div>
              <div>Số điện thoại: <strong className="font-mono text-slate-800">{item.phone}</strong></div>
              <div>Ghi chú: <span className="italic">{item.notes}</span></div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[10px] text-slate-400">Nộp ngày: {item.submittedDate}</span>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => handleAction(`Đã phê duyệt hồ sơ ${item.id} cho tiểu thương ${item.applicant}`)}
                  className="min-h-11 cursor-pointer rounded bg-[var(--color-brand-green)] px-3 py-2 font-bold text-white shadow-xs transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  Phê duyệt
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(`Đã gửi yêu cầu bổ sung hồ sơ ${item.id}`)}
                  className="min-h-11 cursor-pointer rounded border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  Yêu cầu bổ sung
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
