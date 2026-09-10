'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import PendingProfilesView from '@/components/PendingProfilesView';
import LiveDashboardOverview from '@/components/LiveDashboardOverview';
import StallsManagementView from '@/components/StallsManagementView';
import TradersManagementView from '@/components/TradersManagementView';
import ProductsManagementView from '@/components/ProductsManagementView';
import OrdersManagementView from '@/components/OrdersManagementView';
import ComplaintsManagementView from '@/components/ComplaintsManagementView';
import MarketsManagementView from '@/components/MarketsManagementView';
import SystemOperationsView from '@/components/SystemOperationsView';
import GisMapView from '@/components/GisMapView';
import LoginPage from '@/components/auth/LoginPage';
import MarketInteractiveMapView from '@/components/MarketInteractiveMapView';
import { CLIENT_COMPLAINTS, CLIENT_ORDERS, CLIENT_STALLS, CLIENT_TRADERS, CLIENT_MARKETS } from '@/data/clientCmsData';
import { URGENT_ACTIONS } from '@/data/mockMarketData';
import type { SessionUser } from '@/types/clientTypes';
import { useBackendSync } from '@/hooks/useBackendSync';


export default function SmartMarketHome() {
  // User Session & Auth (Mặc định Super Admin đã xác thực với backend)
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartmarket_user_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email !== 'quanly@smartmarket.vn') {
            return parsed;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      id: '10000000-0000-4000-8000-000000000001',
      fullName: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      phone: '0903 888 999',
      email: 'admin@smartmarket.vn',
      role: 'super_admin'
    };
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Live Backend Synchronization State
  const [selectedMarketId, setSelectedMarketId] = useState<string>('all');
  const {
    markets: liveMarkets,
    stalls: liveStalls,
    complaints: liveComplaints,
    zones: liveZones,
    applications: liveApplications,
    traders: liveTraders,
    products: liveProducts,
    orders: liveOrders,
    notifications: liveNotifications,
    isConnected: isBackendConnected,
    isLoading: isBackendLoading,
    resolveComplaint: handleBackendResolveComplaint,
    approveApplication,
    rejectApplication,
    requestApplicationInfo,
  } = useBackendSync(selectedMarketId);

  // 2. Navigation & Shell Layout
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [currentView, setCurrentView] = useState<string>('overview');

  // 3. Search & State for Map Focus
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStallCodeForMap, setSelectedStallCodeForMap] = useState<string | undefined>(undefined);

  // 4. In-Map Quick Dispatch Engine
  const [dispatchedStalls, setDispatchedStalls] = useState<Record<string, { teamName: string; status: string }>>({});

  const handleQuickDispatch = (stallId: string, teamName: string) => {
    setDispatchedStalls((prev) => ({
      ...prev,
      [stallId]: { teamName, status: 'in_progress' }
    }));
  };


  // 5. Shared Notification Counter
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartmarket_notifications');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          return list.filter((n: any) => !n.isRead).length;
        } catch {
          // fallback
        }
      }
    }
    return 2;
  });

  // 6. Persistent Resolved Complaints State (Shared across all views)
  const [resolvedComplaintCodes, setResolvedComplaintCodes] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('smartmarket_resolved_complaints') || '[]');
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // 6.5. Tập hợp mã phản ánh đã giải quyết hợp nhất (Persistent Resolved Set)
  const allResolvedComplaintCodes = useMemo(() => {
    return Array.from(new Set([
      'PAKN-2026-108',
      'cp-13',
      'c13',
      ...resolvedComplaintCodes
    ]));
  }, [resolvedComplaintCodes]);

  // 6.6. Danh sách Khiếu nại phản ứng chuẩn hóa (Effective Complaints)
  const effectiveComplaints = useMemo(() => {
    const list = liveComplaints && liveComplaints.length > 0 ? liveComplaints : CLIENT_COMPLAINTS;
    return list.map((c: any) => {
      const isResolved =
        c.status === 'resolved' ||
        (c.code && allResolvedComplaintCodes.includes(c.code)) ||
        (c.id && allResolvedComplaintCodes.includes(c.id));
      if (isResolved) {
        return {
          ...c,
          status: 'resolved' as const,
          resolvedAt: c.resolvedAt || new Date().toISOString(),
          resolutionNote: c.resolutionNote || 'Đã kiểm tra thực địa và xử lý dứt điểm.'
        };
      }
      return c;
    });
  }, [liveComplaints, allResolvedComplaintCodes]);

  // 6.7. Danh sách Sạp phản ứng chuẩn hóa (Effective Stalls)
  const effectiveStalls = useMemo(() => {
    const list = liveStalls && liveStalls.length > 0 ? liveStalls : CLIENT_STALLS;
    return list.map((s: any) => {
      const stallOpenComplaints = effectiveComplaints.filter((c: any) => {
        const match =
          c.stallId === s.id ||
          c.stallId === s.code ||
          (c.stalls && (c.stalls.id === s.id || c.stalls.code === s.code)) ||
          (c as any).stallCode === s.code;
        return match && c.status !== 'resolved';
      });
      const openComplaintCount = stallOpenComplaints.length;
      let displayStatus = s.displayStatus;
      if (openComplaintCount === 0 && s.displayStatus === 'has_complaint') {
        const isExpiring = s.currentContract && s.currentContract.daysLeft != null && s.currentContract.daysLeft <= 30;
        displayStatus = isExpiring ? 'expiring_soon' : (s.status === 'occupied' ? 'occupied' : s.status);
      }
      return {
        ...s,
        openComplaintCount,
        displayStatus,
      };
    });
  }, [liveStalls, effectiveComplaints]);

  // 6.8. Danh sách Tiểu thương phản ứng chuẩn hóa (Effective Traders)
  const effectiveTraders = useMemo(() => {
    const list = liveTraders && liveTraders.length > 0 ? liveTraders : CLIENT_TRADERS;
    return list.map((t: any) => {
      const traderStallId = t.stall?.id || t.stall?.code;
      const traderOpenComplaints = effectiveComplaints.filter((c: any) => {
        const match =
          (c.userId && c.userId === t.id) ||
          (traderStallId && (
            c.stallId === traderStallId ||
            (c.stalls && (c.stalls.id === traderStallId || c.stalls.code === traderStallId)) ||
            (c as any).stallCode === traderStallId
          ));
        return match && c.status !== 'resolved';
      });
      return {
        ...t,
        openComplaintCount: traderOpenComplaints.length,
      };
    });
  }, [liveTraders, effectiveComplaints]);

  // 6.9. Danh sách Chợ phản ứng chuẩn hóa (Effective Markets)
  const effectiveMarkets = useMemo(() => {
    const list = liveMarkets && liveMarkets.length > 0 ? liveMarkets : CLIENT_MARKETS;
    return list.map((m: any) => {
      const marketOpenComplaints = effectiveComplaints.filter((c: any) => {
        return c.marketId === m.id && c.status !== 'resolved';
      });
      return {
        ...m,
        openComplaintCount: marketOpenComplaints.length,
      };
    });
  }, [liveMarkets, effectiveComplaints]);

  // 7. Dynamic Badge Counters for Navigation
  const activeComplaintsCount = useMemo(() => {
    return effectiveComplaints.filter((c: any) => c.status !== 'resolved').length;
  }, [effectiveComplaints]);

  const pendingProfilesCount = useMemo(() => {
    if (liveApplications && liveApplications.length > 0) {
      return liveApplications.filter(
        (a: any) => a.status === 'pending' || a.status === 'reviewing' || a.status === 'need_more_info'
      ).length;
    }
    return URGENT_ACTIONS.pendingProfiles.totalPending;
  }, [liveApplications]);

  const pendingOrdersCount = useMemo(() => {
    if (liveOrders && liveOrders.length > 0) {
      const pending = liveOrders.filter((o: any) => o.status === 'pending');
      return pending.length > 0 ? pending.length : liveOrders.length;
    }
    return CLIENT_ORDERS.length;
  }, [liveOrders]);

  const handleResolveComplaint = (codeOrId: string) => {
    setResolvedComplaintCodes((prev) => {
      if (prev.includes(codeOrId)) return prev;
      const next = [...prev, codeOrId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('smartmarket_resolved_complaints', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const mainEl = document.getElementById('main-content');
    if (mainEl) mainEl.scrollTop = 0;
  }, [currentView]);

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

  // If no user is logged in, show the standalone Login Page
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('smartmarket_user_session', JSON.stringify(user));
        }}
      />
    );
  }

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-slate-50/70 font-sans text-slate-900">
      <a
        href="#main-content"
        className="sr-only fixed left-3 top-3 z-[70] rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-lg ring-2 ring-[var(--color-focus-ring)] focus:not-sr-only"
      >
        Chuyển đến nội dung chính
      </a>

      {/* Login Modal overlay (when clicking avatar/user menu while logged in) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl">
            <LoginPage
              onLogin={(user) => {
                setCurrentUser(user);
                localStorage.setItem('smartmarket_user_session', JSON.stringify(user));
                setShowLoginModal(false);
              }}
              onCancel={() => setShowLoginModal(false)}
            />
          </div>
        </div>
      )}

      {/* 1. Shell Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v as any)}
        onScrollToFees={scrollToFees}
        unreadNotificationsCount={unreadNotificationsCount}
        activeComplaintsCount={activeComplaintsCount}
        pendingProfilesCount={pendingProfilesCount}
        pendingOrdersCount={pendingOrdersCount}
        onFilterComplaints={() => {
          setSelectedStallCodeForMap('A-06');
          setCurrentView('market_map');
        }}
      />

      {/* Main Operational Stage */}
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">

        {/* 2. Shell Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          urgentCount={unreadNotificationsCount}
          onOpenActivityModal={() => {
            setCurrentView('notifications');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isMobileMenuOpen={isMobileSidebarOpen}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((open) => !open)}
          mobileMenuButtonRef={mobileMenuButtonRef}
          currentUser={currentUser}
          onLogout={() => {
            setCurrentUser(null);
            localStorage.removeItem('smartmarket_user_session');
            localStorage.removeItem('smartmarket_auth_token');
          }}
          onOpenLogin={() => setShowLoginModal(true)}
          markets={liveMarkets}
          selectedMarketId={selectedMarketId}
          onSelectMarketId={setSelectedMarketId}
        />

        {/* 3. Main Workspace Container */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 ${
            currentView === 'market_map'
              ? 'overflow-hidden p-2 sm:p-3 flex flex-col min-h-0'
              : 'overflow-y-auto p-3 sm:p-4 space-y-4'
          } focus:outline-none`}
        >

          {/* VIEW ROUTER: 15 CMS VIEWS + SƠ ĐỒ QUY HOẠCH ĐỒNG BỘ DỮ LIỆU THỰC TẾ */}
          {currentView === 'login' ? (
            <LoginPage
              onLogin={(user) => {
                setCurrentUser(user);
                localStorage.setItem('smartmarket_user_session', JSON.stringify(user));
                setCurrentView('overview');
              }}
            />
          ) : currentView === 'pending_profiles' || currentView === 'merchant_approvals' ? (
            <PendingProfilesView
              onBackToMap={() => setCurrentView('market_map')}
              onNavigateToMap={(code) => {
                setSelectedStallCodeForMap(code);
                setCurrentView('market_map');
              }}
              applications={liveApplications}
              stalls={effectiveStalls}
              selectedMarketId={selectedMarketId}
              onApproveApplication={approveApplication}
              onRejectApplication={rejectApplication}
              onRequestSupplement={requestApplicationInfo}
            />
          ) : currentView === 'stalls' ? (
            <StallsManagementView
              stalls={effectiveStalls}
              selectedMarketId={selectedMarketId}
              onNavigateToMap={(code) => {
                setSelectedStallCodeForMap(code);
                setCurrentView('market_map');
              }}
            />
          ) : currentView === 'traders' ? (
            <TradersManagementView
              traders={effectiveTraders}
              selectedMarketId={selectedMarketId}
              onNavigateToMap={(code) => {
                setSelectedStallCodeForMap(code);
                setCurrentView('market_map');
              }}
            />
          ) : currentView === 'products' ? (
            <ProductsManagementView
              products={liveProducts}
              selectedMarketId={selectedMarketId}
            />
          ) : currentView === 'orders' ? (
            <OrdersManagementView
              orders={liveOrders}
              selectedMarketId={selectedMarketId}
            />
          ) : currentView === 'complaints' ? (
            <ComplaintsManagementView
              complaints={effectiveComplaints}
              selectedMarketId={selectedMarketId}
              onNavigateToMap={(code) => {
                setSelectedStallCodeForMap(code);
                setCurrentView('market_map');
              }}
              resolvedCodes={allResolvedComplaintCodes}
              onResolveComplaint={(codeOrId) => {
                handleResolveComplaint(codeOrId);
                handleBackendResolveComplaint(codeOrId);
              }}
            />
          ) : currentView === 'markets' ? (
            <MarketsManagementView
              markets={effectiveMarkets}
              onSelectMarket={(marketId) => {
                setSelectedMarketId(marketId);
                setCurrentView('overview');
              }}
            />
          ) : currentView === 'gis_map' ? (
            <GisMapView
              complaints={effectiveComplaints}
              resolvedCodes={allResolvedComplaintCodes}
              onNavigateToMarketMap={(_marketId, stallCode) => {
                if (stallCode) {
                  setSelectedStallCodeForMap(stallCode);
                }
                setCurrentView('market_map');
              }}
            />
          ) : currentView === 'notifications' ? (
            <SystemOperationsView
              key="notifications"
              mode="notifications"
              initialTab="notifications"
              liveNotifications={liveNotifications}
              onUnreadCountChange={setUnreadNotificationsCount}
            />
          ) : ['settings', 'audits', 'operations', 'reports'].includes(currentView) ? (
            <SystemOperationsView
              key="settings"
              mode="settings"
              initialTab={currentView === 'audits' ? 'audits' : 'settings'}
              onUnreadCountChange={setUnreadNotificationsCount}
            />
          ) : currentView === 'overview' ? (
            /* VIEW C: TỔNG QUAN VẬN HÀNH (ĐỒNG BỘ 100% GIAO DIỆN LIVE CMS QL.CHOTHONGMINH.TOP) */
            <LiveDashboardOverview
              onNavigateToMap={(code?: string) => {
                if (code) {
                  setSelectedStallCodeForMap(code);
                }
                setCurrentView('market_map');
              }}
              onNavigateToProfiles={() => setCurrentView('pending_profiles')}
              dispatchedStalls={dispatchedStalls}
              onQuickDispatch={handleQuickDispatch}
              resolvedComplaintCodes={allResolvedComplaintCodes}
              onResolveComplaint={(codeOrId) => {
                handleResolveComplaint(codeOrId);
                handleBackendResolveComplaint(codeOrId);
              }}
              selectedMarketId={selectedMarketId}
              markets={effectiveMarkets}
              stalls={effectiveStalls}
              zones={liveZones}
              complaints={effectiveComplaints}
              traders={effectiveTraders}
              products={liveProducts}
            />
          ) : (
            /* VIEW B: SƠ ĐỒ CHỢ & QUY HOẠCH MẶT BẰNG THỰC TẾ CHUẨN KIẾN TRÚC $DESIGN */
            <div className="w-full flex-1 flex flex-col min-h-0 h-full">
              <MarketInteractiveMapView
                initialSelectedStallCode={selectedStallCodeForMap}
                onOpenTraderProfile={() => {
                  setCurrentView('traders');
                }}
                stalls={effectiveStalls}
                markets={effectiveMarkets}
                selectedMarketId={selectedMarketId}
                complaints={effectiveComplaints}
                zones={liveZones}
                products={liveProducts}
                applications={liveApplications}
                resolvedCodes={allResolvedComplaintCodes}
                onApproveApplication={approveApplication}
                onResolveComplaint={(codeOrId) => {
                  handleResolveComplaint(codeOrId);
                  handleBackendResolveComplaint(codeOrId);
                }}
                onQuickDispatch={handleQuickDispatch}
              />
            </div>
          )}
        </main>
      </div>

    </div>
  );
}
