'use client';

import React, { useState } from 'react';
import type { SessionUser, Role } from '@/types/clientTypes';
import {
  BarChart3, ShieldCheck, Sparkles, Eye, EyeOff,
  ArrowRight, Store, UserCheck, Landmark, CheckCircle2
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: SessionUser) => void;
  onCancel?: () => void;
}

const DEMO_ACCOUNTS: Array<{ role: Role; title: string; subtitle: string; icon: React.ReactNode; user: SessionUser }> = [
  {
    role: 'market_manager',
    title: 'Quản lý Chợ Đồng Xuân',
    subtitle: 'Toàn quyền điều hành sạp, tiểu thương & sơ đồ',
    icon: <Store className="w-4 h-4 text-[#0B7A3A]" />,
    user: {
      id: 'u-mgr-1',
      fullName: 'Nguyễn Văn Quản Lý',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: '0912 345 678',
      email: 'quanly@smartmarket.vn',
      role: 'market_manager'
    }
  },
  {
    role: 'super_admin',
    title: 'Super Admin',
    subtitle: 'Quản trị viên tối cao toàn bộ hệ thống các chợ',
    icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
    user: {
      id: 'u-super-1',
      fullName: 'Lê Hoàng Minh',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      phone: '0903 888 999',
      email: 'admin@smartmarket.vn',
      role: 'super_admin'
    }
  },
  {
    role: 'province_admin',
    title: 'Sở Công Thương (Cấp Tỉnh)',
    subtitle: 'Giám sát chỉ số quy hoạch & an toàn thị trường',
    icon: <Landmark className="w-4 h-4 text-amber-600" />,
    user: {
      id: 'u-prov-1',
      fullName: 'Trần Thị Thu Hà',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      phone: '0988 765 432',
      email: 'so.congthuong@hanoi.gov.vn',
      role: 'province_admin'
    }
  }
];

export default function LoginPage({ onLogin, onCancel }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('quanly@smartmarket.vn');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Vui lòng nhập tên đăng nhập hoặc email.');
      return;
    }
    const defaultUser: SessionUser = {
      id: 'u-custom',
      fullName: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      avatar: null,
      phone: '0912 345 678',
      email: identifier,
      role: 'market_manager'
    };
    onLogin(defaultUser);
  };

  const handleQuickLogin = (user: SessionUser) => {
    onLogin(user);
  };

  return (
    <div className="min-h-screen w-full bg-[#EBF3FA] flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200/80">
        
        {/* Left Side: Brand Panel */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-[#0B7A3A] via-[#0D6334] to-[#153154] text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/95 p-1.5 shadow-md flex items-center justify-center">
              <img src="/images/smartmarket-logo.svg" alt="Smart Market Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">Smart Market</h2>
              <p className="text-xs text-emerald-200/80 font-medium">Nền tảng quản lý chợ thông minh</p>
            </div>
          </div>

          {/* Center Pitch */}
          <div className="my-8 relative z-10 space-y-4">
            <span className="text-[11px] font-black text-[#7CF3BF] tracking-widest uppercase font-mono">
              CONTROL CENTER
            </span>
            <h1 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight text-white">
              Vận hành chợ nhẹ nhàng hơn mỗi ngày.
            </h1>
            <p className="text-xs lg:text-sm text-white/80 leading-relaxed">
              Nắm bắt dữ liệu không gian, xử lý công việc và kết nối tiểu thương trong một không gian điều hành trực quan.
            </p>

            <div className="space-y-2.5 pt-4">
              <div className="flex items-center gap-2.5 text-xs text-white/90 font-medium">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#7CF3BF] shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span>Theo dõi chỉ số vận hành theo thời gian thực</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/90 font-medium">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#7CF3BF] shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Phân quyền an toàn theo từng vai trò</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/90 font-medium">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#7CF3BF] shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Tối ưu cho cả máy tính và điện thoại di động</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-white/50 relative z-10">
            © Smart Market CMS · Trung tâm điều hành thế hệ mới
          </div>
        </div>

        {/* Right Side: Login Form & Quick Demo */}
        <div className="w-full md:w-7/12 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-6 relative">
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Đóng màn hình đăng nhập"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>✕ Quay lại</span>
            </button>
          )}

          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Hệ thống đang sẵn sàng</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#153154] tracking-tight">
              Đăng Nhập Điều Hành
            </h2>
            <p className="text-xs text-slate-500">
              Nhập tài khoản quản lý hoặc chọn một vai trò Demo để trải nghiệm ngay
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Quick 1-Click Demo Section */}
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              ⚡ Đăng nhập nhanh (1-Click Demo)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  type="button"
                  key={acc.role}
                  onClick={() => handleQuickLogin(acc.user)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-[#0B7A3A] bg-slate-50 hover:bg-emerald-50/60 text-left transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="p-1 rounded-lg bg-white shadow-2xs group-hover:bg-[#0B7A3A]/10">
                      {acc.icon}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0B7A3A] transition-colors" />
                  </div>
                  <div className="font-extrabold text-xs text-[#153154] group-hover:text-[#0B7A3A]">
                    {acc.title}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {acc.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] font-bold text-slate-400 uppercase">Hoặc đăng nhập thông thường</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Standard Input Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Tên đăng nhập, email hoặc số điện thoại
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="VD: quanly@smartmarket.vn"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0B7A3A] focus:ring-1 focus:ring-[#0B7A3A] font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full text-xs p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0B7A3A] focus:ring-1 focus:ring-[#0B7A3A] font-semibold text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#0B7A3A] hover:bg-[#075A2B] text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>Đăng nhập vào Hệ thống</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
