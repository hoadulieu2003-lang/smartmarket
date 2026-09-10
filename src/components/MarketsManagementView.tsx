'use client';

import React from 'react';
import { CLIENT_MARKETS } from '@/data/clientCmsData';
import { Landmark, MapPin, Phone, Mail, Store, Users, Star, ArrowRight } from 'lucide-react';

interface MarketsManagementViewProps {
  markets?: any[];
  onSelectMarket?: (marketId: string) => void;
}

export default function MarketsManagementView({ markets, onSelectMarket }: MarketsManagementViewProps) {
  const displayMarkets = (markets && markets.length > 0) ? markets : CLIENT_MARKETS;

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0B7A3A] flex items-center justify-center font-bold">
              <Landmark className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-[#153154] tracking-tight">Quản Lý Chợ</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {displayMarkets.length} chợ trong phạm vi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Danh sách các chợ dân sinh và thương mại thuộc phạm vi quản lý trung tâm điều hành
          </p>
        </div>
      </div>

      {/* Market Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayMarkets.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
            <div className="h-32 bg-gradient-to-br from-[#153154] to-[#1F497D] p-4 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
              <div>
                <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold font-mono uppercase tracking-wider">
                  {m.code}
                </span>
                <h2 className="text-lg font-black mt-1 text-white">{m.name}</h2>
              </div>
              <div className="flex items-center gap-1 text-amber-300 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>{m.ratingAvg} / 5.0</span>
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-slate-600 line-clamp-2">{m.description}</p>

              <div className="space-y-1.5 text-slate-600 border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{m.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{m.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Trưởng ban: <strong>{m.managers?.[0]?.fullName}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center font-bold">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Quy mô sạp</span>
                  <div className="text-sm font-black text-[#153154]">{m.stallCount} sạp</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Đang thuê</span>
                  <div className="text-sm font-black text-[#0B7A3A]">{m.occupiedStallCount} sạp</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectMarket?.(m.id)}
                className="w-full py-2 rounded-lg bg-[#0B7A3A] hover:bg-[#075A2B] text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>Vào điều hành chợ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
