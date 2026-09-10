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
import { CLIENT_COMPLAINTS, CLIENT_ORDERS } from '@/data/clientCmsData';
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

  // 7. Dynamic Badge Counters for Navigation
  const activeComplaintsCount = useMemo(() => {
    const list = liveComplaints && liveComplaints.length > 0 ? liveComplaints : CLIENT_COMPLAINTS;
    return list.filter(
      (c: any) => c.status !== 'resolved' && !(c.code && resolvedComplaintCodes.includes(c.code)) && !resolvedComplaintCodes.includes(c.id)
    ).length;
  }, [liveComplaints, resolvedComplaintCodes]);

  const pendingProfilesCount = useMemo(() => {
    if (liveApplications && liveApplications.length > 0) {
      return liveApplications.filter(
        (a: any) => a.status === 'pending' || a.status === 'reviewing' || a.status === 'need_more_info'
      ).length;
    }
    return URGENT_ACTIONS.pendingProfiles.totalPending;
  }, [liveApplications]);
  const pendingOrdersCount = CLIENT_ORDERS.length;

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
              stalls={liveStalls}
              selectedMarketId={selectedMarketId}
              onApproveApplication={approveApplication}
              onRejectApplication={rejectApplication}
              onRequestSupplement={requestApplicationInfo}
            />
          ) : currentView === 'stalls' ? (
            <StallsManagementView
              stalls={liveStalls}
              selectedMarketId={selectedMarketId}
              onNavigateToMap={(code) => {
                setSelectedStallCodeForMap(code);
                setCurrentView('market_map');
              }}
            />
          ) : currentView === 'traders' ? (
            <TradersManagementView
              onNavigateToMap={(code) => {
                setSelectedStallCodeForMap(code);
                setCurrentView('market_map');
              }}
            />
          ) : currentView === 'products' ? (
            <ProductsManagementView />
          ) : currentView === 'orders' ? (
            <OrdersManagementView />
          ) : currentView === 'complaints' ? (
            <ComplaintsManagementView
              complaints={liveComplaints}
              selectedMarketId={selectedMarketId}
              onNavigateToMap={(code) => {
                setSelectedStallCodeForMap(code);
                setCurrentView('market_map');
              }}
              resolvedCodes={resolvedComplaintCodes}
              onResolveComplaint={(codeOrId) => {
                handleResolveComplaint(codeOrId);
                handleBackendResolveComplaint(codeOrId);
              }}
            />
          ) : currentView === 'markets' ? (
            <MarketsManagementView
              markets={liveMarkets}
              onSelectMarket={(marketId) => {
                setSelectedMarketId(marketId);
                setCurrentView('overview');
              }}
            />
          ) : currentView === 'gis_map' ? (
            <GisMapView
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
              resolvedComplaintCodes={resolvedComplaintCodes}
              onResolveComplaint={(codeOrId) => {
                handleResolveComplaint(codeOrId);
                handleBackendResolveComplaint(codeOrId);
              }}
              selectedMarketId={selectedMarketId}
              markets={liveMarkets}
              stalls={liveStalls}
              zones={liveZones}
              complaints={liveComplaints}
            />
          ) : (
            /* VIEW B: SƠ ĐỒ CHỢ & QUY HOẠCH MẶT BẰNG THỰC TẾ CHUẨN KIẾN TRÚC $DESIGN */
            <div className="w-full flex-1 flex flex-col min-h-0 h-full">
              <MarketInteractiveMapView
                initialSelectedStallCode={selectedStallCodeForMap}
                onOpenTraderProfile={() => {
                  setCurrentView('traders');
                }}
                stalls={liveStalls}
                markets={liveMarkets}
                selectedMarketId={selectedMarketId}
                complaints={liveComplaints}
                zones={liveZones}
              />
            </div>
          )}
        </main>
      </div>

    </div>
  );
}
