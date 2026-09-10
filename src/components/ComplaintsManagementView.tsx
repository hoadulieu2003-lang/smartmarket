'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CLIENT_COMPLAINTS } from '@/data/clientCmsData';
import type { Complaint, ComplaintStatus, ComplaintType } from '@/types/clientTypes';
import {
  MessageSquareWarning, Search, AlertTriangle, CheckCircle2, Clock,
  ShieldAlert, Store, User, ArrowRight, XCircle, PhoneCall, MapPin,
  Flame, Wrench, Shield, Filter, Check
} from 'lucide-react';

const STATUS_MAP: Record<ComplaintStatus, { label: string; bg: string; text: string; border: string }> = {
  new: { label: 'Mới tiếp nhận', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  processing: { label: 'Đang xử lý', bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
  resolved: { label: 'Đã giải quyết', bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
  rejected: { label: 'Không hợp lệ', bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
  escalated: { label: 'Chuyển cấp trên', bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' }
};

const TYPE_MAP: Record<ComplaintType, string> = {
  product_quality: 'Chất lượng hàng hóa',
  price_issue: 'Giá cả & Niêm yết',
  food_safety: 'Vệ sinh an toàn thực phẩm',
  service_attitude: 'Thái độ phục vụ',
  weighing_fraud: 'Cân đo gian lận',
  infrastructure: 'Hạ tầng chợ',
  order_issue: 'Đơn hàng online',
  other: 'Trật tự & Mặt bằng'
};

const EMPTY_RESOLVED_CODES: string[] = [];

interface ComplaintsManagementViewProps {
  onNavigateToMap?: (stallCode: string) => void;
  resolvedCodes?: string[];
  onResolveComplaint?: (codeOrId: string) => void;
  complaints?: any[];
  selectedMarketId?: string;
}

export default function ComplaintsManagementView({
  onNavigateToMap,
  resolvedCodes = EMPTY_RESOLVED_CODES,
  onResolveComplaint,
  complaints: propComplaints,
  selectedMarketId
}: ComplaintsManagementViewProps) {
  const displaySource = useMemo(() => {
    const raw = (propComplaints && propComplaints.length > 0) ? propComplaints : CLIENT_COMPLAINTS;
    if (!selectedMarketId || selectedMarketId === 'all') return raw;
    return raw.filter((c: any) => c.marketId === selectedMarketId);
  }, [propComplaints, selectedMarketId]);

  const resolvedCodesKey = useMemo(() => resolvedCodes.join(','), [resolvedCodes]);

  const getNormalizedComplaints = (list: any[]) => {
    const localResolved: string[] = typeof window !== 'undefined'
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem('smartmarket_resolved_complaints') || '[]');
          } catch {
            return [];
          }
        })()
      : [];
    const allResolved = Array.from(new Set([...resolvedCodes, ...localResolved]));

    return list.map((c) => {
      const isResolved = (c.code && allResolved.includes(c.code)) || allResolved.includes(c.id) || c.status === 'resolved';
      return {
        ...c,
        code: c.code || `PAKN-${(c.id || '').slice(0, 6).toUpperCase()}`,
        status: isResolved ? 'resolved' : (c.status || 'new'),
        severityLevel: c.severityLevel || 'P1',
        title: c.title || (c.content ? c.content.slice(0, 45) + (c.content.length > 45 ? '...' : '') : 'Phản ánh người mua'),
        content: c.content || '',
        resolutionNote: c.resolutionNote || (isResolved ? 'Đã kiểm tra thực tế và yêu cầu tiểu thương khắc phục dứt điểm.' : undefined),
        resolvedAt: c.resolvedAt || (isResolved ? new Date().toISOString() : undefined)
      };
    });
  };

  const [complaints, setComplaints] = useState<any[]>(() => getNormalizedComplaints(displaySource));

  useEffect(() => {
    setComplaints(getNormalizedComplaints(displaySource));
  }, [displaySource, resolvedCodesKey]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'P0' | 'P1' | 'P2' | 'resolved'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Thống kê số liệu nhanh theo cấp độ ưu tiên thực tế
  const stats = useMemo(() => {
    const total = complaints.length;
    const p0 = complaints.filter((c) => c.severityLevel === 'P0' && c.status !== 'resolved').length;
    const p1 = complaints.filter((c) => c.severityLevel === 'P1' && c.status !== 'resolved').length;
    const p2 = complaints.filter((c) => c.severityLevel === 'P2' && c.status !== 'resolved').length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    return { total, p0, p1, p2, resolved };
  }, [complaints]);

  // Bộ lọc kết hợp: mức độ khẩn cấp (P0/P1/P2/resolved), trạng thái và từ khóa tìm kiếm
  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      // Lọc theo severityFilter tab
      if (severityFilter === 'resolved') {
        if (c.status !== 'resolved') return false;
      } else if (severityFilter !== 'all') {
        if (c.severityLevel !== severityFilter) return false;
        if (c.status === 'resolved') return false; // Tab cấp độ chỉ hiển thị các vụ chưa đóng
      }

      // Lọc theo dropdown status
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      // Tìm kiếm đa trường (Mã PAKN, nội dung, người gửi, sạp, điều phối)
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCode = (c.code || '').toLowerCase().includes(q);
        const matchContent = c.content.toLowerCase().includes(q);
        const matchReporter = (c.reporter?.fullName || '').toLowerCase().includes(q) || (c.reporter?.phone || '').includes(q);
        const matchStall = (c.stalls?.code || '').toLowerCase().includes(q) || (c.stalls?.name || '').toLowerCase().includes(q);
        const matchZone = (c.zone || '').toLowerCase().includes(q);
        const matchCoordinator = (c.coordinator?.name || '').toLowerCase().includes(q);
        if (!matchCode && !matchContent && !matchReporter && !matchStall && !matchZone && !matchCoordinator) {
          return false;
        }
      }
      return true;
    });
  }, [complaints, search, severityFilter, statusFilter]);

  const handleResolve = (id: string) => {
    const target = complaints.find((c) => c.id === id);
    const code = target?.code || id;

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'resolved',
              resolutionNote: 'Đã kiểm tra thực tế và yêu cầu tiểu thương khắc phục dứt điểm.',
              resolvedAt: new Date().toISOString()
            }
          : c
      )
    );

    if (onResolveComplaint) {
      onResolveComplaint(code);
    }
    if (typeof window !== 'undefined') {
      try {
        const saved: string[] = JSON.parse(localStorage.getItem('smartmarket_resolved_complaints') || '[]');
        if (!saved.includes(code)) {
          localStorage.setItem('smartmarket_resolved_complaints', JSON.stringify([...saved, code]));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* 1. Tiêu đề trang & Tóm tắt chỉ số */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-xs">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#153154] tracking-tight">PAKN · Phản Ánh & Khiếu Nại</h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {stats.total - stats.resolved} vụ cần xử lý
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kênh tiếp nhận & điều phối xử lý 15 sự cố phản ánh thực tế tại Chợ Đồng Xuân (Đồng bộ 100% dữ liệu Sơ đồ chợ)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 bg-white text-[#294463] focus:outline-none focus:border-[#0B7A3A]"
          >
            <option value="all">Tất cả trạng thái xử lý</option>
            <option value="new">Mới tiếp nhận</option>
            <option value="processing">Đang xử lý</option>
            <option value="resolved">Đã giải quyết</option>
          </select>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã PAKN / Sạp / Nội dung..."
              className="w-full text-xs py-2 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0B7A3A]"
            />
          </div>
        </div>
      </div>

      {/* 2. Thẻ KPI Phân loại Sự cố theo 3 Cấp độ Nghiêm trọng Thực tế */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Tổng cộng */}
        <button
          type="button"
          onClick={() => setSeverityFilter('all')}
          className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
            severityFilter === 'all'
              ? 'bg-[#153154] text-white border-[#153154] shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`text-[11px] font-bold uppercase tracking-wider ${severityFilter === 'all' ? 'text-white/80' : 'text-slate-600'}`}>
            Tổng phản ánh
          </div>
          <div className={`text-2xl font-black mt-1 ${severityFilter === 'all' ? 'text-white' : 'text-[#153154]'}`}>
            {stats.total} <span className={`text-xs font-bold ${severityFilter === 'all' ? 'text-white/80' : 'text-slate-600'}`}>vụ</span>
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${severityFilter === 'all' ? 'text-white/70' : 'text-slate-500'}`}>
            Toàn bộ 15 sự cố chợ
          </div>
        </button>

        {/* P0 Khẩn cấp */}
        <button
          type="button"
          onClick={() => setSeverityFilter('P0')}
          className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
            severityFilter === 'P0'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-rose-50 text-rose-950 border-rose-200 hover:bg-rose-100/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${severityFilter === 'P0' ? 'text-white' : 'text-rose-900'}`}>
              <Flame className={`w-3.5 h-3.5 ${severityFilter === 'P0' ? 'text-white' : 'text-rose-600'}`} /> Khẩn cấp
            </span>
            <span className={`w-2 h-2 rounded-full ${severityFilter === 'P0' ? 'bg-white' : 'bg-rose-500'} animate-ping`} />
          </div>
          <div className={`text-2xl font-black mt-1 ${severityFilter === 'P0' ? 'text-white' : 'text-rose-900'}`}>
            {stats.p0} <span className={`text-xs font-bold ${severityFilter === 'P0' ? 'text-white/80' : 'text-rose-700'}`}>vụ</span>
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${severityFilter === 'P0' ? 'text-white/90' : 'text-rose-700'}`}>
            ATTP & Niêm yết giá
          </div>
        </button>

        {/* Trật tự */}
        <button
          type="button"
          onClick={() => setSeverityFilter('P1')}
          className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
            severityFilter === 'P1'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100/70'
          }`}
        >
          <div className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${severityFilter === 'P1' ? 'text-white' : 'text-amber-950'}`}>
            <AlertTriangle className={`w-3.5 h-3.5 ${severityFilter === 'P1' ? 'text-white' : 'text-amber-600'}`} /> Trật tự
          </div>
          <div className={`text-2xl font-black mt-1 ${severityFilter === 'P1' ? 'text-white' : 'text-amber-900'}`}>
            {stats.p1} <span className={`text-xs font-bold ${severityFilter === 'P1' ? 'text-white/80' : 'text-amber-800'}`}>vụ</span>
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${severityFilter === 'P1' ? 'text-white/90' : 'text-amber-800'}`}>
            Lấn chiếm & Dù bạt
          </div>
        </button>

        {/* Hạ tầng */}
        <button
          type="button"
          onClick={() => setSeverityFilter('P2')}
          className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
            severityFilter === 'P2'
              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
              : 'bg-sky-50 text-sky-950 border-sky-200 hover:bg-sky-100/70'
          }`}
        >
          <div className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${severityFilter === 'P2' ? 'text-white' : 'text-sky-950'}`}>
            <Wrench className={`w-3.5 h-3.5 ${severityFilter === 'P2' ? 'text-white' : 'text-sky-600'}`} /> Hạ tầng
          </div>
          <div className={`text-2xl font-black mt-1 ${severityFilter === 'P2' ? 'text-white' : 'text-sky-900'}`}>
            {stats.p2} <span className={`text-xs font-bold ${severityFilter === 'P2' ? 'text-white/80' : 'text-sky-800'}`}>vụ</span>
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${severityFilter === 'P2' ? 'text-white/90' : 'text-sky-800'}`}>
            Kỹ thuật & Môi trường
          </div>
        </button>

        {/* Đã giải quyết */}
        <button
          type="button"
          onClick={() => setSeverityFilter('resolved')}
          className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
            severityFilter === 'resolved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100/70'
          }`}
        >
          <div className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${severityFilter === 'resolved' ? 'text-white' : 'text-emerald-950'}`}>
            <CheckCircle2 className={`w-3.5 h-3.5 ${severityFilter === 'resolved' ? 'text-white' : 'text-emerald-600'}`} /> Đã xử lý
          </div>
          <div className={`text-2xl font-black mt-1 ${severityFilter === 'resolved' ? 'text-white' : 'text-emerald-900'}`}>
            {stats.resolved} <span className={`text-xs font-bold ${severityFilter === 'resolved' ? 'text-white/80' : 'text-emerald-800'}`}>vụ</span>
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${severityFilter === 'resolved' ? 'text-white/90' : 'text-emerald-800'}`}>
            Biên bản hoàn thành
          </div>
        </button>
      </div>

      {/* 3. Danh sách Thẻ Sự Cố PAKN Đồng Bộ Thực Tế */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-600">Không tìm thấy phản ánh phù hợp</div>
            <p className="text-xs text-slate-400">Hãy thử xóa bộ lọc tìm kiếm hoặc chọn danh mục khác</p>
          </div>
        ) : (
          filtered.map((c) => {
            const st = STATUS_MAP[c.status as ComplaintStatus] || STATUS_MAP.new;
            const isP0 = c.severityLevel === 'P0';
            const isP1 = c.severityLevel === 'P1';

            return (
              <div
                key={c.id}
                className={`bg-white p-4 sm:p-5 rounded-xl border transition-all space-y-3 shadow-xs ${
                  isP0 && c.status !== 'resolved'
                    ? 'border-rose-300 ring-1 ring-rose-200/60 bg-gradient-to-r from-rose-50/20 to-white'
                    : isP1 && c.status !== 'resolved'
                    ? 'border-amber-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Dòng Header Thẻ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Mã PAKN */}
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {c.code || c.id}
                    </span>

                    {/* Mức độ ưu tiên */}
                    {c.severityLevel === 'P0' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-600" /> Khẩn cấp
                      </span>
                    ) : c.severityLevel === 'P1' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Trật tự
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-sky-600" /> Hạ tầng
                      </span>
                    )}

                    {/* Phân loại sự cố */}
                    <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {TYPE_MAP[c.type as ComplaintType] || c.type}
                    </span>

                    {/* Trạng thái giải quyết */}
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-extrabold border"
                      style={{ backgroundColor: st.bg, color: st.text, borderColor: st.border }}
                    >
                      {st.label}
                    </span>
                  </div>

                  {/* Thời gian tiếp nhận */}
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {c.createdAt.replace('T', ' ').slice(0, 16)}
                  </span>
                </div>

                {/* Nội dung phản ánh & Định vị Sạp trên Sơ đồ */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {c.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Phân khu chợ */}
                    {c.zone && (
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        📍 {c.zone}
                      </span>
                    )}

                    {/* Nút liên kết Sạp & Mở Sơ Đồ Chợ Thực Tế */}
                    {c.stalls && (
                      <button
                        type="button"
                        onClick={() => onNavigateToMap?.(c.stalls?.code || '')}
                        title={`Bấm để xem vị trí Sạp ${c.stalls.code} trên Sơ đồ quy hoạch chợ`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-[#0B7A3A] text-[#0B7A3A] hover:text-white font-bold text-xs border border-emerald-200 hover:border-[#0B7A3A] transition-all cursor-pointer group"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Sạp {c.stalls.code} ({c.stalls.name})</span>
                        <span className="text-[11px] underline font-semibold group-hover:text-emerald-100 flex items-center">
                          Xem vị trí sạp trên sơ đồ ↗
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Biên bản xử lý (Khi đã giải quyết) */}
                {c.resolutionNote && (
                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 space-y-1">
                    <strong className="flex items-center gap-1 font-bold text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Biên bản xử lý:
                    </strong>
                    <p className="leading-relaxed">{c.resolutionNote}</p>
                    {c.resolvedAt && (
                      <div className="text-[11px] text-emerald-700 font-mono pt-1">
                        Hoàn tất: {c.resolvedAt.replace('T', ' ').slice(0, 16)}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer: Thông tin Người gửi & Cán bộ điều phối hiện trường */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="space-y-1">
                    {/* Người phản ánh */}
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Người báo: <strong className="text-slate-700">{c.reporter?.fullName}</strong> ({c.reporter?.phone})</span>
                    </div>

                    {/* Cán bộ điều phối phụ trách hiện trường */}
                    {c.coordinator && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">
                          Điều phối: <strong className="text-[#153154]">{c.coordinator.name}</strong> ({c.coordinator.role})
                        </span>
                        <a
                          href={`tel:${c.coordinator.phone.replace(/\D/g, '')}`}
                          title={`Gọi ngay cho cán bộ ${c.coordinator.name}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 font-bold transition-colors cursor-pointer text-[11px]"
                        >
                          <PhoneCall className="w-3 h-3 text-emerald-600" />
                          <span>{c.coordinator.phone}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Nút hành động Đánh dấu Đã xử lý */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {c.status !== 'resolved' ? (
                      <button
                        type="button"
                        onClick={() => handleResolve(c.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0B7A3A] hover:bg-[#075A2B] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đánh dấu Đã xử lý</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                        <Check className="w-3.5 h-3.5" /> Đã giải quyết
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
