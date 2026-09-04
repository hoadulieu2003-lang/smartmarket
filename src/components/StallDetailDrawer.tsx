'use client';

import React, { useState, useEffect } from 'react';
import {
  X, AlertCircle, Clock, Phone, FileText, Send,
  ShieldCheck, UserCheck, DollarSign, CheckCircle2,
  Droplets, Flame, Hourglass, Wrench, TriangleAlert, Ban
} from 'lucide-react';
import type { OperationalIssue, StallEntity } from '../spatial/model/types';
import { deriveStallVisual } from '../spatial/presentation/stallVisualAdapter';

export interface StallDetailDrawerProps {
  stall: StallEntity | null;
  onClose: () => void;
  onQuickDispatch?: (stall: StallEntity, targetTeam: string) => void;
  onExtendContract?: (stall: StallEntity) => void;
  onCollectFee?: (stall: StallEntity) => void;
  onViewComplaints?: (stall: StallEntity) => void;
}

const priorityCopy = {
  urgent: 'Khẩn cấp',
  attention: 'Cần chú ý',
  maintenance: 'Đang bảo trì',
  normal: 'Bình thường',
} as const;

type DrawerIssue = OperationalIssue & {
  priority?: string;
};

function getIssueIcon(issue: DrawerIssue, stallCode: string) {
  if (issue.type === 'water' || stallCode === 'A12') {
    return { Icon: Droplets, className: 'text-sky-700' };
  }

  if (issue.type === 'fire_safety' || stallCode === 'E08') {
    return { Icon: Flame, className: 'text-rose-700' };
  }

  if (issue.type === 'security' || issue.type === 'encroachment' || stallCode === 'B14') {
    return { Icon: Ban, className: 'text-rose-700' };
  }

  if (issue.type === 'contract_expiry') {
    return { Icon: Hourglass, className: 'text-amber-700' };
  }

  if (issue.type === 'maintenance') {
    return { Icon: Wrench, className: 'text-yellow-700' };
  }

  return { Icon: TriangleAlert, className: 'text-amber-700' };
}

export default function StallDetailDrawer({
  stall,
  onClose,
  onQuickDispatch,
  onExtendContract,
  onCollectFee,
  onViewComplaints,
}: StallDetailDrawerProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [assignedStaff] = useState<string>('Tổ Vệ Sinh Ca Sáng (Nguyễn Văn An)');
  const [slaSecondsLeft, setSlaSecondsLeft] = useState<number>(765); // ~12m45s

  useEffect(() => {
    const timer = setInterval(() => {
      setSlaSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!stall) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, stall]);

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleDragTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleDragTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    if (deltaY > 50) {
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose();
      }
    } else if (deltaY < -50) {
      setIsExpanded(true);
    }
    setTouchStartY(null);
  };

  if (!stall) return null;

  const descriptor = deriveStallVisual(stall, { selected: true });
  const drawerPriority = descriptor.priority ?? 'normal';

  const triggerAction = (msg: string, callback?: () => void) => {
    setToastMessage(msg);
    callback?.();
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatSla = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const metadata = stall.metadata || {};
  const state = stall.state;
  const hasCriticalComplaint = descriptor.priority === 'urgent' || (state.complaintsCount > 0);
  const isExpiringSoon = state.contractDaysLeft !== undefined && state.contractDaysLeft <= 30;
  const hasFeePending = state.feeStatus === 'overdue' || state.feeStatus === 'pending';

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay (Lớp phủ mờ nền khi mở trên thiết bị hiện trường) */}
      <div 
        data-testid="drawer-backdrop"
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-2xs transition-opacity lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        id="decision-panel-drawer"
        data-testid="decision-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-panel-title"
        onTouchStart={handleDragTouchStart}
        onTouchEnd={handleDragTouchEnd}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col overflow-hidden bg-white text-slate-800 shadow-2xl ring-1 ring-slate-900/10 motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-200 sm:inset-y-3 sm:right-3 sm:h-auto sm:w-[min(420px,calc(100vw-32px))] sm:rounded-lg font-sans transition-all duration-300 ${
          !isExpanded ? 'max-h-[46vh] bottom-0 top-auto sm:inset-y-3' : 'max-h-full'
        }`}
      >

        {/* Tactile Drag Handle Pill for Mobile/Tablet Gesture Feedback (Gờ kéo điều khiển xúc giác) */}
        <div 
          data-testid="drag-handle-pill"
          className="flex cursor-grab active:cursor-grabbing items-center justify-center py-2 bg-slate-50/95 border-b border-slate-200/60 lg:hidden select-none"
          onClick={() => setIsExpanded((prev) => !prev)}
          role="button"
          tabIndex={0}
          aria-label={isExpanded ? 'Gờ kéo thu gọn bảng' : 'Gờ kéo mở rộng bảng'}
        >
          <div className="h-1.5 w-12 rounded-full bg-slate-300 transition-colors hover:bg-slate-400" />
        </div>

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/90 p-3 sm:p-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-[var(--color-brand-green)] px-2 py-0.5 font-mono text-xs font-black text-white shadow-xs">
                SẠP {stall.code}
              </span>
              <span className="text-[11px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300 font-semibold">
                {stall.zoneId ? `Khu ${stall.zoneId.replace('zone_', '')}` : 'Khu A'} • T1
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-[var(--color-brand-green)]">
                {state.isOccupied ? 'Kinh doanh' : 'Sạp trống'}
              </span>
              {/* Quick toggle expanded indicator on mobile */}
              <button
                type="button"
                data-testid="toggle-sheet-mode-btn"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="lg:hidden text-[10px] font-bold text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer"
              >
                {isExpanded ? 'Thu gọn (38%)' : 'Mở rộng (85%)'}
              </button>
            </div>
            <h2 id="decision-panel-title" className="break-words text-base font-extrabold leading-tight text-slate-900">
              SẠP {stall.code} — {metadata.name || 'Gian hàng tiêu chuẩn'}
            </h2>
            <div className="mt-1 break-words text-xs text-slate-500">
              Chủ sạp: <strong className="text-slate-800 font-semibold">{metadata.merchantName || 'Chưa cập nhật'}</strong>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer"
            aria-label="Đóng bảng chi tiết"
            title="Đóng bảng chi tiết"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="flex items-center justify-between gap-3 border-b border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-[var(--color-brand-green)]">
            <span className="flex min-w-0 items-center gap-1.5 break-words">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-brand-green)]" aria-hidden="true" /> {toastMessage}
            </span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-emerald-800 font-bold hover:bg-emerald-100 cursor-pointer"
              aria-label="Ẩn thông báo"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Decision Panel Scrollable Body (6 KHỐI CHUẨN HÓA) */}
        <div className="flex-1 space-y-3.5 overflow-y-auto overscroll-contain p-3.5 text-xs sm:p-4">

        {/* ========================================================================= */}
        {/* KHỐI 1: MÃ SẠP VÀ MỨC ƯU TIÊN */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#076C31]" /> 1. Mã Sạp & Mức Ưu Tiên
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 ${
              drawerPriority === 'urgent'
                ? 'bg-rose-600 text-white motion-safe:animate-pulse'
                : drawerPriority === 'attention'
                ? 'bg-amber-500 text-white'
                : drawerPriority === 'maintenance'
                ? 'bg-yellow-600 text-white'
                : 'bg-emerald-100 text-[#076C31]'
            }`} aria-label={`Mức ưu tiên: ${priorityCopy[drawerPriority]}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
              {priorityCopy[drawerPriority]}
            </span>
          </div>

          <div className="flex flex-col gap-1 pt-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div className="min-w-0">
              <span className="block font-mono text-xl font-black tracking-tight text-slate-900">SẠP {stall.code}</span>
              <span className="text-[11px] font-medium text-slate-500">
                {stall.zoneId ? `Khu ${stall.zoneId.replace('zone_', '')}` : 'Khu A'} • Tầng 1
              </span>
            </div>
            <span className="w-fit rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-[var(--color-brand-green)]">
              {state.isOccupied ? 'Đang kinh doanh' : 'Sạp trống'}
            </span>
          </div>

          <div className="break-words text-xs font-bold text-slate-800">
            {metadata.name || 'Gian hàng tiêu chuẩn'}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KHỐI 2: THÔNG TIN TIỂU THƯƠNG */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-[var(--color-brand-green)]" aria-hidden="true" /> 2. Thông tin Tiểu thương
            </span>
            <button
              onClick={() => triggerAction(`Đang kết nối cuộc gọi tới ${metadata.phone || '0901 234 567'}...`)}
              className="flex min-h-8 items-center gap-1 rounded bg-[var(--color-brand-green)] px-2 text-[10px] font-bold text-white shadow-2xs hover:bg-emerald-800 cursor-pointer"
            >
              <Phone className="w-3 h-3" aria-hidden="true" /> Gọi
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 border-t border-slate-200/80 pt-1 min-[360px]:grid-cols-2">
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px]">Chủ hộ kinh doanh</span>
              <span className="break-words text-xs font-extrabold text-slate-900">{metadata.merchantName || 'Trần Văn Hùng'}</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px]">Số điện thoại</span>
              <span className="break-words font-mono text-xs font-bold text-slate-800">{metadata.phone || '0901 234 567'}</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px]">Ngành hàng</span>
              <span className="break-words text-xs font-bold text-slate-800">{metadata.category || 'Thủy hải sản'}</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px]">Diện tích ô sạp</span>
              <span className="font-mono font-bold text-slate-800 text-xs">{metadata.areaM2 || 8.0} m²</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KHỐI 3: CÁC VẤN ĐỀ HIỆN TẠI (CURRENT ISSUES) */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" /> 3. Các Vấn Đề Hiện Tại
            </span>
            <span className="font-mono font-bold text-[10px] text-slate-500">
              {state.complaintsCount || (state.issues?.length || 0)} vấn đề
            </span>
          </div>

          {state.issues && state.issues.length > 0 ? (
            <div className="space-y-2 pt-1 border-t border-slate-200/80">
              {state.issues.map((iss: DrawerIssue, idx: number) => {
                const isCritical = iss.priority === 'P0' || iss.severity === 'critical';
                const { Icon, className } = getIssueIcon(iss, stall.code);
                return (
                  <div
                    key={iss.id || idx}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 ${
                      isCritical
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/75 ring-1 ring-inset ring-slate-200" aria-hidden="true">
                      <Icon className={`h-4 w-4 ${className}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 min-[360px]:flex-row min-[360px]:items-start min-[360px]:justify-between">
                        <span className="break-words text-xs font-bold">{iss.title}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                          isCritical ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {isCritical ? 'Khẩn cấp' : 'Chú ý'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        {iss.description || (isCritical ? 'Cần điều phối xử lý ngay trong ca trực' : 'Kiểm tra định kỳ')}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isExpiringSoon && (
                <div className="flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-950 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Hourglass className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" /> Hạn hợp đồng còn {state.contractDaysLeft} ngày
                  </span>
                  <span className="font-mono text-[10px] text-amber-800">Tái ký: 15/09/26</span>
                </div>
              )}

              {hasFeePending && (
                <div className="flex flex-col gap-1 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-950 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <DollarSign className="w-3.5 h-3.5 shrink-0 text-rose-600" aria-hidden="true" />
                    {state.feeStatus === 'overdue' ? 'Nợ phí quá hạn' : 'Chưa nộp phí tháng 9'}
                  </span>
                  <span className="font-mono font-bold text-xs text-rose-700">450.000đ</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center text-emerald-900 text-[11px] font-medium">
              <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-[var(--color-brand-green)]" aria-hidden="true" />
              Không có sự cố nào ghi nhận. Sạp đang vận hành ổn định.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* KHỐI 4: NGƯỜI XỬ LÝ VÀ DEADLINE */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" /> 4. Người Xử Lý & Deadline
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2">
            <div className="flex flex-col gap-1 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
              <span className="text-slate-500 text-[10px]">Đơn vị phụ trách:</span>
              <span className="break-words text-xs font-bold text-slate-900 min-[360px]:text-right">{assignedStaff}</span>
            </div>

            {state.issues && state.issues.length > 0 ? (
              <div className="flex flex-col gap-1 border-t border-slate-100 pt-1 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-600 motion-safe:animate-spin" aria-hidden="true" /> SLA Tác chiến:
                </span>
                <span className="font-mono font-extrabold text-rose-700 text-xs">
                  Còn {formatSla(slaSecondsLeft)} (Cam kết &le; 15p)
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1 border-t border-slate-100 pt-1 text-[11px] text-slate-600 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                <span>Giám sát khu vực:</span>
                <span className="break-words font-semibold text-slate-800 min-[360px]:text-right">Đội QL Thị Trường Khu A</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KHỐI 5: LỊCH SỬ GẦN NHẤT */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" /> 5. Lịch Sử Gần Nhất
          </div>
          <div className="space-y-1.5 pt-1 border-t border-slate-200/80 text-[11px]">
            <div className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-slate-400 font-bold shrink-0">08:15</span>
              <span className="min-w-0 break-words text-slate-700">Tiếp nhận phản ánh nước tràn từ App BQL</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-slate-400 font-bold shrink-0">08:22</span>
              <span className="min-w-0 break-words text-slate-700">Điều phối Tổ vệ sinh ca sáng tiếp nhận xử lý</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-slate-400 font-bold shrink-0">01/09</span>
              <span className="min-w-0 break-words text-slate-700">Hoàn tất nộp phí quản lý kỳ tháng 9</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* KHỐI 6: CÁC ACTION ĐƯỢC PHÉP (DYNAMIC ACTIONS & PRIMARY BUTTON ≥42PX) */}
      {/* ========================================================================= */}
      <div className="space-y-2 border-t border-slate-200 bg-slate-50 p-3 shadow-lg sm:p-4">
        {/* Dynamic Primary Action */}
        {hasCriticalComplaint ? (
          <button
            onClick={() => triggerAction(`Đã giao xử lý khẩn cấp sự cố cho Sạp ${stall.code} tới ${assignedStaff}`, () => onQuickDispatch?.(stall, assignedStaff))}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2.5 text-center text-sm font-extrabold text-white shadow-md transition-colors hover:bg-rose-700 cursor-pointer"
          >
            <Send className="w-4 h-4 shrink-0" aria-hidden="true" /> <span className="min-w-0 break-words">Giao Xử Lý Ngay (SLA 15p)</span>
          </button>
        ) : isExpiringSoon ? (
          <button
            onClick={() => triggerAction(`Đã mở quy trình gia hạn hợp đồng cho Sạp ${stall.code}`, () => onExtendContract?.(stall))}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2.5 text-center text-sm font-extrabold text-white shadow-md transition-colors hover:bg-amber-700 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> <span className="min-w-0 break-words">Gia Hạn Hợp Đồng Ngay</span>
          </button>
        ) : hasFeePending ? (
          <button
            onClick={() => triggerAction(`Đã ghi nhận thu phí dịch vụ cho Sạp ${stall.code}`, () => onCollectFee?.(stall))}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-green)] px-3 py-2.5 text-center text-sm font-extrabold text-white shadow-md transition-colors hover:bg-emerald-800 cursor-pointer"
          >
            <DollarSign className="w-4 h-4 shrink-0" aria-hidden="true" /> <span className="min-w-0 break-words">Ghi Nhận Thu Phí</span>
          </button>
        ) : (
          <button
            onClick={() => triggerAction(`Xem toàn bộ hồ sơ lưu trữ và lịch sử Sạp ${stall.code}`)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2.5 text-center text-sm font-extrabold text-white shadow-md transition-colors hover:bg-slate-900 cursor-pointer"
          >
            <FileText className="w-4 h-4 shrink-0" aria-hidden="true" /> <span className="min-w-0 break-words">Xem Lịch Sử Sạp</span>
          </button>
        )}

        {/* Secondary Actions Grid */}
        <div className="grid grid-cols-1 gap-1.5 text-xs min-[360px]:grid-cols-2">
          {hasCriticalComplaint ? (
            <>
              <button
                onClick={() => triggerAction(`Xem nội dung chi tiết phản ánh & hình ảnh hiện trường`, () => onViewComplaints?.(stall))}
                className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center font-bold text-slate-800 transition-colors hover:bg-slate-100 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-rose-600" aria-hidden="true" /> <span className="min-w-0 break-words">Xem phản ánh</span>
              </button>
              <button
                onClick={() => triggerAction(`Đã mở lịch sử toàn diện của Sạp ${stall.code}`)}
                className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center font-bold text-slate-800 transition-colors hover:bg-slate-100 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 shrink-0 text-slate-600" aria-hidden="true" /> <span className="min-w-0 break-words">Xem lịch sử sạp</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => triggerAction(`Đang kết nối cuộc gọi tới ${metadata.phone || '0901 234 567'}...`)}
                className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center font-bold text-slate-800 transition-colors hover:bg-slate-100 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 shrink-0 text-[var(--color-brand-green)]" aria-hidden="true" /> <span className="min-w-0 break-words">Liên hệ sạp</span>
              </button>
              <button
                onClick={() => triggerAction(`Đã mở hồ sơ pháp lý & hợp đồng sạp ${stall.code}`)}
                className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center font-bold text-slate-800 transition-colors hover:bg-slate-100 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-slate-600" aria-hidden="true" /> <span className="min-w-0 break-words">Hồ sơ hợp đồng</span>
              </button>
            </>
          )}
        </div>

        {/* Nút đóng panel */}
        <button
          onClick={onClose}
          className="min-h-[44px] w-full rounded-lg bg-transparent px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200 cursor-pointer"
        >
          Đóng bảng chi tiết (ESC)
        </button>
      </div>

    </div>
    </>
  );
}
