'use client';

import React, { useEffect } from 'react';
import {
  LayoutDashboard, Map, Globe, Store, Users,
  Package, ShoppingCart, MessageSquareWarning, ClipboardCheck,
  Landmark, BarChart3, Bell, Settings, ScrollText,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentView: string;
  onSelectView: (view: string) => void;
  onScrollToFees?: () => void;
  onFilterComplaints?: () => void;
  unreadNotificationsCount?: number;
  activeComplaintsCount?: number;
  pendingProfilesCount?: number;
  pendingOrdersCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  view: string;
  badge?: string;
  badgeType?: 'danger' | 'warning' | 'brand' | 'neutral';
  onClick?: () => void;
}

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  currentView = 'overview',
  onSelectView,
  onScrollToFees,
  onFilterComplaints,
  unreadNotificationsCount,
  activeComplaintsCount,
  pendingProfilesCount,
  pendingOrdersCount,
  isMobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  useEffect(() => {
    if (!isMobileOpen || !onCloseMobile) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseMobile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const navigationGroups: Array<{ groupTitle: string; items: NavigationItem[] }> = [
    {
      groupTitle: 'TỔNG QUAN',
      items: [
        {
          id: 'overview',
          label: 'Tổng quan',
          icon: LayoutDashboard,
          view: 'overview',
          onClick: () => {
            onSelectView('overview');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'market_map',
          label: 'Sơ đồ chợ',
          icon: Map,
          view: 'market_map',
          onClick: () => {
            onSelectView('market_map');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'gis_map',
          label: 'Bản đồ GIS',
          icon: Globe,
          view: 'gis_map',
          badge: 'GIS',
          badgeType: 'neutral',
          onClick: () => {
            onSelectView('gis_map');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'stalls',
          label: 'Sạp hàng',
          icon: Store,
          view: 'stalls',
          onClick: () => {
            onSelectView('stalls');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'traders',
          label: 'Quản lý tiểu thương',
          icon: Users,
          view: 'traders',
          onClick: () => {
            onSelectView('traders');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      ]
    },
    {
      groupTitle: 'KINH DOANH',
      items: [
        {
          id: 'products',
          label: 'Sản phẩm & Hàng hóa',
          icon: Package,
          view: 'products',
          onClick: () => {
            onSelectView('products');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'orders',
          label: 'Đơn hàng online',
          icon: ShoppingCart,
          view: 'orders',
          badge: pendingOrdersCount !== undefined
            ? (pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined)
            : '5',
          badgeType: 'brand',
          onClick: () => {
            onSelectView('orders');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      ]
    },
    {
      groupTitle: 'GIÁM SÁT & ĐÁNH GIÁ',
      items: [
        {
          id: 'complaints',
          label: 'PAKN · Phản ánh & Khiếu nại',
          icon: MessageSquareWarning,
          view: 'complaints',
          badge: activeComplaintsCount !== undefined
            ? (activeComplaintsCount > 0 ? String(activeComplaintsCount) : undefined)
            : '14',
          badgeType: 'danger',
          onClick: () => {
            onSelectView('complaints');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'merchant_approvals',
          label: 'Duyệt hồ sơ tiểu thương',
          icon: ClipboardCheck,
          view: 'pending_profiles',
          badge: pendingProfilesCount !== undefined
            ? (pendingProfilesCount > 0 ? String(pendingProfilesCount) : undefined)
            : '7',
          badgeType: 'warning',
          onClick: () => {
            onSelectView('pending_profiles');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      ]
    },
    {
      groupTitle: 'HỆ THỐNG',
      items: [
        {
          id: 'notifications',
          label: 'Thông báo',
          icon: Bell,
          view: 'notifications',
          badge: unreadNotificationsCount !== undefined
            ? (unreadNotificationsCount > 0 ? String(unreadNotificationsCount) : undefined)
            : '2',
          badgeType: 'danger',
          onClick: () => {
            onSelectView('notifications');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'settings',
          label: 'Cài đặt hệ thống',
          icon: Settings,
          view: 'settings',
          onClick: () => {
            onSelectView('settings');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      ]
    }
  ];

  const renderPanel = (mode: 'desktop' | 'mobile') => {
    const isMobilePanel = mode === 'mobile';
    const showCollapsed = !isMobilePanel && isCollapsed;

    return (
      <aside
        id={isMobilePanel ? 'application-sidebar' : 'desktop-application-sidebar'}
        aria-label="Điều hướng chính"
        data-testid={isMobilePanel ? 'mobile-sidebar-panel' : undefined}
        className={`reference-sidebar shrink-0 select-none flex-col justify-between border-r border-[#DCE8F1] bg-white text-[#294463] ${
          isMobilePanel
            ? 'fixed inset-y-0 left-0 z-40 flex h-[100dvh] w-72 max-w-[85vw] shadow-xl'
            : `hidden md:relative md:z-30 md:flex md:h-auto md:shadow-xs ${showCollapsed ? 'md:w-16' : 'md:w-64'}`
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-3.5 border-b border-[#DCE8F1] flex items-center justify-between bg-white">
            {!showCollapsed ? (
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/smartmarket-logo.svg"
                  alt="Smart Market Logo"
                  className="w-9 h-9 object-contain shrink-0"
                />
                <div>
                  <h1 className="text-[15px] font-black text-[#1E385B] tracking-tight leading-tight">
                    Smart Market
                  </h1>
                  <p className="text-[11px] text-[#6F829E] font-medium">Command Center</p>
                </div>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <img
                  src="/images/smartmarket-logo.svg"
                  alt="Smart Market Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
            )}
            {isMobilePanel ? (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Đóng menu điều hướng"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-[#7185A1] hover:bg-slate-100 hover:text-[#1D385F] md:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label={showCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                className="hidden h-8 w-8 items-center justify-center rounded-lg text-[#7185A1] hover:text-[#1D385F] hover:bg-[#F5FAF8] border border-[#DCE8F1] transition-colors cursor-pointer md:flex"
                title={showCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              >
                {showCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="py-2 px-2 space-y-3.5 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {navigationGroups.map((group, idx) => (
              <div key={idx}>
                {!showCollapsed && (
                  <div className="px-2.5 mb-1 text-[10px] font-black text-[#7890AC] tracking-wider uppercase font-sans">
                    {group.groupTitle}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.view || (item.view === 'pending_profiles' && currentView === 'merchant_approvals');

                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          item.onClick?.();
                          if (isMobilePanel) onCloseMobile?.();
                        }}
                        aria-label={item.badge ? `${item.label} ${item.badge}` : item.label}
                        className={`reference-nav-item w-full min-h-10 flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'reference-nav-active bg-[#0B7A3A] text-white shadow-[0_4px_12px_rgba(11,122,58,0.22)] font-extrabold'
                            : 'text-[#294463] hover:bg-[#EFF9F3] hover:text-[#0B7A3A]'
                        } ${showCollapsed ? 'justify-center px-0' : ''}`}
                        title={showCollapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#264A70]'}`} />
                        {!showCollapsed && (
                          <>
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-extrabold font-mono px-1.5 py-0.5 rounded-md ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : item.badgeType === 'danger'
                                    ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                                    : item.badgeType === 'warning'
                                    ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                                    : item.badgeType === 'brand'
                                    ? 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
                                    : 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-[#DCE8F1] bg-white text-[11px] text-[#7185A1]">
          {!showCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0B7A3A]"></div>
                <span className="text-[11px] font-bold text-[#1D385F]">© Smart Market CMS</span>
              </div>
              <span className="text-[10px] text-[#7185A1]">v3.2.0</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full bg-[#0B7A3A]" />
            </div>
          )}
        </div>
      </aside>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng menu điều hướng"
            className="fixed inset-0 z-30 bg-slate-950/35 md:hidden"
            onClick={onCloseMobile}
          />
          {renderPanel('mobile')}
        </>
      )}
      {renderPanel('desktop')}
    </>
  );
}
