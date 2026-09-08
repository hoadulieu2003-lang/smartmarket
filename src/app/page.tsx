'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MapToolbar from '@/components/MapToolbar';
import StallDetailDrawer from '@/components/StallDetailDrawer';
import PendingProfilesView from '@/components/PendingProfilesView';
import LiveDashboardOverview from '@/components/LiveDashboardOverview';
import InMapQuickActionCard from '@/components/InMapQuickActionCard';

import {
  FIXTURE_A_DONG_XUAN,
  FIXTURE_B_L_SHAPED_MARKET,
  FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET,
  MEGA_FLOOR_DONG_XUAN_STANDARD,
  REALISTIC_FLOOR_DATA,
  type MapDensityMode,
} from '@/spatial/fixtures';
import { SvgSpatialRenderer } from '@/spatial/renderer/SvgSpatialRenderer';
import { RealisticSpatialRenderer } from '@/spatial/renderer/RealisticSpatialRenderer';
import ThreeSpatialRenderer from '@/components/ThreeSpatialRenderer';
import { StallGlyph } from '@/spatial/renderer/StallGlyph';
import type { StallEntity, MapLodState } from '@/spatial/model/types';
import { deriveStallVisual } from '@/spatial/presentation/stallVisualAdapter';
import { isStallMatchingDuty } from '@/types/stallVisual';
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
  Users,
  Store,
  MapPin,
  AlertTriangle,
  Compass,
  Wrench,
  Navigation,
  ArrowDown,
  ArrowUp,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Star,
  QrCode,
  Receipt
} from 'lucide-react';

const LIVE_URGENT_ACTIONS = {
  complaints: {
    total: 15,
    critical: 15,
    items: [
      {
        id: 'c1',
        stallId: 'D900-06',
        title: 'Gian hàng gia vị: Nhân viên phục vụ chưa hướng dẫn rõ cho khách (PAKN #075)',
        severity: 'critical' as const,
        time: '15 phút trước',
        reporter: 'Phạm Khánh Linh'
      },
      {
        id: 'c2',
        stallId: 'D900-03',
        title: 'Thực phẩm tươi: Phản ánh mùi hôi khu vực sạp D900-03',
        severity: 'critical' as const,
        time: '30 phút trước',
        reporter: 'Nguyễn Văn Minh'
      },
      {
        id: 'c3',
        stallId: 'A-02',
        title: 'Khu A Rau củ: Nước tràn lối đi trước sạp A-02',
        severity: 'critical' as const,
        time: '45 phút trước',
        reporter: 'Ban Kiểm Tra'
      },
      {
        id: 'c4',
        stallId: 'D260802V1-S10',
        title: 'Thực phẩm tươi: Sắp xếp hàng hóa lấn chiếm lối đi chung',
        severity: 'critical' as const,
        time: '1 giờ trước',
        reporter: 'Tổ Trật Tự'
      }
    ]
  },
  areaAlerts: {
    total: 3,
    critical: 1,
    locations: [
      { id: 'al_1', name: 'Cổng Bắc Phố Hàng Khoai', count: 4, detail: 'Khu vực bốc dỡ hàng tập trung đông giờ cao điểm', status: 'urgent' as const },
      { id: 'al_2', name: 'Khu gom rác Khu A', count: 2, detail: 'Cần vệ sinh định kỳ ca sáng', status: 'warning' as const },
      { id: 'al_3', name: 'Lối đi Phân khu 1 - 2', count: 1, detail: 'Nước đọng sau ca rửa sàn', status: 'warning' as const },
    ]
  },
  expiringContracts: {
    totalUnder30: 5,
    criticalUnder7: 2,
    items: [
      { stallId: 'D903-03', merchant: 'Tiểu thương D903-03', business: 'Thiết yếu 4', daysLeft: 5, expiryDate: '10/09/2026' },
      { stallId: 'D902-05', merchant: 'Tiểu thương D902-05', business: 'Đặc sản 3', daysLeft: 6, expiryDate: '11/09/2026' },
    ]
  },
  pendingProfiles: {
    totalPending: 5,
    overdue: 1,
    items: [
      { id: 'p1', stallId: 'A-01', applicant: 'Hộ KD Nguyễn Văn A', type: 'Đăng ký thuê mới', submitted: '01/09/2026', status: 'overdue' as const },
      { id: 'p2', stallId: 'D901-04', applicant: 'Hộ KD Trần Thị B', type: 'Gia hạn hợp đồng', submitted: '03/09/2026', status: 'pending' as const },
    ]
  }
};

export default function SmartMarketHome() {
  // Navigation & Shell
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'market_map' | 'pending_profiles'>('overview');
  const [selectedFloor, setSelectedFloor] = useState('1');
  const [viewEngine, setViewEngine] = useState<'2d_svg' | '3d_three'>('2d_svg');
  const [activeFixtureKey, setActiveFixtureKey] = useState<'A' | 'B' | 'C'>('A');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const f = params.get('fixture');
      if (f === 'A' || f === 'B' || f === 'C') {
        setActiveFixtureKey(f as any);
      }
    }
  }, []);

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

  const availableZones = useMemo(() => {
    return [
      { key: null, label: 'Toàn chợ' },
      { key: 'zone_A', label: 'Khu A' },
      { key: 'zone_B', label: 'Khu B' },
      { key: 'zone_C', label: 'Khu C' },
      { key: 'zone_D', label: 'Khu D' },
      { key: 'zone_E', label: 'Khu E' },
    ];
  }, []);

  // Bi-directional sync: Chọn sạp từ danh sách sự cố trên đầu & Dashboard Overview
  const handleSelectStallCode = (code: string) => {
    // 1. Khớp mã trực tiếp (Exact match)
    let stall = currentFloor.stalls.find((s) => s.code === code || s.id === code);

    // 2. Chuẩn hoá mã sạp thực tế (Normalize live CMS stall codes)
    if (!stall) {
      const clean = code.trim().toUpperCase();
      let targetCode = clean;

      if (clean.startsWith('A-')) {
        targetCode = clean.replace('A-', 'A'); // A-01 -> A01
      } else if (clean.startsWith('D900-')) {
        targetCode = clean.replace('D900-', 'B'); // D900-06 -> B06
      } else if (clean.startsWith('D04-')) {
        targetCode = clean.replace('D04-', 'D'); // D04-03 -> D03
      } else if (clean.includes('S10')) {
        targetCode = 'B10';
      }

      stall = currentFloor.stalls.find((s) => s.code === targetCode || s.id === targetCode);

      // 3. Khớp dự phòng theo số sạp (Fallback numeric match)
      if (!stall) {
        const numMatch = clean.match(/\d+/);
        if (numMatch) {
          const num = numMatch[0].padStart(2, '0');
          stall = currentFloor.stalls.find(
            (s) => s.code.endsWith(num) || s.code === `A${num}` || s.code === `B${num}` || s.code === `D${num}`
          );
        }
      }
    }

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
    setDispatchToast(`Đã điều phối thành công ${teamName} đến xử lý sự cố!`);
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

  // Select current floor data with real-time dispatch updates
  const currentFloor = useMemo(() => {
    const rawFloor = (() => {
      switch (activeFixtureKey) {
        case 'B':
          return FIXTURE_B_L_SHAPED_MARKET;
        case 'C':
          return FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET;
        case 'A':
        default:
          if (viewEngine === '2d_svg') {
            return densityMode === 'optimized' ? FIXTURE_A_DONG_XUAN : MEGA_FLOOR_DONG_XUAN_STANDARD;
          }
          return REALISTIC_FLOOR_DATA;
      }
    })();

    return {
      ...rawFloor,
      stalls: rawFloor.stalls.map((s) => {
        const dispatch = dispatchedStalls[s.id];
        let stallObj = s;

        // Canonical stall A12 enrichment: preserve merchant Lê Thu Hương, name, SLA & issue data
        if (s.code === 'A12') {
          stallObj = {
            ...s,
            metadata: {
              ...s.metadata,
              name: 'Thực phẩm tươi A12',
              merchantName: 'Lê Thu Hương',
            },
            state: {
              ...s.state,
              complaintsCount: 3,
              slaMinutesRemaining: 12,
              hasActiveIssues: true,
              hasCriticalComplaint: true,
              issues: [
                {
                  id: 'iss_a12_1',
                  type: 'complaint',
                  priority: 'P0',
                  severity: 'critical',
                  title: 'Tràn nước xả hải sản ra lối đi chung',
                  description: 'Khách bộ hành phản ánh nước tràn gây trơn trượt nguy hiểm.',
                  reportedAt: '10:45 • Hôm nay',
                  source: 'app_citizen',
                  slaMinutesRemaining: 12,
                  status: 'open',
                  specificType: 'water',
                } as any
              ]
            } as any
          };
        }

        if (!dispatch) return stallObj;

        const taskInfo = (stallObj.state as any)?.taskInfo || {};
        return {
          ...stallObj,
          state: {
            ...stallObj.state,
            taskInfo: {
              ...taskInfo,
              dispatchStatus: 'in_progress',
              assignedTeam: dispatch.teamName,
            }
          }
        };
      })
    };
  }, [activeFixtureKey, viewEngine, densityMode, dispatchedStalls]);

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
      if (dutyView !== 'all' && !isStallMatchingDuty(stall, dutyView)) {
        return false;
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
          urgentCount={LIVE_URGENT_ACTIONS.complaints.total}
          isMobileMenuOpen={isMobileSidebarOpen}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((open) => !open)}
          mobileMenuButtonRef={mobileMenuButtonRef}
        />

        {/* 3. Main Workspace Container */}
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 focus:outline-none sm:p-4">

          {/* VIEW A: HỒ SƠ TIỂU THƯƠNG */}
          {currentView === 'pending_profiles' ? (
            <PendingProfilesView onBackToMap={() => setCurrentView('market_map')} />
          ) : currentView === 'overview' ? (
            /* VIEW C: TỔNG QUAN VẬN HÀNH (ĐỒNG BỘ 100% GIAO DIỆN LIVE CMS QL.CHOTHONGMINH.TOP) */
            <LiveDashboardOverview
              onNavigateToMap={(code?: string) => {
                setCurrentView('market_map');
                if (code) {
                  setTimeout(() => handleSelectStallCode(code), 150);
                }
              }}
              onNavigateToProfiles={() => setCurrentView('pending_profiles')}
              dispatchedStalls={dispatchedStalls}
              onQuickDispatch={handleQuickDispatch}
            />
          ) : (
            /* VIEW B: MẶT BẰNG ĐIỀU HÀNH & TÁC CHIẾN CHỢ (IMMERSIVE SPATIAL MAP) */
            <div className="w-full flex-1 flex flex-col min-h-0">
              <section
                id="market-map-section"
                className={`bg-white transition-all duration-200 overflow-hidden flex flex-col ${
                  isFullscreen
                    ? 'fixed inset-0 z-50 w-screen h-screen flex flex-col bg-slate-50 border-none rounded-none shadow-2xl m-0 p-0'
                    : 'border border-slate-200 rounded-xl shadow-xs w-full flex-1 h-[calc(100vh-4.25rem)] min-h-[640px]'
                }`}
              >
                {/* Map Control Toolbar */}
                <MapToolbar
                  selectedFloor={selectedFloor}
                  onSelectFloor={setSelectedFloor}
                  viewEngine={viewEngine}
                  onToggleViewEngine={(engine: any) => setViewEngine(engine)}
                  layers={layers}
                  onToggleLayer={handleToggleLayer}
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
                  activeFixtureKey={activeFixtureKey}
                  onSelectFixture={(f) => {
                    setActiveFixtureKey(f);
                    setSelectedZone(null);
                    setSelectedStall(null);
                  }}
                  availableZones={availableZones}
                />

                {/* THANH ĐIỀU HƯỚNG BREADCRUMB & BỘ LỌC RIÊNG TRONG KHU */}
                {selectedZone && (
                  <div className="bg-emerald-50/95 border-b border-emerald-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-sans shadow-xs shrink-0">
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
                      {([
                        { key: 'all', label: `Tất cả (${zoneStalls.length})`, marker: 'bg-slate-300' },
                        { key: 'p0', label: `Khẩn cấp (${zoneStalls.filter((s) => s.state.complaintsCount > 0).length})`, marker: 'bg-rose-600' },
                        { key: 'warning', label: `Cần chú ý (${zoneStalls.filter((s) => s.state.contractDaysLeft <= 30 || s.state.feeStatus === 'overdue').length})`, marker: 'bg-amber-500' },
                        { key: 'maintenance', label: `Bảo trì (${zoneStalls.filter((s) => s.state.isUnderMaintenance).length})`, marker: 'bg-yellow-400' },
                        { key: 'empty', label: `Sạp trống (${zoneStalls.filter((s) => !s.state.isOccupied).length})`, marker: 'border border-slate-300 bg-white' },
                      ] as const).map((flt) => (
                        <button
                          key={flt.key}
                          type="button"
                          onClick={() => setZoneFilter(flt.key)}
                          aria-pressed={zoneFilter === flt.key}
                          className={`flex min-h-11 items-center gap-1.5 rounded-md px-2.5 py-2 font-bold transition-colors cursor-pointer ${
                            zoneFilter === flt.key
                              ? 'bg-[#076C31] text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${flt.marker}`} aria-hidden="true"></span>
                          <span>{flt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Real-time In-Map Dispatch Notification Toast */}
                {dispatchToast && (
                  <div className="bg-emerald-700 text-white px-4 py-2 font-sans font-bold text-xs flex items-center justify-between shadow-md transition-all shrink-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-100" aria-hidden="true" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 motion-safe:animate-ping" aria-hidden="true" />
                      <span>{dispatchToast}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDispatchToast(null)}
                      className="ml-4 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded text-emerald-200 font-bold hover:bg-emerald-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label="Đóng thông báo điều phối"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {/* VIEW ENGINE: 2D VECTOR BLUEPRINT SVG / 3D SPATIAL THREE.JS */}
                <div
                  data-testid="map-canvas"
                  className={`map-canvas relative p-0 bg-slate-50 overflow-hidden flex items-center justify-center ${
                    isFullscreen
                      ? 'flex-1 w-full h-full min-h-0'
                      : 'w-full flex-1 min-h-[560px] sm:min-h-[600px] lg:min-h-[620px]'
                  }`}
                >
                  {/* CỔNG BẮC ARCHITECTURAL RIBBON (Mép trên Canvas) */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                    <div className="bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] font-bold shadow-md border border-slate-700/50 flex items-center gap-2 uppercase tracking-wide">
                      <ArrowDown className="w-3 h-3 text-emerald-400 motion-safe:animate-bounce" />
                      <span>CỔNG BẮC • PHỐ HÀNG KHOAI • XUẤT NHẬP HÀNG</span>
                    </div>
                  </div>

                  {/* CAD COMPASS ROSE INDICATOR (Góc trên bên phải Canvas) */}
                  <div className="absolute top-3 right-3 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-xs text-slate-700 text-[11px] font-mono font-bold pointer-events-none">
                    <Compass className="w-3.5 h-3.5 text-[#076C31]" />
                    <span>BẮC (N)</span>
                  </div>

                  {/* CỔNG NAM ARCHITECTURAL RIBBON & CỤM TIỆN ÍCH (Mép dưới Canvas) */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col sm:flex-row items-center gap-2 pointer-events-none">
                    <div className="bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] font-bold shadow-md border border-slate-700/50 flex items-center gap-2 uppercase tracking-wide">
                      <ArrowUp className="w-3 h-3 text-emerald-400 motion-safe:animate-bounce" />
                      <span>CỔNG NAM • PHỐ ĐỒNG XUÂN • CỔNG CHÍNH</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-semibold text-slate-700 border border-slate-200/80 shadow-xs">
                      <span>🚻 WC T1</span>
                      <span>•</span>
                      <span>🏢 BQL P.102</span>
                      <span>•</span>
                      <span className="text-rose-600 font-bold">🧯 PCCC #04</span>
                      <span>•</span>
                      <span className="text-blue-600 font-bold">📹 CCTV A-B</span>
                    </div>
                  </div>

                  {/* FLOATING TACTICAL PRIORITY LEGEND (Góc dưới bên trái Canvas - Pure Vietnamese, Không dùng P0/P1) */}
                  <div className="absolute bottom-3 left-3 z-20 hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-xs text-[11px] font-sans">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Trạng thái:</span>
                    <span className="flex items-center gap-1 font-bold text-rose-700">
                      <span className="w-2 h-2 rounded-full bg-rose-600 motion-safe:animate-pulse inline-block" aria-hidden="true"></span>
                      <span>Khẩn cấp</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 font-bold text-amber-700">
                      <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" aria-hidden="true"></span>
                      <span>Cần chú ý</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 font-bold text-yellow-700">
                      <Wrench className="h-3 w-3" aria-hidden="true" />
                      <span>Bảo trì</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-xs border border-slate-300 bg-white"></span>
                      <span>Bình thường</span>
                    </span>
                  </div>

                  {/* Floating Duty Operational HUD Banner */}
                  {dutyView !== 'all' && (
                    <div 
                      data-testid="duty-operational-hud"
                      className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-lg text-xs font-sans"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dutyView === 'sanitation' ? 'bg-sky-500' : dutyView === 'security_fire' ? 'bg-rose-600' : 'bg-amber-500'} motion-safe:animate-pulse`} />
                        <span className="font-bold text-slate-900">
                          {dutyView === 'sanitation' ? 'Ca Vệ Sinh & Nước' : dutyView === 'security_fire' ? 'Ca An Ninh & PCCC' : 'Ca Thu Phí & Hợp Đồng'}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="font-semibold text-slate-600">
                          {filteredStalls.length} vị trí trọng yếu
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        {filteredStalls.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const firstStall = filteredStalls[0];
                              if (firstStall) {
                                handleSelectStall(firstStall);
                              }
                            }}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#076C31] font-bold rounded-lg border border-emerald-200 text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>Lia tới sạp {filteredStalls[0].code}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDutyView('all')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
                        >
                          Quay lại Toàn cảnh
                        </button>
                      </div>
                    </div>
                  )}

                  {viewEngine === '3d_three' && activeFixtureKey === 'A' ? (
                    <ThreeSpatialRenderer
                      stalls={currentFloor.stalls}
                      selectedStall={selectedStall}
                      onSelectStall={handleSelectStall}
                      zoomLevel={zoomLevel}
                      dutyView={dutyView}
                      highlightedEntityIds={new Set(filteredStalls.map((s) => s.id))}
                      className={isFullscreen ? 'flex-1 w-full h-full min-h-0' : 'h-[640px]'}
                    />
                  ) : (
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
                        dutyView={dutyView}
                        className="w-full h-full rounded-none"
                        onSelectZone={handleSelectZone}
                        onSelectEntity={(entity) => {
                          if (entity && 'code' in entity) {
                            handleSelectStall(entity);
                          }
                        }}
                      />
                    </div>
                  )}

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

                  {/* Cụm Nút Điều Khiển Nổi Hiện Trường (Floating Field Navigation Hub - Mobile/Tablet Only) */}
                  <div 
                    data-testid="floating-field-hub"
                    className="absolute right-3 bottom-3 z-30 lg:hidden flex flex-col gap-1.5 shadow-lg rounded-xl bg-white/95 backdrop-blur-md p-1.5 border border-slate-200"
                  >
                    {/* Nút Căn giữa sạp đang chọn (nếu có) */}
                    {selectedStall && (
                      <button
                        type="button"
                        onClick={() => handleSelectStall(selectedStall)}
                        title={`Căn giữa Sạp ${selectedStall.code}`}
                        aria-label={`Căn giữa sạp ${selectedStall.code}`}
                        className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-[#076C31] hover:bg-emerald-100 font-mono text-xs font-black shadow-2xs border border-emerald-300 transition-colors cursor-pointer"
                      >
                        <span>{selectedStall.code}</span>
                      </button>
                    )}

                    {/* Nút Phóng to (+) */}
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      title="Phóng to bản đồ (+)"
                      aria-label="Phóng to bản đồ"
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>

                    {/* Nút Thu nhỏ (-) */}
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      title="Thu nhỏ bản đồ (-)"
                      aria-label="Thu nhỏ bản đồ"
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>

                    {/* Nút Căn giữa toàn cảnh (Reset) */}
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      title="Căn giữa toàn chợ (Reset)"
                      aria-label="Căn giữa toàn cảnh chợ"
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

        </main>
      </div>

      {/* 4. Slide-over Inspector Side Panel (Phase 5 Decision Panel) */}
      <StallDetailDrawer
        stall={selectedStall}
        onClose={handleCloseDrawer}
        onQuickDispatch={(s, team) => handleQuickDispatch(s.id, team)}
        onExtendContract={(s) => {
          setDispatchToast(`Đã gửi thông báo gia hạn hợp đồng tới chủ sạp ${s.code}`);
          setTimeout(() => setDispatchToast(null), 4500);
        }}
        onCollectFee={(s) => {
          setDispatchToast(`Đã ghi nhận thu phí dịch vụ sạp ${s.code} thành công`);
          setTimeout(() => setDispatchToast(null), 4500);
        }}
        onViewComplaints={(s) => {
          setDispatchToast(`Đang mở hồ sơ bằng chứng hiện trường sạp ${s.code}`);
          setTimeout(() => setDispatchToast(null), 4500);
        }}
      />

    </div>
  );
}
