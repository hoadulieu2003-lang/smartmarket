'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import UrgentActionCards from '@/components/UrgentActionCards';
import InlineOverviewBar from '@/components/InlineOverviewBar';
import MapToolbar from '@/components/MapToolbar';
import StallDetailDrawer from '@/components/StallDetailDrawer';
import ThreeSpatialRenderer from '@/components/ThreeSpatialRenderer';
import PendingProfilesView from '@/components/PendingProfilesView';
import MarketFeeCollectionSection from '@/components/MarketFeeCollectionSection';
import InMapQuickActionCard from '@/components/InMapQuickActionCard';

import {
  FIXTURE_A_DONG_XUAN,
  FIXTURE_B_L_SHAPED_MARKET,
  FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET,
  MEGA_FLOOR_DONG_XUAN_STANDARD,
  type MapDensityMode,
} from '@/spatial/fixtures';
import { SvgSpatialRenderer } from '@/spatial/renderer/SvgSpatialRenderer';
import { StallGlyph } from '@/spatial/renderer/StallGlyph';
import type { StallEntity, MapLodState } from '@/spatial/model/types';
import { deriveStallVisual } from '@/spatial/presentation/stallVisualAdapter';
import { URGENT_ACTIONS, STALLS_DATA, AREA_ALERTS_DATA } from '@/data/mockMarketData';

import {
  Building2,
  ShieldAlert,
  Clock,
  CheckCircle2,
  X,
  Layers,
  Phone,
  User,
  Store,
  MapPin,
  AlertTriangle,
  Compass
} from 'lucide-react';

export default function SmartMarketHome() {
  // Navigation & Shell
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [currentView, setCurrentView] = useState<'market_map' | 'pending_profiles'>('market_map');
  const [selectedFloor, setSelectedFloor] = useState('1');
  const [viewEngine, setViewEngine] = useState<'2d_svg' | '3d_three'>('2d_svg');
  const [activeFixtureKey, setActiveFixtureKey] = useState<'A' | 'B' | 'C'>('A');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Layers & Zoom
  const [layers, setLayers] = useState({ cctv: true, sensors: true, fireExit: false });
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Inspector Selection
  const [selectedStall, setSelectedStall] = useState<StallEntity | null>(null);

  // Fullscreen Spatial Canvas Mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Duty Views (Góc nhìn theo ca trực)
  const [dutyView, setDutyView] = useState<'all' | 'sanitation' | 'security_fire' | 'finance'>('all');

  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<'all' | 'p0' | 'warning' | 'maintenance' | 'empty'>('all');

  // Map Level of Detail State (Work Package A & D)
  const lodState: MapLodState = useMemo(() => {
    if (selectedStall) return 'STALL_SELECTED';
    if (selectedZone) return 'ZONE_FOCUS';
    return 'OVERVIEW';
  }, [selectedStall, selectedZone]);

  const handleSelectZone = (zoneId: string | null) => {
    setSelectedZone(zoneId);
    setZoneFilter('all');
    if (zoneId) {
      setZoomLevel(1.25);
    } else {
      setZoomLevel(1.0);
    }
  };

  // Bi-directional sync: Chọn sạp từ danh sách sự cố trên đầu (Work Package D)
  const handleSelectStallCode = (code: string) => {
    const stall = currentFloor.stalls.find((s) => s.code === code);
    if (stall) {
      handleSelectZone(stall.zoneId);
      handleSelectStall(stall);
    }
  };

  // In-Map Quick Dispatch Engine
  const [dispatchedStalls, setDispatchedStalls] = useState<Record<string, { teamName: string; status: string }>>({});
  const [quickActionStall, setQuickActionStall] = useState<StallEntity | null>(null);
  const [quickActionPos, setQuickActionPos] = useState<{ x: number; y: number } | null>(null);
  const [dispatchToast, setDispatchToast] = useState<string | null>(null);

  const handleQuickDispatch = (stallId: string, teamName: string) => {
    setDispatchedStalls((prev) => ({
      ...prev,
      [stallId]: { teamName, status: 'in_progress' }
    }));
    setDispatchToast(`✓ Đã điều phối thành công ${teamName} đến xử lý sự cố!`);
    setTimeout(() => setDispatchToast(null), 4500);
    setQuickActionStall(null);
  };

  // Keyboard shortcut: F to toggle Fullscreen, ESC to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'f' || e.key === 'F') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        setIsFullscreen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Map Density Mode State ('optimized' = Sạp Lớn Tác Chiến vs 'standard' = Sơ Đồ Cũ)
  const [densityMode, setDensityMode] = useState<MapDensityMode>('optimized');

  // Select current floor data from fixtures with real-time dispatch updates
  const currentFloor = useMemo(() => {
    const rawFloor = (() => {
      switch (activeFixtureKey) {
        case 'B':
          return FIXTURE_B_L_SHAPED_MARKET;
        case 'C':
          return FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET;
        case 'A':
        default:
          return densityMode === 'optimized' ? FIXTURE_A_DONG_XUAN : MEGA_FLOOR_DONG_XUAN_STANDARD;
      }
    })();

    if (Object.keys(dispatchedStalls).length === 0) return rawFloor;

    return {
      ...rawFloor,
      stalls: rawFloor.stalls.map((s) => {
        const dispatch = dispatchedStalls[s.id];
        if (!dispatch) return s;

        const taskInfo = (s.state as any)?.taskInfo || {};
        return {
          ...s,
          state: {
            ...s.state,
            taskInfo: {
              ...taskInfo,
              dispatchStatus: 'in_progress',
              assignedTeam: dispatch.teamName,
            }
          }
        };
      })
    };
  }, [activeFixtureKey, dispatchedStalls, densityMode]);

  // Compute counts for quick filter bar
  const counts = useMemo(() => {
    const all = currentFloor.stalls.length;
    let complaint = 0, expiring = 0, maintenance = 0, empty = 0;

    currentFloor.stalls.forEach((s) => {
      if (s.state.complaintsCount > 0) complaint++;
      if (s.state.contractDaysLeft <= 30 && s.state.contractDaysLeft > 0) expiring++;
      if (s.state.isUnderMaintenance) maintenance++;
      if (!s.state.isOccupied) empty++;
    });

    return { all, complaint, expiring, maintenance, empty };
  }, [currentFloor]);

  // Stalls belonging to selectedZone (Màn 2 Chi tiết khu)
  const zoneStalls = useMemo(() => {
    if (!selectedZone) return [];
    return currentFloor.stalls.filter(
      (s) => s.zoneId === selectedZone || s.code.startsWith(selectedZone.replace('zone_', ''))
    );
  }, [currentFloor, selectedZone]);

  // Filtered stalls based on search & quick filters
  const filteredStalls = useMemo(() => {
    return currentFloor.stalls.filter((stall) => {
      // Zone Drill-down Filtering (Màn 2: Chi tiết khu)
      if (selectedZone) {
        const inZone = stall.zoneId === selectedZone || stall.code.startsWith(selectedZone.replace('zone_', ''));
        if (!inZone) return false;

        if (zoneFilter === 'p0' && stall.state.complaintsCount <= 0) return false;
        if (zoneFilter === 'warning' && !(stall.state.contractDaysLeft <= 30 || stall.state.feeStatus === 'overdue')) return false;
        if (zoneFilter === 'maintenance' && !stall.state.isUnderMaintenance) return false;
        if (zoneFilter === 'empty' && stall.state.isOccupied) return false;
      }

      // 0. Duty View Filter
      if (dutyView === 'sanitation') {
        const hasWater = stall.code === 'A12' || (stall.state.issues && stall.state.issues.some((i: any) => i.title?.includes('Nước') || i.specificType === 'water'));
        if (!hasWater) return false;
      } else if (dutyView === 'security_fire') {
        const hasSecurity = stall.code === 'E08' || stall.code === 'B14' || (stall.state.issues && stall.state.issues.some((i: any) => i.title?.includes('gas') || i.title?.includes('Lấn chiếm') || i.specificType === 'fire_safety' || i.specificType === 'encroachment'));
        if (!hasSecurity) return false;
      } else if (dutyView === 'finance') {
        const hasFinance = stall.code === 'C08' || stall.code === 'B03' || (stall.state.contractDaysLeft <= 30 && stall.state.contractDaysLeft > 0) || stall.state.feeStatus === 'overdue';
        if (!hasFinance) return false;
      }

      // 1. Quick Status Filter
      if (activeFilter === 'complaint' && stall.state.complaintsCount <= 0) return false;
      if (activeFilter === 'expiring' && !(stall.state.contractDaysLeft <= 30 && stall.state.contractDaysLeft > 0)) return false;
      if (activeFilter === 'maintenance' && !stall.state.isUnderMaintenance) return false;
      if (activeFilter === 'empty' && stall.state.isOccupied) return false;

      // 2. Category Filter
      if (selectedCategory !== 'all' && stall.metadata?.category !== selectedCategory) return false;

      // 3. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = stall.code.toLowerCase().includes(q);
        const matchName = (stall.metadata?.name || '').toLowerCase().includes(q);
        const matchMerchant = (stall.metadata?.merchantName || '').toLowerCase().includes(q);
        const matchCategory = (stall.metadata?.category || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchMerchant && !matchCategory) return false;
      }

      return true;
    });
  }, [currentFloor, activeFilter, selectedCategory, searchQuery, dutyView, selectedZone, zoneFilter]);

  const handleSelectStall = (stall: StallEntity) => {
    setSelectedStall(stall);
    const hasIssue = stall.state.complaintsCount > 0 || (stall.state.issues && stall.state.issues.length > 0);
    if (hasIssue) {
      const pos = (stall as any)._clientPos;
      const clientX = pos?.x || (typeof window !== 'undefined' ? window.innerWidth / 2 : 500);
      const clientY = pos?.y || (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);
      setQuickActionPos({ x: clientX, y: clientY });
      setQuickActionStall(stall);
    } else {
      setQuickActionStall(null);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedStall(null);
  };

  const handleToggleLayer = (layer: 'cctv' | 'sensors' | 'fireExit') => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.15, 2.0));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.15, 0.6));
  const handleResetZoom = () => setZoomLevel(1.0);

  const scrollToFees = () => {
    setTimeout(() => {
      const el = document.getElementById('market-fees-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
    window.setTimeout(() => {
      mobileMenuButtonRef.current?.focus();
    }, 0);
  };

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-slate-50/70 font-sans text-slate-900">
      <a
        href="#main-content"
        className="sr-only fixed left-3 top-3 z-[70] rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-lg ring-2 ring-[var(--color-focus-ring)] focus:not-sr-only"
      >
        Skip to main content
      </a>

      {/* 1. Shell Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v as any)}
        onScrollToFees={scrollToFees}
        onFilterComplaints={() => {
          if (currentView !== 'market_map') setCurrentView('market_map');
          setActiveFilter('complaint');
        }}
      />

      {/* Main Operational Stage */}
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">

        {/* 2. Shell Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          urgentCount={URGENT_ACTIONS.complaints.total}
          isMobileMenuOpen={isMobileSidebarOpen}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((open) => !open)}
          mobileMenuButtonRef={mobileMenuButtonRef}
        />

        {/* 3. Main Workspace Container */}
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 focus:outline-none sm:p-4">

          {/* VIEW A: HỒ SƠ TIỂU THƯƠNG */}
          {currentView === 'pending_profiles' ? (
            <PendingProfilesView onBackToMap={() => setCurrentView('market_map')} />
          ) : (
            /* VIEW B: MẶT BẰNG ĐIỀU HÀNH & TÁC CHIẾN CHỢ */
            <>
              {/* Continuous 4-Level Priority Strip */}
              <UrgentActionCards
                urgentData={URGENT_ACTIONS}
                onSelectFilter={(f) => setActiveFilter(f)}
                onNavigateToProfiles={() => setCurrentView('pending_profiles')}
                onSelectStallCode={handleSelectStallCode}
              />

              {/* Quick Operational 1-Touch Filter Bar */}
              <InlineOverviewBar
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                counts={counts}
              />

              {/* ========================================================================= */}
              {/* KHU VỰC SƠ ĐỒ KHÔNG GIAN (2D SVG vs 2.5D/3D THREE.JS) */}
              {/* ========================================================================= */}
              {/* ========================================================================= */}
              {/* KHU VỰC SƠ ĐỒ KHÔNG GIAN (2D SVG vs 2.5D/3D THREE.JS) */}
              {/* ========================================================================= */}
              <section
                id="market-map-section"
                className={`bg-white transition-all duration-200 overflow-hidden ${
                  isFullscreen
                    ? 'fixed inset-0 z-50 w-screen h-screen flex flex-col bg-slate-50 border-none rounded-none shadow-2xl m-0 p-0'
                    : 'border border-slate-300 rounded shadow-xs w-full'
                }`}
              >

                {/* Map Control Toolbar */}
                <MapToolbar
                  selectedFloor={selectedFloor}
                  onSelectFloor={setSelectedFloor}
                  viewEngine={viewEngine}
                  onToggleViewEngine={setViewEngine}
                  layers={layers}
                  onToggleLayer={handleToggleLayer as any}
                  zoomLevel={zoomLevel}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onResetZoom={handleResetZoom}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                  dutyView={dutyView}
                  onSelectDutyView={setDutyView}
                  selectedZone={selectedZone}
                  onSelectZone={handleSelectZone}
                  lodState={lodState}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  densityMode={densityMode}
                  onToggleDensityMode={() => setDensityMode((prev) => prev === 'optimized' ? 'standard' : 'optimized')}
                />

                {/* MÀN 2: THANH ĐIỀU HƯỚNG BREADCRUMB & BỘ LỌC RIÊNG TRONG KHU */}
                {selectedZone && (
                  <div className="bg-emerald-50/95 border-b border-emerald-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-sans shadow-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectZone(null)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-[#076C31] font-bold rounded-lg border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs text-xs"
                      >
                        ← Quay lại Toàn chợ
                      </button>
                      <span className="text-emerald-400 font-bold">/</span>
                      <span className="font-extrabold text-slate-900 uppercase font-mono tracking-wide">
                        BẢN ĐỒ CHI TIẾT: {currentFloor.zones?.find((z) => z.id === selectedZone)?.name || selectedZone}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#076C31] text-white font-mono">
                        {zoneStalls.length} sạp
                      </span>
                    </div>

                    {/* Bộ lọc riêng trong phân khu */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-slate-500 font-bold hidden md:inline mr-1">Lọc trong khu:</span>
                      {[
                        { key: 'all', label: `● Tất cả (${zoneStalls.length})` },
                        { key: 'p0', label: `🔴 Khẩn cấp (${zoneStalls.filter((s) => s.state.complaintsCount > 0).length})` },
                        { key: 'warning', label: `🟠 Cần chú ý (${zoneStalls.filter((s) => s.state.contractDaysLeft <= 30 || s.state.feeStatus === 'overdue').length})` },
                        { key: 'maintenance', label: `🟡 Bảo trì (${zoneStalls.filter((s) => s.state.isUnderMaintenance).length})` },
                        { key: 'empty', label: `⚪ Sạp trống (${zoneStalls.filter((s) => !s.state.isOccupied).length})` },
                      ].map((flt) => (
                        <button
                          key={flt.key}
                          onClick={() => setZoneFilter(flt.key as any)}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                            zoneFilter === flt.key
                              ? 'bg-[#076C31] text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {flt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Real-time In-Map Dispatch Notification Toast */}
                {dispatchToast && (
                  <div className="bg-emerald-700 text-white px-4 py-2 font-sans font-bold text-xs flex items-center justify-between shadow-md transition-all">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
                      <span>{dispatchToast}</span>
                    </div>
                    <button
                      onClick={() => setDispatchToast(null)}
                      className="text-emerald-200 hover:text-white cursor-pointer ml-4 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Fixture Selector (Sub-toolbar) */}
                <div className="bg-slate-50 px-3.5 py-1.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Mặt bằng đối chiếu:</span>
                    <div className="inline-flex rounded bg-white p-0.5 border border-slate-300 text-xs">
                      {[
                        { key: 'A', label: 'Chợ Đồng Xuân (160 sạp)' },
                        { key: 'B', label: 'Chợ Bến Thành chữ L' },
                        { key: 'C', label: 'Chợ An Đông 2 Block' },
                      ].map((fix) => (
                        <button
                          key={fix.key}
                          onClick={() => setActiveFixtureKey(fix.key as any)}
                          className={`px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                            activeFixtureKey === fix.key
                              ? 'bg-[#076C31] text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {fix.label}
                        </button>
                      ))}
                    </div>

                    {/* Phase 4 Operational Priority Legend */}
                    <div className="hidden xl:flex items-center gap-2 px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-sans">
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Ưu tiên:</span>
                      <span className="flex items-center gap-1 font-bold text-rose-700">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                        <span>● P0 Khẩn cấp</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 font-bold text-amber-800">
                        <span>▲</span>
                        <span>Chú ý</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 font-bold text-yellow-800">
                        <span>🔧</span>
                        <span>Bảo trì</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <span className="w-2 h-2 rounded-xs border border-slate-300 bg-white"></span>
                        <span>Bình thường</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-[11px] text-slate-500 font-mono">
                      Hiển thị: <strong className="text-slate-900">{filteredStalls.length}</strong> / {currentFloor.stalls.length} sạp
                    </div>
                    {isFullscreen && (
                      <button
                        onClick={() => setIsFullscreen(false)}
                        className="px-2.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        ✕ Thoát toàn màn hình (ESC)
                      </button>
                    )}
                  </div>
                </div>

                {/* VIEW ENGINE 1: 2D VECTOR BLUEPRINT SVG */}
                {viewEngine === '2d_svg' ? (
                  <div className={`relative p-0 bg-slate-50 border-t border-slate-200 overflow-hidden flex items-center justify-center ${
                    isFullscreen ? 'flex-1 w-full h-full min-h-0' : 'w-full min-h-[680px] h-[calc(100vh-290px)]'
                  }`}>
                    <div
                      className="transition-transform duration-200 origin-center w-full h-full flex items-center justify-center"
                      style={{ transform: `scale(${zoomLevel})` }}
                    >
                      <SvgSpatialRenderer
                        floor={currentFloor}
                        highlightedEntityIds={new Set(filteredStalls.map((s) => s.id))}
                        selectedEntityId={selectedStall?.id}
                        zoomLevel={zoomLevel}
                        selectedZone={selectedZone}
                        operationalFilter={activeFilter === 'complaint' || zoneFilter === 'p0' ? 'p0' : 'all'}
                        className="w-full h-full rounded-none"
                        onSelectZone={handleSelectZone}
                        onSelectEntity={(entity) => {
                          if (entity && 'code' in entity) {
                            handleSelectStall(entity);
                          }
                        }}
                      />
                    </div>

                    {/* In-Map Quick Action Popover (Tác chiến 1-chạm không rời bản đồ) */}
                    {quickActionStall && (
                      <InMapQuickActionCard
                        stall={quickActionStall}
                        onClose={() => setQuickActionStall(null)}
                        onOpenDrawer={(s) => {
                          setSelectedStall(s);
                          setQuickActionStall(null);
                        }}
                        onQuickDispatch={handleQuickDispatch}
                        position={quickActionPos || undefined}
                      />
                    )}
                  </div>
                ) : (
                  /* VIEW ENGINE 2: 2.5D / 3D SPATIAL THREE.JS ENGINE */
                  <div className="relative w-full h-full">
                    <ThreeSpatialRenderer
                      stalls={currentFloor.stalls}
                      selectedStall={selectedStall}
                      onSelectStall={handleSelectStall}
                      zoomLevel={zoomLevel}
                      className={isFullscreen ? 'flex-1 w-full h-full min-h-0' : 'h-[640px]'}
                    />

                    {quickActionStall && (
                      <InMapQuickActionCard
                        stall={quickActionStall}
                        onClose={() => setQuickActionStall(null)}
                        onOpenDrawer={(s) => {
                          setSelectedStall(s);
                          setQuickActionStall(null);
                        }}
                        onQuickDispatch={handleQuickDispatch}
                        position={quickActionPos || undefined}
                      />
                    )}
                  </div>
                )}
              </section>

              {/* ========================================================================= */}
              {/* BẢNG THU PHÍ QUẢN LÝ DỊCH VỤ THỊ TRƯỜNG */}
              {/* ========================================================================= */}
              <MarketFeeCollectionSection />
            </>
          )}

        </main>
      </div>

      {/* 4. Slide-over Inspector Side Panel (Phase 5 Decision Panel) */}
      <StallDetailDrawer
        stall={selectedStall}
        onClose={handleCloseDrawer}
        onQuickDispatch={(s, team) => handleQuickDispatch(s.id, team)}
        onExtendContract={(s) => {
          setDispatchToast(`✓ Đã gửi thông báo gia hạn hợp đồng tới chủ sạp ${s.code}`);
          setTimeout(() => setDispatchToast(null), 4500);
        }}
        onCollectFee={(s) => {
          setDispatchToast(`✓ Đã ghi nhận thu phí dịch vụ sạp ${s.code} thành công`);
          setTimeout(() => setDispatchToast(null), 4500);
        }}
        onViewComplaints={(s) => {
          setDispatchToast(`✓ Đang mở hồ sơ bằng chứng hiện trường sạp ${s.code}`);
          setTimeout(() => setDispatchToast(null), 4500);
        }}
      />

    </div>
  );
}
