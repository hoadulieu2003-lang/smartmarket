'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, Clock, ShieldCheck, Menu, Calendar, ChevronDown, ChevronLeft } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenActivityModal?: () => void;
  urgentCount?: number;
  isMobileMenuOpen?: boolean;
  onOpenMobileMenu?: () => void;
  onToggleMobileMenu?: () => void;
  mobileMenuButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function Header({
  searchQuery,
  onSearchChange,
  onOpenActivityModal,
  urgentCount = 4,
  isMobileMenuOpen = false,
  onOpenMobileMenu,
  onToggleMobileMenu,
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
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[#DCE8F1] bg-white px-3 shadow-[0_2px_8px_rgba(42,72,108,0.04)] sm:gap-3 sm:px-4">
      {/* Left: Mobile Menu & Welcome Text */}
      <div className="flex items-center gap-2">
        <button
          ref={mobileMenuButtonRef}
          type="button"
          onClick={onToggleMobileMenu ?? onOpenMobileMenu}
          aria-label={isMobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
          aria-controls="application-sidebar"
          aria-expanded={isMobileMenuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#7185A1] transition-colors hover:bg-slate-100 hover:text-[#1D385F] md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Back Button (Desktop) */}
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="Quay lại"
          className="hidden sm:flex w-8 h-8 rounded-full border border-[#DCE8F1] items-center justify-center text-[#7185A1] hover:bg-[#F5FAF8] hover:text-[#1D385F] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Green Vertical Separator */}
        <div className="hidden sm:block w-[3px] h-6 bg-[#0B7A3A] rounded-full mx-1" aria-hidden="true" />

        {/* Greeting Heading */}
        <div className="text-left">
          <h2 className="text-sm sm:text-base font-extrabold text-[#1D385F] leading-tight flex items-center gap-1">
            <span>Xin chào, Quản lý Chợ Đồng Xuân!</span>
            <span>👋</span>
          </h2>
          <p className="text-[11px] text-[#7185A1] font-medium hidden sm:block">
            Trung tâm điều hành • Theo dõi hoạt động chợ
          </p>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="relative min-w-0 flex-1 max-w-xs md:max-w-md mx-2">
        <Search className="w-4 h-4 text-[#7185A1] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm mã sạp (A12), tên tiểu thương, ngành hàng..."
          aria-label="Tìm kiếm sạp, tiểu thương hoặc ngành hàng"
          className="h-10 w-full rounded-lg border border-[#DCE8F1] bg-[#F5FAF8] py-2 pl-9 pr-9 text-[13px] text-[#1D385F] transition-all placeholder:text-[#7185A1]/70 focus:border-[#0B7A3A] focus:bg-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B7A3A]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Xóa nội dung tìm kiếm"
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-xs font-bold text-[#7185A1] hover:bg-slate-200/70 hover:text-[#1D385F]"
          >
            ×
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3 text-xs font-sans">
        {/* Calendar Pill */}
        <div className="hidden xl:flex items-center gap-1.5 text-[#7185A1] font-medium text-xs">
          <Calendar className="w-3.5 h-3.5 text-[#7185A1]" />
          <span>Thứ 7, 05/09/2026</span>
        </div>

        {/* Live Clock Pill */}
        <div className="hidden lg:flex items-center gap-1.5 text-[#F5A623] font-bold text-xs">
          <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
          <span>{currentTime || '15:13'}</span>
        </div>

        {/* Market Selector Pill */}
        <div className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DCE8F1] bg-white text-xs font-bold text-[#1D385F] shadow-2xs">
          <span>Chợ Đồng Xuân (Demo)</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#7185A1]" />
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={onOpenActivityModal}
          aria-label={`Nhật ký hoạt động & Thông báo sự cố${urgentCount > 0 ? `, ${urgentCount} việc khẩn cấp` : ''}`}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE8F1] text-[#7185A1] hover:text-[#1D385F] hover:bg-[#F5FAF8] transition-colors cursor-pointer"
          title="Nhật ký hoạt động & Thông báo sự cố"
        >
          <Bell className="w-4 h-4" />
          {urgentCount > 0 && (
            <span
              aria-hidden="true"
              data-urgent-ping="motion"
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EE565D] motion-safe:animate-ping opacity-75"
            ></span>
          )}
          {urgentCount > 0 && (
            <span aria-hidden="true" className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EE565D] text-white text-[10px] font-black flex items-center justify-center">
              {urgentCount}
            </span>
          )}
        </button>

        {/* Duty Manager Profile */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-9 h-9 rounded-full bg-[#45A9D7] text-white flex items-center justify-center font-black text-sm shadow-xs">
            Q
          </div>
          <div className="hidden md:block text-left">
            <div className="font-extrabold text-[#1D385F] text-xs leading-tight">
              Quản lý Chợ Đồng Xuân
            </div>
            <div className="text-[10px] text-[#7185A1] font-medium leading-none mt-0.5">
              Quản lý chợ
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
