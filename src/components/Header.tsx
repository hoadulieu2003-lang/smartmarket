'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, Clock3, CalendarDays, ChevronDown,
  Menu, Store, ShieldCheck, LogOut, UserCheck, KeyRound
} from 'lucide-react';
import { CLIENT_MARKETS } from '@/data/clientCmsData';
import type { SessionUser } from '@/types/clientTypes';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenActivityModal?: () => void;
  urgentCount?: number;
  isMobileMenuOpen?: boolean;
  onOpenMobileMenu?: () => void;
  onToggleMobileMenu?: () => void;
  mobileMenuButtonRef?: React.RefObject<HTMLButtonElement | null>;
  selectedMarketId?: string;
  onSelectMarketId?: (id: string) => void;
  currentUser?: SessionUser | null;
  onLogout?: () => void;
  onOpenLogin?: () => void;
  markets?: any[];
}

export default function Header({
  searchQuery,
  onSearchChange,
  onOpenActivityModal,
  urgentCount = 4,
  isMobileMenuOpen = false,
  onOpenMobileMenu,
  onToggleMobileMenu,
  mobileMenuButtonRef,
  selectedMarketId = 'm-dongxuan',
  onSelectMarketId,
  currentUser,
  onLogout,
  onOpenLogin,
  markets
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[#DCE8F1] bg-white/90 backdrop-blur-md px-3 shadow-[0_2px_8px_rgba(42,72,108,0.04)] sm:gap-3 sm:px-4">
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


        {/* Gold & Green Separator */}
        <div className="hidden sm:block w-[3px] h-6 bg-[#0B7A3A] rounded-full mx-1" aria-hidden="true" />

        {/* Greeting Heading */}
        <div className="text-left">
          <h2 className="reference-greeting text-sm sm:text-base font-black text-[#153154] leading-tight flex items-center gap-1.5 flex-wrap">
            <span>Xin chào, {currentUser?.fullName || 'Super Admin'}!</span>
            <span>👋</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Server
            </span>
          </h2>
          <p className="topbar-subtitle text-[11px] text-[#7890AC] font-medium hidden sm:block">
            Trung tâm điều hành · api.chothongminh.top
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
          placeholder="Tìm mã sạp (A-01), tiểu thương, ngành hàng..."
          aria-label="Tìm kiếm sạp, tiểu thương hoặc ngành hàng"
          className="h-10 w-full rounded-lg border border-[#DCE8F1] bg-[#F7FBFA] py-2 pl-9 pr-9 text-[13px] text-[#1D385F] transition-all placeholder:text-[#7185A1]/70 focus:border-[#0B7A3A] focus:bg-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B7A3A]"
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
        <div className="hidden xl:flex items-center gap-1.5 text-[#637B9C] font-semibold text-xs">
          <CalendarDays className="w-4 h-4 text-[#637B9C]" />
          <span>{currentDate || 'Thứ 7, 05/09/2026'}</span>
        </div>

        {/* Live Clock Pill */}
        <div className="hidden lg:flex items-center gap-1.5 text-[#D9A441] font-bold text-xs">
          <Clock3 className="w-4 h-4 text-[#D9A441]" />
          <span>{currentTime || '15:13'}</span>
        </div>

        {/* Market Selector Dropdown */}
        <div className="hidden sm:inline-flex items-center">
          <select
            value={selectedMarketId}
            onChange={(e) => onSelectMarketId?.(e.target.value)}
            aria-label="Chọn chợ điều hành"
            className="text-xs font-extrabold px-3 py-1.5 rounded-lg border border-[#DCE8F1] bg-white text-[#153154] shadow-2xs focus:outline-none focus:border-[#0B7A3A] cursor-pointer"
          >
            <option value="all">Tất cả chợ</option>
            {((markets && markets.length > 0) ? markets : CLIENT_MARKETS).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={onOpenActivityModal}
          aria-label={`Nhật ký hoạt động & Thông báo sự cố${urgentCount > 0 ? `, ${urgentCount} việc khẩn cấp` : ''}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE8F1] text-[#294463] hover:text-[#0B7A3A] hover:bg-[#EFF9F3] transition-colors cursor-pointer"
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

        {/* Duty Manager Profile & User Menu */}
        {currentUser ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-label="Tài khoản cán bộ điều hành"
              aria-expanded={isUserMenuOpen}
              className="flex items-center gap-2 pl-1 py-1 pr-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <div className="reference-avatar w-9 h-9 rounded-full bg-[#17A5D6] text-white flex items-center justify-center font-black text-sm shadow-xs border-2 border-[#D9A441] overflow-hidden">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.fullName} className="w-full h-full object-cover" />
                ) : (
                  currentUser.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-extrabold text-[#153154] text-xs leading-tight flex items-center gap-1">
                  <span>{currentUser.fullName}</span>
                  <ChevronDown className="w-3 h-3 text-[#7890AC]" />
                </div>
                <div className="text-[10px] text-[#7890AC] font-medium leading-none mt-0.5">
                  {currentUser.role === 'super_admin' ? 'Super Admin · Toàn hệ thống' :
                   currentUser.role === 'province_admin' ? 'Sở Công Thương · TP. Hà Nội' :
                   currentUser.role === 'market_manager' ? 'Quản lý Chợ · Đồng Xuân' :
                   'Cán bộ điều hành'}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200 py-3 px-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                {/* User Info Header */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-[#17A5D6] text-white flex items-center justify-center font-black text-sm border-2 border-[#D9A441] overflow-hidden shrink-0">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.fullName} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#153154] truncate">{currentUser.fullName}</p>
                    <p className="text-[11px] text-[#7890AC] truncate">{currentUser.email || currentUser.phone}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-emerald-50 text-[#0B7A3A] border border-emerald-200">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 space-y-1">
                  {onOpenLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-[#153154] rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#D9A441]" />
                      <span>Đổi vai trò / Tài khoản khác</span>
                    </button>
                  )}
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Đăng xuất khỏi phiên</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B7A3A] text-white text-xs font-bold hover:bg-[#09632f] transition-all shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
}
