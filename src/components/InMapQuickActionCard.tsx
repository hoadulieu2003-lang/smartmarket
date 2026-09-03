'use client';

import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Send, 
  ShieldAlert, 
  Sparkles, 
  User, 
  X, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import type { StallEntity } from '@/spatial/model/types';

interface InMapQuickActionCardProps {
  stall: StallEntity;
  onClose: () => void;
  onOpenDrawer: (stall: StallEntity) => void;
  onQuickDispatch: (stallId: string, teamName: string) => void;
  position?: { x: number; y: number };
}

export default function InMapQuickActionCard({
  stall,
  onClose,
  onOpenDrawer,
  onQuickDispatch,
  position
}: InMapQuickActionCardProps) {
  const issue = (stall.state?.issues && stall.state.issues[0]) as any;
  const taskInfo = (stall.state as any)?.taskInfo;
  const dispatchStatus = taskInfo?.dispatchStatus || issue?.status || 'open';
  const isP0 = issue?.priority === 'P0' || stall.code === 'A12' || stall.code === 'E08' || stall.code === 'C11';
  const isDispatched = dispatchStatus === 'in_progress' || dispatchStatus === 'dispatched';

  return (
    <div 
      className="absolute z-40 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200/90 w-84 p-3.5 text-slate-850 font-sans transition-all animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position ? `${Math.min(Math.max(position.x - 168, 20), window.innerWidth - 360)}px` : '50%',
        top: position ? `${Math.max(position.y - 180, 20)}px` : '20%',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Stall Code & Close */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded font-mono font-extrabold text-xs text-white ${
            isP0 ? 'bg-rose-600 shadow-xs' : 'bg-amber-500 text-white'
          }`}>
            Sạp {stall.code}
          </span>
          <span className="font-semibold text-xs text-slate-800 truncate max-w-[140px]">
            {stall.metadata?.merchantName || stall.metadata?.name}
          </span>
        </div>

        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
          title="Đóng bảng tác chiến"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Incident Title & SLA */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className={`font-bold flex items-center gap-1 ${
            isP0 ? 'text-rose-600' : 'text-amber-600'
          }`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            {isP0 ? 'Sự cố khẩn cấp' : 'Cảnh báo vận hành'}
          </span>

          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-rose-500" />
            SLA: ≤ {issue?.slaMinutesRemaining || (isP0 ? 15 : 45)}p
          </span>
        </div>

        <p className="text-xs font-medium text-slate-900 leading-snug">
          {issue?.title || 'Phát hiện sự cố bất thường cần BQL xác nhận.'}
        </p>

        {isDispatched && (
          <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-[11px] font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Đang xử lý bởi: <strong>{taskInfo?.assignedTeam || 'Tổ Vệ Sinh Ca Sáng'}</strong></span>
          </div>
        )}
      </div>

      {/* 1-Touch Fast Dispatch Buttons */}
      {!isDispatched ? (
        <div className="space-y-1.5 mb-2.5">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400">
            Điều phối 1-chạm (Giao việc tức thì):
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onQuickDispatch(stall.id, 'Tổ Vệ Sinh Ca Sáng')}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>🧹 Tổ Vệ Sinh</span>
            </button>

            <button
              onClick={() => onQuickDispatch(stall.id, 'Đội Bảo Vệ Trực Ban')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>🛡️ Đội Bảo Vệ</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Footer: Open Drawer for full audit */}
      <button
        onClick={() => {
          onOpenDrawer(stall);
          onClose();
        }}
        className="w-full py-1 text-center text-[11px] text-[#076C31] hover:text-emerald-800 font-bold flex items-center justify-center gap-1 hover:underline cursor-pointer border-t border-slate-100 pt-2"
      >
        <span>Xem CCTV & Đối soát ảnh chi tiết</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
