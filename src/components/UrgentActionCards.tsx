'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronRight } from 'lucide-react';
import type { UrgentActionsData, AreaAlertLocation } from '../data/mockMarketData';

interface UrgentActionCardsProps {
  urgentData: UrgentActionsData;
  onSelectFilter: (filter: string) => void;
  onSelectAreaAlert?: (loc: AreaAlertLocation) => void;
  onNavigateToProfiles?: () => void;
  onSelectStallCode?: (code: string) => void;
}

export default function UrgentActionCards({
  urgentData,
  onSelectFilter,
  onSelectAreaAlert,
  onNavigateToProfiles,
  onSelectStallCode,
}: UrgentActionCardsProps) {
  const { complaints, areaAlerts, expiringContracts, pendingProfiles } = urgentData;
  const [expandedLevels, setExpandedLevels] = useState({
    infrastructure: false,
    contracts: false,
    profiles: false,
  });

  const toggleLevel = (level: keyof typeof expandedLevels) => {
    setExpandedLevels((current) => ({
      ...current,
      [level]: !current[level],
    }));
  };

  return (
    <section className="mb-4 max-w-full overflow-hidden">
      <div className="mb-2.5 flex flex-col gap-2 border-b border-slate-200 pb-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-3.5 w-1.5 shrink-0 rounded-xs bg-[var(--color-brand-green)]" aria-hidden="true"></span>
          <h2 className="min-w-0 text-xs font-bold uppercase tracking-wider text-slate-900 font-sans">
            Sự Cố & Tác Vụ Cần Xử Lý Trong Ca
          </h2>
          <span className="hidden text-xs text-slate-400 font-sans sm:inline">
            • Phân cấp 4 tầng ưu tiên vận hành (Khẩn cấp • Cần chú ý • Bảo trì • Bình thường)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-sans">
          <span className="text-slate-400">Trực ban IoT:</span>
          <span className="font-mono font-bold text-slate-800">100% Cảm Biến Trực Tuyến</span>
        </div>
      </div>

      <div className="grid max-w-full grid-cols-1 divide-y divide-slate-200 rounded border border-slate-200 bg-white shadow-xs md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-12">
        <div 
          onClick={() => onSelectFilter('complaint')}
          className="group flex min-h-[13rem] cursor-pointer flex-col justify-between p-4 transition-colors hover:bg-rose-50/30 md:col-span-2 xl:col-span-4"
        >
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full bg-rose-600 motion-safe:animate-ping"
                  data-urgent-ping="motion"
                  aria-hidden="true"
                ></span>
                <span className="text-xs font-bold uppercase tracking-wide text-rose-800 font-sans">
                  Mức 1 • Phản ánh khẩn cấp
                </span>
              </div>
              <span className="flex min-h-11 items-center gap-0.5 text-xs font-medium text-rose-700 transition-transform font-sans group-hover:translate-x-0.5">
                Lọc sơ đồ <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="my-1 flex flex-wrap items-baseline gap-2.5">
              <span className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                {complaints.total}
              </span>
              <span className="text-xs font-bold text-slate-800 font-sans">
                phản ánh chưa xử lý
              </span>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 ml-auto">
                SLA: &le; 15p
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-sans text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                {complaints.critical} sự cố khẩn cấp
              </span>
              <span className="text-xs text-slate-600 font-sans">
                Nước tràn sạp{' '}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSelectStallCode?.('A12'); }}
                  className="min-h-11 rounded px-1 text-slate-900 font-mono font-bold underline hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  A12
                </button>
                , Khóa van gas{' '}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSelectStallCode?.('E08'); }}
                  className="min-h-11 rounded px-1 text-slate-900 font-mono font-bold underline hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  E08
                </button>
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500 font-sans">
            <span>
              Mới nhất:{' '}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSelectStallCode?.('A12'); }}
                className="min-h-11 rounded px-1 font-mono font-bold text-slate-800 underline hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                Sạp A12
              </button>
            </span>
            <span className="text-rose-700 font-mono font-semibold">{complaints.items[0]?.time || 'Vừa xong'}</span>
          </div>
        </div>

        <div className="flex min-h-[13rem] flex-col justify-between p-4 xl:col-span-3">
          <button
            type="button"
            onClick={() => toggleLevel('infrastructure')}
            className="mb-2 flex min-h-11 w-full items-center justify-between gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            aria-expanded={expandedLevels.infrastructure}
            aria-controls="priority-level-infrastructure"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-amber-900 font-sans">
                Mức 2 • Cảnh báo hạ tầng & cống rác
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-sans">
                <span className="font-mono">{areaAlerts.total}</span> điểm nóng
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-amber-800 transition-transform motion-reduce:transition-none ${expandedLevels.infrastructure ? 'rotate-180' : ''}`} />
            </span>
          </button>

          <div
            id="priority-level-infrastructure"
            className={`mt-1.5 space-y-1.5 ${expandedLevels.infrastructure ? '' : 'hidden md:block'}`}
          >
              {areaAlerts.locations.map((loc) => (
                <button
                  type="button"
                  key={loc.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectAreaAlert) onSelectAreaAlert(loc);
                  }}
                  className="min-h-11 w-full rounded border border-amber-200/80 bg-amber-50/50 p-2 text-left text-xs transition-colors font-sans hover:bg-amber-100/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 truncate">{loc.name}</span>
                    <span className="font-mono font-bold text-[10px] bg-amber-200 text-amber-900 px-1 rounded">
                      {loc.count} ca
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-800 truncate mt-0.5">{loc.detail}</div>
                </button>
              ))}
            </div>
        </div>

        <div className="group flex min-h-[13rem] flex-col justify-between p-4 transition-colors hover:bg-slate-50 xl:col-span-3">
          <div>
            <button
              type="button"
              onClick={() => toggleLevel('contracts')}
              className="mb-2 flex min-h-11 w-full items-center justify-between gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              aria-expanded={expandedLevels.contracts}
              aria-controls="priority-level-contracts"
            >
              <span className="text-xs font-bold uppercase tracking-wide text-slate-700 font-sans">
                Mức 3 • Hạn thuê sạp
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-slate-500 font-sans">
                Thu gọn <ChevronDown className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${expandedLevels.contracts ? 'rotate-180' : ''}`} />
              </span>
            </button>

            <div
              id="priority-level-contracts"
              className={expandedLevels.contracts ? '' : 'hidden md:block'}
            >
                <div className="my-1 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                    {expiringContracts.totalUnder30}
                  </span>
                  <span className="text-xs font-bold text-slate-800 font-sans">
                    sạp sắp hết hạn (&le; 30n)
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-sans">
                  <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950 font-mono">
                    {expiringContracts.criticalUnder7} sạp &le; 7 ngày
                  </span>
                  <span>Cần tái ký hợp đồng</span>
                </div>
              </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500 font-sans">
            <span>Sắp hết hạn nhất: <strong className="font-mono font-bold text-amber-700">Sạp C08 (6 ngày)</strong></span>
            <button
              type="button"
              onClick={() => onSelectFilter('expiring')}
              className="flex min-h-11 items-center gap-0.5 rounded px-2 font-medium text-slate-600 transition-transform hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] group-hover:translate-x-0.5"
            >
              Xem hết <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="group flex min-h-[13rem] flex-col justify-between p-4 transition-colors hover:bg-slate-50 xl:col-span-2">
          <div>
            <button
              type="button"
              onClick={() => toggleLevel('profiles')}
              className="mb-2 flex min-h-11 w-full items-center justify-between gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              aria-expanded={expandedLevels.profiles}
              aria-controls="priority-level-profiles"
            >
              <span className="text-xs font-bold uppercase tracking-wide text-slate-700 font-sans">
                Mức 4 • Hồ sơ thẩm định
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform motion-reduce:transition-none ${expandedLevels.profiles ? 'rotate-180' : ''}`} />
            </button>

            <div
              id="priority-level-profiles"
              className={expandedLevels.profiles ? '' : 'hidden md:block'}
            >
                <div className="my-1 flex flex-wrap items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                    {pendingProfiles.totalPending}
                  </span>
                  <span className="text-xs font-bold text-slate-700 font-sans">
                    hồ sơ chờ duyệt
                  </span>
                </div>

                <div className="mt-1 text-xs text-rose-600 font-sans font-medium">
                  • {pendingProfiles.overdue} hồ sơ quá hạn
                </div>
              </div>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-2 text-right">
            <button
              type="button"
              onClick={onNavigateToProfiles}
              className="inline-flex min-h-11 items-center gap-1 rounded px-2 text-xs font-bold text-[var(--color-brand-green)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              Vào duyệt hồ sơ <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
