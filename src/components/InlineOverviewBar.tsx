'use client';

import React from 'react';
import { Filter } from 'lucide-react';

interface InlineOverviewBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  counts: {
    all: number;
    complaint: number;
    expiring: number;
    maintenance: number;
    empty: number;
  };
}

export default function InlineOverviewBar({
  activeFilter,
  onFilterChange,
  selectedCategory,
  onCategoryChange,
  counts
}: InlineOverviewBarProps) {
  const filterButtons = [
    { id: 'all', label: 'Tất cả sạp', count: counts.all, color: 'neutral' },
    { id: 'complaint', label: 'Phản ánh khẩn cấp', count: counts.complaint, color: 'danger' },
    { id: 'expiring', label: 'Sắp hết hạn hợp đồng', count: counts.expiring, color: 'warning' },
    { id: 'maintenance', label: 'Đang bảo trì', count: counts.maintenance, color: 'neutral' },
    { id: 'empty', label: 'Sạp trống cho thuê', count: counts.empty, color: 'neutral' },
  ];

  const categories = [
    { id: 'all', label: 'Tất cả ngành hàng' },
    { id: 'Thực phẩm tươi', label: 'Thực phẩm tươi sống' },
    { id: 'Rau củ', label: 'Rau củ an toàn' },
    { id: 'Trái cây', label: 'Trái cây nhiệt đới' },
    { id: 'Gia vị', label: 'Gia vị & Đồ khô' },
  ];

  return (
    <div className="mb-3 flex max-w-full flex-col gap-3 rounded border border-slate-200 bg-white p-2 text-xs shadow-xs font-sans sm:flex-row sm:items-center sm:justify-between">
      <div
        data-testid="quick-filter-scroll-region"
        aria-label="Bộ lọc nhanh theo trạng thái sạp"
        className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1 sm:flex-1"
      >
        <div className="flex w-max min-w-full items-center gap-1.5">
          <span className="mr-1 hidden items-center gap-1 whitespace-nowrap text-slate-400 font-medium sm:flex">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" /> Lọc nhanh:
          </span>

          {filterButtons.map((btn) => {
            const isActive = activeFilter === btn.id;

            let activeStyle = 'bg-slate-900 text-white font-bold';
            if (btn.color === 'danger') activeStyle = 'bg-rose-600 text-white font-bold shadow-xs';
            if (btn.color === 'warning') activeStyle = 'bg-amber-500 text-slate-950 font-bold shadow-xs';

            return (
              <button
                key={btn.id}
                type="button"
                data-testid={`quick-filter-${btn.id}`}
                aria-pressed={isActive}
                onClick={() => onFilterChange(btn.id)}
                className={`flex min-h-11 flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap rounded px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                  isActive
                    ? activeStyle
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{btn.label}</span>
                <span 
                  className={`rounded px-1 text-[10px] font-mono ${
                    isActive ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {btn.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <label htmlFor="market-category-filter" className="hidden text-slate-400 md:inline">
          Ngành hàng:
        </label>
        <select
          id="market-category-filter"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="min-h-11 w-full cursor-pointer rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] sm:w-auto"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
