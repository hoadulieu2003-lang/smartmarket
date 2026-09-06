'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, 
  Box, 
  Eye,
  Gauge,
  Maximize2, 
  Minimize2,
  ReceiptText,
  Ruler,
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Video, 
  Droplets, 
  Flame, 
  Compass,
  Search,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';

interface MapToolbarProps {
  selectedFloor: string;
  onSelectFloor: (floor: string) => void;
  viewEngine?: string;
  onToggleViewEngine?: (engine: any) => void;
  layers: {
    cctv: boolean;
    sensors: boolean;
    fireExit: boolean;
  };
  onToggleLayer: (layer: 'cctv' | 'sensors' | 'fireExit') => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  dutyView?: 'all' | 'sanitation' | 'security_fire' | 'finance';
  onSelectDutyView?: (duty: 'all' | 'sanitation' | 'security_fire' | 'finance') => void;
  selectedZone?: string | null;
  onSelectZone?: (zoneId: string | null) => void;
  lodState?: 'OVERVIEW' | 'ZONE_FOCUS' | 'STALL_SELECTED';
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  densityMode?: 'optimized' | 'standard';
  onToggleDensityMode?: () => void;
  activeFixtureKey?: 'A' | 'B' | 'C';
  onSelectFixture?: (fixture: 'A' | 'B' | 'C') => void;
  availableZones?: Array<{ key: string | null; label: string }>;
}

export default function MapToolbar({
  selectedFloor,
  onSelectFloor,
  viewEngine,
  onToggleViewEngine,
  layers,
  onToggleLayer,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isFullscreen = false,
  onToggleFullscreen,
  dutyView = 'all',
  onSelectDutyView,
  selectedZone = null,
  onSelectZone,
  lodState = 'OVERVIEW',
  searchQuery = '',
  onSearchChange,
  densityMode = 'optimized',
  onToggleDensityMode,
  activeFixtureKey = 'A',
  onSelectFixture,
  availableZones,
}: MapToolbarProps) {
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const layersMenuRef = useRef<HTMLDivElement>(null);

  // Click outside to close map layers dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (layersMenuRef.current && !layersMenuRef.current.contains(event.target as Node)) {
        setIsLayersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLayersCount = [
    layers.cctv,
    layers.sensors,
    layers.fireExit,
  ].filter(Boolean).length;
  const dutyOptions: Array<{
    key: 'all' | 'sanitation' | 'security_fire' | 'finance';
    label: string;
    Icon: typeof Eye;
  }> = [
    { key: 'all', label: 'Toàn cảnh', Icon: Eye },
    { key: 'sanitation', label: 'Ca Vệ Sinh', Icon: Droplets },
    { key: 'security_fire', label: 'Ca An Ninh/PCCC', Icon: ShieldAlert },
    { key: 'finance', label: 'Ca Thu Phí', Icon: ReceiptText },
  ];
  const lodLabel =
    lodState === 'OVERVIEW'
      ? 'Cấp 1: OVERVIEW'
      : lodState === 'ZONE_FOCUS'
        ? 'Cấp 2: ZONE_FOCUS'
        : 'Cấp 3: STALL_SELECTED';
  const DensityIcon = densityMode === 'optimized' ? Gauge : Ruler;

  return (
    <div 
      id="map-toolbar-simplified"
      data-testid="map-toolbar"
      className={`sticky top-0 z-30 max-w-full overflow-hidden bg-white/95 backdrop-blur-sm px-3 py-2 text-xs text-slate-700 font-sans select-none space-y-2 border-b border-slate-200 shadow-2xs ${
        isFullscreen ? 'rounded-none shadow-md' : 'rounded-t'
      }`}
    >
      {/* ========================================================================= */}
      {/* HÀNG 1: TẦNG, PHÂN KHU, TÌM KIẾM, 3D PHỤ VÀ MENU LỚP BẢN ĐỒ GỘP */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Nhóm Trái: Tầng & Phân khu */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 lg:flex-none lg:overflow-visible lg:pb-0">
          {/* Tầng */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-bold hidden sm:inline flex items-center gap-1 text-[11px]">
              <Compass className="w-3.5 h-3.5 text-[#076C31]" /> Tầng:
            </span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              {['1', '2', '3'].map((fl) => (
                <button
                  key={fl}
                  type="button"
                  onClick={() => onSelectFloor(fl)}
                  aria-pressed={selectedFloor === fl}
                  className={`min-h-11 min-w-11 rounded-md px-2.5 py-2 text-xs font-bold transition-colors font-mono cursor-pointer ${
                    selectedFloor === fl
                      ? 'bg-[#076C31] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white'
                  }`}
                >
                  T{fl}
                </button>
              ))}
            </div>
          </div>

          {/* Mặt Bằng / Fixture */}
          {onSelectFixture && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold hidden xl:inline text-[11px]">Mặt bằng:</span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                {[
                  { key: 'A', label: 'Chợ Đồng Xuân' },
                  { key: 'B', label: 'Chợ Bến Thành chữ L' },
                  { key: 'C', label: 'Chợ An Đông 2 Block' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => onSelectFixture(f.key as any)}
                    aria-pressed={activeFixtureKey === f.key}
                    className={`min-h-11 rounded-md px-2.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      activeFixtureKey === f.key
                        ? 'bg-[#076C31] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Phân khu */}
          {onSelectZone && (
            <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px]">
              {(availableZones || [
                { key: null, label: 'Toàn chợ' },
                { key: 'zone_A', label: 'Khu A' },
                { key: 'zone_B', label: 'Khu B' },
                { key: 'zone_C', label: 'Khu C' },
                { key: 'zone_D', label: 'Khu D' },
                { key: 'zone_E', label: 'Khu E' },
              ]).map((z) => (
                <button
                  key={z.key || 'all'}
                  type="button"
                  onClick={() => onSelectZone(z.key)}
                  aria-pressed={selectedZone === z.key}
                  className={`min-h-11 flex-none rounded-md px-2.5 py-2 font-bold transition-colors cursor-pointer ${
                    selectedZone === z.key
                      ? 'bg-[#076C31] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nhóm Giữa: Ô Tìm Kiếm Sơ Đồ */}
        <div className="relative order-3 min-w-full sm:order-none sm:block sm:min-w-[220px] sm:max-w-xs sm:flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Tìm mã sạp, ngành hàng, tên tiểu thương..."
            aria-label="Tìm trong sơ đồ chợ"
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-slate-400 focus:border-[#076C31] focus:bg-white focus:ring-1 focus:ring-[#076C31]"
          />
        </div>

        {/* Nhóm Phải: 3D Không Gian & Popover Lớp Bản Đồ */}
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
          {/* Nút 3D Không gian Phụ (Secondary action kín đáo) */}
          <button
            type="button"
            onClick={() => onToggleViewEngine?.(viewEngine === '3d_three' ? '2d_svg' : '3d_three')}
            className={`flex min-h-11 flex-none cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
              viewEngine === '3d_three'
                ? 'bg-[#076C31] text-white border-[#076C31] shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Bật/tắt mô hình 2.5D / 3D không gian Three.js"
          >
            <Box className={`w-3.5 h-3.5 ${viewEngine === '3d_three' ? 'text-white' : 'text-[#076C31]'}`} />
            <span>3D Không Gian</span>
          </button>

          {/* Menu Dropdown Gộp: LỚP BẢN ĐỒ (Map Layers) */}
          <div className="relative" ref={layersMenuRef}>
            <button
              type="button"
              onClick={() => setIsLayersOpen(!isLayersOpen)}
              aria-expanded={isLayersOpen}
              className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                isLayersOpen || activeLayersCount > 0
                  ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Bật/tắt các lớp hiển thị chuyên dụng trên bản đồ"
            >
              <Layers className="w-3.5 h-3.5 text-[#076C31]" />
              <span>Lớp bản đồ</span>
              <span className="bg-emerald-100 text-[#076C31] text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded">
                {activeLayersCount}/3
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Popover Menu Lớp Bản Đồ */}
            {isLayersOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 p-2 space-y-1 font-sans animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-100">
                  Lớp Bản Đồ Tác Chiến
                </div>

                <label className="flex min-h-11 cursor-pointer select-none items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold text-slate-800 text-xs">Camera CCTV</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={layers.cctv}
                    onChange={() => onToggleLayer('cctv')}
                    className="w-4 h-4 rounded text-[#076C31] focus:ring-0 cursor-pointer accent-[#076C31]"
                  />
                </label>

                <label className="flex min-h-11 cursor-pointer select-none items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-semibold text-slate-800 text-xs">Cảm biến ngập úng</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={layers.sensors}
                    onChange={() => onToggleLayer('sensors')}
                    className="w-4 h-4 rounded text-[#076C31] focus:ring-0 cursor-pointer accent-[#076C31]"
                  />
                </label>

                <label className="flex min-h-11 cursor-pointer select-none items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span className="font-semibold text-slate-800 text-xs">Trụ PCCC & Thoát hiểm</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={layers.fireExit}
                    onChange={() => onToggleLayer('fireExit')}
                    className="w-4 h-4 rounded text-[#076C31] focus:ring-0 cursor-pointer accent-[#076C31]"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HÀNG 2: CHẾ ĐỘ CA TRỰC, CHỈ BÁO CẤP LOD, ZOOM VÀ TOÀN MÀN HÌNH */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
        {/* Nhóm Trái: Chế độ nghiệp vụ / Ca trực & Chỉ báo LOD */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 lg:flex-none lg:overflow-visible lg:pb-0">
          {onSelectDutyView && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
              {dutyOptions.map((duty) => {
                const DutyIcon = duty.Icon;
                return (
                <button
                  key={duty.key}
                  type="button"
                  onClick={() => onSelectDutyView(duty.key)}
                  aria-pressed={dutyView === duty.key}
                  aria-label={`Chọn chế độ ca trực: ${duty.label}`}
                  className={`flex min-h-11 flex-none cursor-pointer items-center gap-1 rounded px-2.5 py-2 font-bold transition-colors ${
                    dutyView === duty.key
                      ? 'bg-white text-slate-950 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <DutyIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{duty.label}</span>
                </button>
                );
              })}
            </div>
          )}

          {/* LOD State Indicator */}
          <div className="hidden min-h-11 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-[11px] font-bold text-[#076C31] font-mono lg:flex">
            <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="h-2 w-2 rounded-full bg-[#076C31] motion-safe:animate-pulse" aria-hidden="true"></span>
            <span>{lodLabel}</span>
          </div>

          {/* Chế độ Mật độ Sạp Lớn Tác Chiến vs Sơ Đồ Cũ (Before / After Comparison) */}
          {onToggleDensityMode && (
            <button
              type="button"
              onClick={onToggleDensityMode}
              id="btn-toggle-density-mode"
              aria-label="Chuyển đổi mật độ sạp lớn tác chiến và sơ đồ cũ"
              aria-pressed={densityMode === 'optimized'}
              className={`flex min-h-11 flex-none cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors ${
                densityMode === 'optimized'
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title="Chuyển đổi giữa Chế độ Sạp Lớn Tác Chiến (+80% diện tích) và Sơ Đồ Cũ để đối chiếu Before/After"
            >
              <DensityIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{densityMode === 'optimized' ? 'Sạp Lớn (+80%)' : 'Sơ Đồ Cũ'}</span>
            </button>
          )}
        </div>

        {/* Nhóm Phải: Zoom Controls & Toàn Màn Hình */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onZoomOut}
              aria-label="Thu nhỏ sơ đồ"
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              title="Thu nhỏ sơ đồ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-bold text-slate-700 w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              aria-label="Phóng to sơ đồ"
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              title="Phóng to sơ đồ"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onResetZoom}
              aria-label="Căn giữa / Đặt lại góc nhìn"
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              title="Căn giữa / Đặt lại góc nhìn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200"></div>

          {/* Nút Toàn Màn Hình */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Thu nhỏ sơ đồ toàn màn hình' : 'Bung toàn màn hình'}
              className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold shadow-xs transition-colors ${
                isFullscreen
                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                  : 'bg-emerald-50 text-[#076C31] hover:bg-emerald-100 border border-emerald-300'
              }`}
              title={isFullscreen ? 'Thu nhỏ sơ đồ (Phím ESC)' : 'Bung toàn màn hình (Phím F)'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="font-semibold">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
