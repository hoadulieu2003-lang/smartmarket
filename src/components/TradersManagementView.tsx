'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CLIENT_TRADERS } from '@/data/clientCmsData';
import type { Trader, MerchantStatus } from '@/types/clientTypes';
import {
  Users, Search, Star, ShieldCheck, AlertCircle, Store,
  Phone, Mail, Building2, CheckCircle2, XCircle, CreditCard,
  MapPin, X, ExternalLink
} from 'lucide-react';

interface TradersManagementViewProps {
  traders?: any[];
  selectedMarketId?: string;
  onNavigateToMap?: (stallCode: string) => void;
}

export default function TradersManagementView({ traders, selectedMarketId, onNavigateToMap }: TradersManagementViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sellerTypeFilter, setSellerTypeFilter] = useState<string>('all');
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);

  // Đóng modal chi tiết bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTrader) {
        setSelectedTrader(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTrader]);

  const effectiveTraders = useMemo(() => {
    let list = traders && traders.length > 0 ? traders : CLIENT_TRADERS;
    if (selectedMarketId && selectedMarketId !== 'all') {
      const byMarket = list.filter((t: any) =>
        t.merchantMarketId === selectedMarketId ||
        t.market?.id === selectedMarketId ||
        t.marketId === selectedMarketId
      );
      if (byMarket.length > 0) return byMarket;
    }
    return list;
  }, [traders, selectedMarketId]);

  const filteredTraders = useMemo(() => {
    return effectiveTraders.filter((t) => {
      if (statusFilter !== 'all' && t.merchantStatus !== statusFilter) return false;
      if (sellerTypeFilter !== 'all' && t.sellerType !== sellerTypeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (t.fullName || '').toLowerCase().includes(q);
        const matchPhone = (t.phone || '').includes(q);
        const matchStall = (t.stall?.code || '').toLowerCase().includes(q);
        const matchCat = (t.category?.name || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchStall && !matchCat) return false;
      }
      return true;
    });
  }, [effectiveTraders, search, statusFilter, sellerTypeFilter]);

  const stats = useMemo(() => {
    const total = effectiveTraders.length;
    const active = effectiveTraders.filter((t) => t.merchantStatus === 'active').length;
    const shop = effectiveTraders.filter((t) => t.sellerType === 'shop').length;
    const casual = effectiveTraders.filter((t) => t.sellerType === 'casual').length;
    return { total, active, shop, casual };
  }, [effectiveTraders]);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-[#153154] tracking-tight">Quản Lý Tiểu Thương</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {effectiveTraders.length} hồ sơ hoạt động
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hồ sơ các tiểu thương đang kinh doanh trong phạm vi chợ — kiểm tra thông tin hợp đồng, tài khoản ngân hàng và đánh giá
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
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Tạm khóa</option>
          </select>

          {/* Seller Type Filter */}
          <select
            value={sellerTypeFilter}
            onChange={(e) => setSellerTypeFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 bg-white text-[#294463] focus:outline-none focus:border-[#0B7A3A]"
          >
            <option value="all">Tất cả loại hình</option>
            <option value="shop">Shop cố định</option>
            <option value="casual">Tiểu thương vãng lai</option>
          </select>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên / SĐT / mã sạp..."
              className="w-full text-xs py-2 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0B7A3A]"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border-t-3 border-blue-600 border-x border-b border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng tiểu thương</span>
          <div className="text-2xl font-black text-blue-700 mt-1">{stats.total}</div>
          <span className="text-[10px] text-slate-400">100% định danh CCCD</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border-t-3 border-emerald-600 border-x border-b border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Shop cố định</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.shop}</div>
          <span className="text-[10px] text-slate-400">hợp đồng dài hạn</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border-t-3 border-amber-500 border-x border-b border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Vãng lai</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.casual}</div>
          <span className="text-[10px] text-slate-400">thuê theo phiên chợ</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border-t-3 border-[#0B7A3A] border-x border-b border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Đang kinh doanh</span>
          <div className="text-2xl font-black text-[#0B7A3A] mt-1">{stats.active}</div>
          <span className="text-[10px] text-slate-400">hoạt động bình thường</span>
        </div>
      </div>

      {/* Main Traders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[#475569] font-bold">
              <tr>
                <th className="py-3 px-3.5">TIỂU THƯƠNG</th>
                <th className="py-3 px-3.5">LOẠI HÌNH</th>
                <th className="py-3 px-3.5">CHỢ</th>
                <th className="py-3 px-3.5">SẠP GÁN</th>
                <th className="py-3 px-3.5">NGÀNH HÀNG</th>
                <th className="py-3 px-3.5 text-right">ĐÁNH GIÁ</th>
                <th className="py-3 px-3.5 text-right">PHẢN ÁNH</th>
                <th className="py-3 px-3.5">TRẠNG THÁI</th>
                <th className="py-3 px-3.5">NGÂN HÀNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTraders.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTrader(t)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={t.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                        alt={t.fullName}
                        className="w-9 h-9 rounded-full object-cover border-2 border-[#D9A441] shadow-2xs shrink-0"
                      />
                      <div>
                        <div className="font-bold text-[#153154]">{t.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                      t.sellerType === 'shop' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {t.sellerType === 'shop' ? 'Shop cố định' : 'Vãng lai'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                    {t.market?.name}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap font-mono font-bold text-[#153154]">
                    {t.stall?.code ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToMap?.(t.stall!.code);
                        }}
                        title={`Xem sạp ${t.stall.code} trên sơ đồ chợ`}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-[#0B7A3A] hover:text-white border border-slate-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 text-[#0B7A3A] group-hover:text-white" />
                        <span>{t.stall.code}</span>
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                    {t.category?.name || '—'}
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-bold text-amber-600">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {t.ratingAvg?.toFixed(1) || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-bold">
                    {(t.openComplaintCount || 0) > 0 ? (
                      <span className="text-rose-600">{t.openComplaintCount}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold border ${
                      t.merchantStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {t.merchantStatus === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                    {t.bankName ? (
                      <div>
                        <div className="font-medium text-slate-800">{t.bankName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{t.bankAccountNumber}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi Tiết Tiểu Thương */}
      {selectedTrader && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="trader-detail-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedTrader(null)}
        >
          <div
            className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-xs font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTrader.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                  alt={selectedTrader.fullName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#D9A441] shadow-2xs shrink-0"
                />
                <div>
                  <h3 id="trader-detail-modal-title" className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>{selectedTrader.fullName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      selectedTrader.sellerType === 'shop' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedTrader.sellerType === 'shop' ? 'Shop cố định' : 'Vãng lai'}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                    <span className="font-mono">{selectedTrader.phone}</span>
                    <span>•</span>
                    <span>{selectedTrader.market?.name}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTrader(null)}
                aria-label="Đóng chi tiết tiểu thương"
                className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Sạp gán & Điều hướng sơ đồ */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#0B7A3A] flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Vị trí sạp kinh doanh</span>
                    <div className="font-mono font-black text-sm text-[#153154]">
                      {selectedTrader.stall?.code ? `SẠP ${selectedTrader.stall.code}` : 'Chưa gán sạp cố định'}
                    </div>
                  </div>
                </div>

                {selectedTrader.stall?.code && onNavigateToMap && (
                  <button
                    type="button"
                    onClick={() => {
                      const code = selectedTrader.stall!.code;
                      setSelectedTrader(null);
                      onNavigateToMap(code);
                    }}
                    className="px-3 py-2 rounded-lg bg-[#0B7A3A] hover:bg-[#075A2B] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Xem trên sơ đồ chợ</span>
                  </button>
                )}
              </div>

              {/* Thông tin kinh doanh & Ngành hàng */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-black text-[#153154] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-[#0B7A3A]" />
                  <span>HỒ SƠ ĐỊNH DANH & KINH DOANH</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Ngành hàng:</span>{' '}
                    <strong className="text-slate-800">{selectedTrader.category?.name || 'Chưa phân loại'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Đánh giá khách hàng:</span>{' '}
                    <strong className="text-amber-600 font-bold">{selectedTrader.ratingAvg?.toFixed(1) || '5.0'} / 5.0 ⭐</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Phản ánh mở:</span>{' '}
                    <strong className={(selectedTrader.openComplaintCount || 0) > 0 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                      {selectedTrader.openComplaintCount || 0} vụ việc
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Trạng thái:</span>{' '}
                    <strong className={selectedTrader.merchantStatus === 'active' ? 'text-emerald-700' : 'text-rose-700'}>
                      {selectedTrader.merchantStatus === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Tài khoản ngân hàng / Thanh toán */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-black text-[#153154] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>TÀI KHOẢN THANH TOÁN KHÔNG DÙNG TIỀN MẶT</span>
                </span>
                {selectedTrader.bankName ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Ngân hàng:</span>{' '}
                      <strong className="text-slate-800">{selectedTrader.bankName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Số tài khoản:</span>{' '}
                      <strong className="font-mono font-bold text-[#153154]">{selectedTrader.bankAccountNumber}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Chưa liên kết tài khoản ngân hàng điện tử.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-5 py-3 border-t border-slate-200 bg-[#F8FAFC]">
              <button
                type="button"
                onClick={() => setSelectedTrader(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
