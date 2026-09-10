'use client';

import React, { useState, useMemo } from 'react';
import { CLIENT_PRODUCTS } from '@/data/clientCmsData';
import type { Product } from '@/types/clientTypes';
import {
  Package, Search, QrCode, Star, ShieldCheck, Tag,
  Eye, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';

interface ProductsManagementViewProps {
  products?: any[];
  selectedMarketId?: string;
}

export default function ProductsManagementView({ products, selectedMarketId }: ProductsManagementViewProps = {}) {
  const [search, setSearch] = useState('');
  const [hidePrices, setHidePrices] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const effectiveProducts = useMemo(() => {
    let list = products && products.length > 0 ? products : CLIENT_PRODUCTS;
    if (selectedMarketId && selectedMarketId !== 'all') {
      const byMarket = list.filter((p: any) =>
        p.stalls?.marketId === selectedMarketId ||
        p.stalls?.markets?.id === selectedMarketId ||
        p.marketId === selectedMarketId
      );
      if (byMarket.length > 0) return byMarket;
    }
    return list;
  }, [products, selectedMarketId]);

  const filteredProducts = useMemo(() => {
    return effectiveProducts.filter((p: any) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchStall = (p.stalls?.code || '').toLowerCase().includes(q);
        const matchCat = (p.categories?.name || '').toLowerCase().includes(q);
        const matchOrigin = (p.origin || '').toLowerCase().includes(q);
        if (!matchName && !matchStall && !matchCat && !matchOrigin) return false;
      }
      return true;
    });
  }, [effectiveProducts, search]);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0B7A3A] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-[#153154] tracking-tight">Sản Phẩm & Hàng Hóa</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {effectiveProducts.length} mặt hàng niêm yết
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Danh mục hàng hóa và hồ sơ truy xuất nguồn gốc nông sản an toàn trên toàn hệ thống chợ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Price Privacy */}
          <button
            type="button"
            onClick={() => setHidePrices(!hidePrices)}
            className={`text-xs font-bold px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
              hidePrices
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {hidePrices ? 'Đang ẩn giá bán' : 'Hiển thị giá bán'}
          </button>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sản phẩm / xuất xứ / sạp..."
              className="w-full text-xs py-2 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0B7A3A]"
            />
          </div>
        </div>
      </div>

      {/* Main Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[#475569] font-bold">
              <tr>
                <th className="py-3 px-3.5">SẢN PHẨM</th>
                <th className="py-3 px-3.5">SẠP / CHỢ</th>
                <th className="py-3 px-3.5 text-right">GIÁ NIÊM YẾT</th>
                <th className="py-3 px-3.5 text-right">TỒN KHO</th>
                <th className="py-3 px-3.5">XUẤT XỨ / NGUỒN GỐC</th>
                <th className="py-3 px-3.5">TRUY XUẤT QR</th>
                <th className="py-3 px-3.5 text-right">ĐÁNH GIÁ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={(p.images && p.images.length > 0 && p.images[0]?.url) ? p.images[0].url : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=150'}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                      />
                      <div>
                        <div className="font-bold text-[#153154] max-w-[260px] truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-400">{p.categories?.name || 'Nông sản thực phẩm'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="font-bold text-[#153154]">{p.stalls?.code || '—'}</div>
                    <div className="text-[10px] text-slate-400">{p.stalls?.name || 'Sạp'}</div>
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    {hidePrices ? (
                      <span className="font-bold text-slate-400">Giá thị trường</span>
                    ) : (
                      <div>
                        <span className="font-extrabold text-[#0B7A3A] text-sm">
                          {(p.finalPrice ?? p.price ?? 0).toLocaleString('vi-VN')} đ
                        </span>
                        <span className="text-[10px] text-slate-400">/{p.unit || 'kg'}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-bold text-slate-700">
                    {p.quantity ?? 0} {p.unit || 'kg'}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {p.origin || 'Chưa ghi nhận'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-extrabold bg-emerald-50 text-[#0B7A3A] border border-emerald-200">
                      <QrCode className="w-3.5 h-3.5" />
                      {p.traceabilityQr || 'Đã xác thực'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-bold text-amber-600">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {(p.ratingAvg ?? 5).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">({p.reviewCount ?? 0})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
