'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, Clock, ShieldCheck, Menu } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenActivityModal?: () => void;
  urgentCount?: number;
  isMobileMenuOpen?: boolean;
  onOpenMobileMenu?: () => void;
  mobileMenuButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function Header({
  searchQuery,
  onSearchChange,
  onOpenActivityModal,
  urgentCount = 4,
  isMobileMenuOpen = false,
  onOpenMobileMenu,
  mobileMenuButtonRef
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--color-slate-border)] bg-[var(--color-slate-surface)] px-3 shadow-xs sm:gap-3 sm:px-4">
      <button
        ref={mobileMenuButtonRef}
        type="button"
        onClick={onOpenMobileMenu}
        aria-label={isMobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
        aria-controls="application-sidebar"
        aria-expanded={isMobileMenuOpen}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search Input */}
      <div className="relative min-w-0 flex-1 md:max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm mã sạp (A12), tên tiểu thương, ngành hàng..."
          aria-label="Tìm kiếm sạp, tiểu thương hoặc ngành hàng"
          className="h-11 w-full rounded-lg border border-[var(--color-slate-border)] bg-slate-50 py-2 pl-9 pr-9 text-[13px] text-slate-800 transition-all placeholder:text-slate-400 focus:border-[var(--color-brand-green)] focus:bg-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Xóa nội dung tìm kiếm"
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-xs font-bold text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            ×
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-1.5 text-xs font-sans sm:gap-3">
        {/* System Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-mono text-[11px] border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Ca sáng:</span>
          <span className="font-bold text-slate-900">{currentTime || '10:45:00'}</span>
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={onOpenActivityModal}
          aria-label={`Nhật ký hoạt động & Thông báo sự cố${urgentCount > 0 ? `, ${urgentCount} việc khẩn cấp` : ''}`}
          className="relative flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          title="Nhật ký hoạt động & Thông báo sự cố"
        >
          <Bell className="w-4 h-4" />
          {urgentCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
          )}
          {urgentCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600"></span>
          )}
        </button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

        {/* Duty Manager Profile */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-[var(--color-brand-green)] border border-emerald-200 flex items-center justify-center font-bold font-mono text-xs">
            QL
          </div>
          <div className="hidden md:block text-left">
            <div className="font-bold text-slate-800 leading-tight flex items-center gap-1">
              Trưởng Ban Quản Lý
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-brand-green)]" />
            </div>
            <div className="text-[10px] text-slate-500 leading-none">Chợ Đồng Xuân • Trực Ban</div>
          </div>
        </div>
      </div>
    </header>
  );
}
