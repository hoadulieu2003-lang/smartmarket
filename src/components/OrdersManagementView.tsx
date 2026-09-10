'use client';

import React, { useState, useMemo } from 'react';
import { CLIENT_ORDERS } from '@/data/clientCmsData';
import type { Order, OrderStatus } from '@/types/clientTypes';
import {
  ShoppingCart, Search, Clock, CheckCircle2, AlertCircle,
  Truck, Store, Phone, User, DollarSign
} from 'lucide-react';

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Chờ xác nhận', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  confirmed: { label: 'Đã xác nhận', bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
  preparing: { label: 'Đang chuẩn bị', bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' },
  ready: { label: 'Sẵn sàng giao', bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
  completed: { label: 'Hoàn tất', bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
  cancelled: { label: 'Đã hủy', bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' }
};

interface OrdersManagementViewProps {
  orders?: any[];
  selectedMarketId?: string;
}

export default function OrdersManagementView({ orders, selectedMarketId }: OrdersManagementViewProps = {}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const effectiveOrders = useMemo(() => {
    let list = orders && orders.length > 0 ? orders : CLIENT_ORDERS;
    if (selectedMarketId && selectedMarketId !== 'all') {
      const byMarket = list.filter((o: any) =>
        o.marketId === selectedMarketId ||
        o.markets?.id === selectedMarketId ||
        o.stalls?.marketId === selectedMarketId
      );
      if (byMarket.length > 0) return byMarket;
    }
    return list;
  }, [orders, selectedMarketId]);

  const filteredOrders = useMemo(() => {
    return effectiveOrders.filter((o: any) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCode = (o.code || '').toLowerCase().includes(q);
        const matchReceiver = (o.receiverName || o.customer?.fullName || '').toLowerCase().includes(q);
        const matchPhone = (o.receiverPhone || o.customer?.phone || '').includes(q);
        const matchStall = (o.stalls?.code || '').toLowerCase().includes(q);
        if (!matchCode && !matchReceiver && !matchPhone && !matchStall) return false;
      }
      return true;
    });
  }, [effectiveOrders, search, statusFilter]);

  const totalAmount = useMemo(() => {
    return filteredOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-[#153154] tracking-tight">Đơn Hàng Online</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {effectiveOrders.length} đơn phát sinh
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi luồng đơn đặt hàng từ ứng dụng Smart Market WebApp của người tiêu dùng và khách tham quan
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
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="preparing">Đang chuẩn bị</option>
            <option value="ready">Sẵn sàng</option>
            <option value="completed">Hoàn tất</option>
          </select>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã đơn / người nhận / SĐT..."
              className="w-full text-xs py-2 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0B7A3A]"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[#475569] font-bold">
              <tr>
                <th className="py-3 px-3.5">MÃ ĐƠN</th>
                <th className="py-3 px-3.5">KHÁCH HÀNG</th>
                <th className="py-3 px-3.5">SẠP THỰC HIỆN</th>
                <th className="py-3 px-3.5">PHƯƠNG THỨC</th>
                <th className="py-3 px-3.5 text-right">TỔNG TIỀN</th>
                <th className="py-3 px-3.5">TRẠNG THÁI</th>
                <th className="py-3 px-3.5">GHI CHÚ</th>
                <th className="py-3 px-3.5">THỜI GIAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((o) => {
                const st = (o.status && ORDER_STATUS_MAP[o.status as OrderStatus]) || ORDER_STATUS_MAP.completed;
                return (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-black text-[#153154] whitespace-nowrap">
                      {o.code}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-[#153154]">{o.receiverName || o.customer?.fullName || 'Khách hàng'}</div>
                      <div className="text-[10px] text-slate-400">{o.receiverPhone || o.customer?.phone || '—'}</div>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-[#153154]">{o.stalls?.code || '—'}</div>
                      <div className="text-[10px] text-slate-400">{o.stalls?.name || o.markets?.name || 'Sạp'}</div>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        o.receiveType === 'delivery'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {o.receiveType === 'delivery' ? <Truck className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                        {o.receiveType === 'delivery' ? 'Giao tận nơi' : 'Nhận tại quầy'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-extrabold text-[#0B7A3A] text-sm">
                      {(o.totalAmount || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className="inline-block px-2.5 py-1 rounded-md text-[11px] font-extrabold border"
                        style={{ backgroundColor: st.bg, color: st.text, borderColor: st.border }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 max-w-[200px] truncate">
                      {o.note || '—'}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {o.createdAt ? o.createdAt.replace('T', ' ').slice(0, 16) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
