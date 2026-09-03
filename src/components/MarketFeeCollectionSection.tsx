'use client';

import React, { useState } from 'react';
import { CheckCircle2, FileText, Receipt, XCircle } from 'lucide-react';
import { MARKET_FEE_COLLECTION } from '../data/mockMarketData';

export default function MarketFeeCollectionSection() {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerExport = () => {
    setToastMsg('Đã xuất báo cáo thu phí định kỳ tháng 08/2026 (PDF & Excel)');
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <section id="market-fees-section" className="mb-4 max-w-full overflow-hidden rounded border border-slate-200 bg-white p-4 text-xs shadow-xs font-sans">
      <div className="mb-3 flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Receipt className="h-4 w-4 shrink-0 text-[var(--color-brand-green)]" aria-hidden="true" />
          <h2 className="min-w-0 text-xs font-bold uppercase tracking-wider text-slate-900">
            Tình Hình Thu Phí Quản Lý Thị Trường & Dịch Vụ
          </h2>
          <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
            • Kỳ thu tháng 08/2026
          </span>
        </div>
        <button
          type="button"
          onClick={triggerExport}
          className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-1 rounded bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-800 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:w-auto"
        >
          <FileText className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" /> Xuất báo cáo
        </button>
      </div>

      {toastMsg && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded border border-emerald-300 bg-emerald-50 p-2 text-emerald-800 font-bold">
          <span className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{toastMsg}</span>
          </span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            aria-label="Đóng thông báo xuất báo cáo"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div data-testid="fee-summary-grid" className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="p-3 bg-slate-50 rounded border border-slate-200">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Tổng chỉ tiêu thu</span>
          <span className="text-lg font-extrabold font-mono text-slate-900">{MARKET_FEE_COLLECTION.totalTarget}</span>
        </div>

        <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
          <span className="text-emerald-700 text-[10px] uppercase font-bold block">Đã thực thu (93%)</span>
          <span className="text-lg font-extrabold font-mono text-[#076C31]">{MARKET_FEE_COLLECTION.collected}</span>
        </div>

        <div className="p-3 bg-amber-50 rounded border border-amber-200">
          <span className="text-amber-800 text-[10px] uppercase font-bold block">Tổng chưa thu (14 sạp)</span>
          <span className="text-lg font-extrabold font-mono text-amber-900">16.800.000đ</span>
        </div>

        <div className="p-3 bg-rose-50 rounded border border-rose-200">
          <span className="text-rose-800 text-[10px] uppercase font-bold block">Nợ phí quá hạn (4 sạp)</span>
          <span className="text-lg font-extrabold font-mono text-rose-700">{MARKET_FEE_COLLECTION.overdueAmount}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-bold text-slate-800 text-xs">Tiến độ thu phí theo phân khu chức năng:</div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {MARKET_FEE_COLLECTION.breakdown.map((b, idx) => (
            <div key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">{b.zone}</span>
                <span className="font-mono font-bold text-emerald-700">{b.rate}%</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded bg-slate-200"
                role="progressbar"
                aria-label={`Tỷ lệ thu phí ${b.zone}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={b.rate}
              >
                <div 
                  className="h-full bg-[var(--color-brand-green)] transition-all duration-500 motion-reduce:transition-none" 
                  style={{ width: `${b.rate}%` }} 
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                <span>Thu: <strong className="font-mono text-slate-700">{b.collected}</strong></span>
                <span>Chỉ tiêu: <strong className="font-mono text-slate-700">{b.target}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
