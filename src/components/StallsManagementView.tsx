'use client';

import React, { useState, useMemo } from 'react';
import { CLIENT_STALLS, CLIENT_ZONES } from '@/data/clientCmsData';
import type { Stall, DisplayStatus } from '@/types/clientTypes';
import {
  Store, Search, Filter, MapPin, Eye, AlertTriangle, CheckCircle2,
  Clock, Wrench, ShieldAlert, ArrowRight, UserCheck, Phone, X
} from 'lucide-react';

interface StallsManagementViewProps {
  onNavigateToMap: (stallCode: string) => void;
  stalls?: any[];
  selectedMarketId?: string;
}

const STATUS_CONFIG: Record<DisplayStatus, { label: string; bg: string; text: string; border: string }> = {
  occupied: { label: 'Đang hoạt động', bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
  expiring_soon: { label: 'Sắp hết hạn', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  has_complaint: { label: 'Có phản ánh', bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  vacant: { label: 'Chưa thuê', bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
  maintenance: { label: 'Bảo trì', bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  reserved: { label: 'Giữ chỗ', bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' }
};

export default function StallsManagementView({ onNavigateToMap, stalls, selectedMarketId }: StallsManagementViewProps) {
  const displayStalls = useMemo(() => {
    const raw = (stalls && stalls.length > 0) ? stalls : CLIENT_STALLS;
    if (!selectedMarketId || selectedMarketId === 'all') return raw;
    return raw.filter((s: any) => s.marketId === selectedMarketId);
  }, [stalls, selectedMarketId]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);

  const availableZones = useMemo(() => {
    const list: Array<{ id: string; code: string; name: string }> = [];
    const seen = new Set<string>();
    displayStalls.forEach((s: any) => {
      const z = s.zones;
      if (z && z.code && !seen.has(z.code)) {
        seen.add(z.code);
        list.push({ id: z.id || z.code, code: z.code, name: z.name || z.code });
      }
    });
    return list.length > 0 ? list : CLIENT_ZONES;
  }, [displayStalls]);

  const filteredStalls = useMemo(() => {
    return displayStalls.filter((s: any) => {
      if (statusFilter === 'occupied') {
        if (s.status !== 'occupied') return false;
      } else if (statusFilter !== 'all' && s.displayStatus !== statusFilter) {
        return false;
      }
      if (zoneFilter !== 'all' && s.zones?.code !== zoneFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCode = (s.code || '').toLowerCase().includes(q);
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchMerchant = (s.currentContract?.merchant?.fullName || '').toLowerCase().includes(q);
        const matchCat = (s.categories?.name || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchMerchant && !matchCat) return false;
      }
      return true;
    });
  }, [displayStalls, search, statusFilter, zoneFilter]);

  const counts = useMemo(() => {
    return {
      total: displayStalls.length,
      occupied: displayStalls.filter((s: any) => s.status === 'occupied').length,
      vacant: displayStalls.filter((s: any) => s.status === 'vacant').length,
      expiring: displayStalls.filter((s: any) => s.displayStatus === 'expiring_soon').length,
      complaint: displayStalls.filter((s: any) => s.displayStatus === 'has_complaint').length,
      maintenance: displayStalls.filter((s: any) => s.status === 'maintenance').length,
      reserved: displayStalls.filter((s: any) => s.status === 'reserved').length,
    };
  }, [displayStalls]);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0B7A3A]/10 text-[#0B7A3A] flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-[#153154] tracking-tight">Sạp Hàng</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {displayStalls.length} sạp quy hoạch
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Danh sách sạp — bấm vào sạp để xem thông tin, gán tiểu thương hoặc tra cứu trên sơ đồ tương tác
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 bg-white text-[#294463] focus:outline-none focus:border-[#0B7A3A]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="occupied">Đang hoạt động ({counts.occupied})</option>
            <option value="expiring_soon">Sắp hết hạn ({counts.expiring})</option>
            <option value="has_complaint">Có phản ánh ({counts.complaint})</option>
            <option value="vacant">Chưa thuê ({counts.vacant})</option>
            <option value="maintenance">Bảo trì ({counts.maintenance})</option>
            <option value="reserved">Giữ chỗ ({counts.reserved})</option>
          </select>

          {/* Zone Filter */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 bg-white text-[#294463] focus:outline-none focus:border-[#0B7A3A]"
          >
            <option value="all">Tất cả khu vực</option>
            {availableZones.map((z) => (
              <option key={z.id} value={z.code}>{z.name}</option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã / tên sạp / tiểu thương..."
              className="w-full text-xs py-2 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0B7A3A]"
            />
          </div>
        </div>
      </div>

      {/* Capacity & Status Pulse Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border-t-3 border-[#0B7A3A] border-x border-b border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Đang thuê</span>
          <div className="text-2xl font-black text-[#0B7A3A] mt-1">{counts.occupied}</div>
          <span className="text-[10px] text-slate-400">{Math.round((counts.occupied / counts.total) * 100)}% công suất</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border-t-3 border-[#F5A623] border-x border-b border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Sắp hết hạn</span>
          <div className="text-2xl font-black text-[#F5A623] mt-1">{counts.expiring}</div>
          <span className="text-[10px] text-slate-400">cần gia hạn &lt; 30 ngày</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border-t-3 border-[#EE565D] border-x border-b border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Có phản ánh</span>
          <div className="text-2xl font-black text-[#EE565D] mt-1">{counts.complaint}</div>
          <span className="text-[10px] text-slate-400">cần xử lý ngay</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border-t-3 border-slate-400 border-x border-b border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Còn trống</span>
          <div className="text-2xl font-black text-slate-600 mt-1">{counts.vacant}</div>
          <span className="text-[10px] text-slate-400">sẵn sàng cho thuê</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border-t-3 border-amber-600 border-x border-b border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Giữ chỗ</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{counts.reserved}</div>
          <span className="text-[10px] text-slate-400">đã ký quỹ cọc</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border-t-3 border-blue-500 border-x border-b border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Bảo trì</span>
          <div className="text-2xl font-black text-blue-700 mt-1">{counts.maintenance}</div>
          <span className="text-[10px] text-slate-400">PCCC & thoát nước</span>
        </div>
      </div>

      {/* Main Stalls Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[#475569] font-bold">
              <tr>
                <th className="py-3 px-3.5">MÃ SẠP</th>
                <th className="py-3 px-3.5">TÊN SẠP / MÔ TẢ</th>
                <th className="py-3 px-3.5">KHU VỰC</th>
                <th className="py-3 px-3.5 text-right">DIỆN TÍCH</th>
                <th className="py-3 px-3.5">NGÀNH HÀNG</th>
                <th className="py-3 px-3.5">TRẠNG THÁI</th>
                <th className="py-3 px-3.5">TIỂU THƯƠNG</th>
                <th className="py-3 px-3.5">HẾT HẠN</th>
                <th className="py-3 px-3.5 text-center">TÁC VỤ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStalls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Không tìm thấy sạp hàng nào khớp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredStalls.map((s: any) => {
                  const cfg = STATUS_CONFIG[(s.displayStatus || s.status) as DisplayStatus] || STATUS_CONFIG.vacant;
                  const daysLeft = s.currentContract?.daysLeft;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStall(s)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3.5 font-black text-[#153154] whitespace-nowrap">
                        <span className="px-2 py-1 rounded bg-slate-100 text-[#153154] font-mono group-hover:bg-[#0B7A3A] group-hover:text-white transition-colors">
                          {s.code}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 max-w-[240px]">
                        <div className="font-bold text-[#153154] truncate">{s.name || 'Sạp quy chuẩn'}</div>
                        <div className="text-[11px] text-slate-500 truncate">{s.description || '—'}</div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                        {s.zones?.name || 'Khu A'}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                        {s.acreage ? `${s.acreage} m²` : '—'}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="text-slate-600">{s.categories?.name || '—'}</span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className="inline-block px-2.5 py-1 rounded-md text-[11px] font-extrabold border"
                          style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {s.currentContract?.merchant ? (
                          <div>
                            <div className="font-bold text-[#153154]">{s.currentContract.merchant.fullName}</div>
                            <div className="text-[10px] text-slate-400">{s.currentContract.merchant.phone}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa gán</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {s.currentContract?.endDate ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-600">{s.currentContract.endDate}</span>
                            {daysLeft !== null && daysLeft !== undefined && daysLeft <= 30 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                còn {daysLeft} ngày
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onNavigateToMap(s.code)}
                          title="Xem trên sơ đồ không gian"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-[#0B7A3A] text-[#0B7A3A] hover:text-white font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem trên sơ đồ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stall Detail Modal / Drawer */}
      {selectedStall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-[#0B7A3A] to-[#12934D] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center font-black text-base">
                  {selectedStall.code}
                </div>
                <div>
                  <h3 className="font-black text-base">{selectedStall.name || 'Chi tiết sạp'}</h3>
                  <p className="text-xs text-emerald-100">{selectedStall.zones?.name} · {selectedStall.markets?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStall(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold">Diện tích:</span>
                  <p className="font-extrabold text-slate-800 text-sm">{selectedStall.acreage} m²</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Giờ mở cửa:</span>
                  <p className="font-extrabold text-slate-800 text-sm">{selectedStall.openHours || '06:00 - 21:00'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Doanh thu 30 ngày:</span>
                  <p className="font-extrabold text-[#0B7A3A] text-sm">{selectedStall.revenue30d?.toLocaleString('vi-VN')} đ</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Số lượng sản phẩm:</span>
                  <p className="font-extrabold text-slate-800 text-sm">{selectedStall.productCount || 0} mặt hàng</p>
                </div>
              </div>

              {/* Merchant Info */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#0B7A3A]" />
                    Hồ sơ tiểu thương đang thuê
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#0B7A3A] font-bold text-[10px]">
                    Hợp đồng hiệu lực
                  </span>
                </div>
                {selectedStall.currentContract ? (
                  <div className="space-y-1.5 pt-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Họ và tên:</span>
                      <strong className="text-slate-900">{selectedStall.currentContract.merchant.fullName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Số điện thoại:</span>
                      <strong className="text-slate-900">{selectedStall.currentContract.merchant.phone}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời hạn hợp đồng:</span>
                      <strong className="text-slate-900">
                        {selectedStall.currentContract.startDate} → {selectedStall.currentContract.endDate}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí thuê tháng:</span>
                      <strong className="text-[#0B7A3A] font-mono">
                        {selectedStall.currentContract.fee?.toLocaleString('vi-VN')} đ/tháng
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic py-2">Sạp hiện chưa có hợp đồng thuê nào còn hiệu lực.</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStall(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-slate-600 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const code = selectedStall.code;
                    setSelectedStall(null);
                    onNavigateToMap(code);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#0B7A3A] hover:bg-[#075A2B] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem vị trí trên sơ đồ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
