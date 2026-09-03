'use client';

import React, { useEffect } from 'react';
import {
  Store, LayoutDashboard, Users, Package, Star, AlertCircle,
  ShoppingCart, Receipt, ChevronLeft, ChevronRight, Building2, X
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentView: string;
  onSelectView: (view: string) => void;
  onScrollToFees?: () => void;
  onFilterComplaints?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  view?: string;
  badge?: string;
  badgeType?: string;
  onClick?: () => void;
}

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  currentView = 'market_map',
  onSelectView,
  onScrollToFees,
  onFilterComplaints,
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
      groupTitle: 'VẬN HÀNH MẶT BẰNG',
      items: [
        {
          id: 'overview',
          label: 'Tổng quan sơ đồ',
          icon: LayoutDashboard,
          view: 'market_map',
          onClick: () => {
            onSelectView('market_map');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'stalls',
          label: 'Sạp hàng không gian',
          icon: Store,
          badge: '38',
          badgeType: 'neutral',
          view: 'market_map',
          onClick: () => {
            onSelectView('market_map');
            setTimeout(() => {
              const mapSec = document.getElementById('market-map-section');
              if (mapSec) mapSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }
        },
        {
          id: 'merchants',
          label: 'Hồ sơ tiểu thương',
          icon: Users,
          badge: '7',
          badgeType: 'warning',
          view: 'pending_profiles',
          onClick: () => {
            onSelectView('pending_profiles');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        {
          id: 'products',
          label: 'Sản phẩm & Hàng hóa',
          icon: Package,
          badge: '1.2k',
          badgeType: 'neutral'
        },
        {
          id: 'ratings',
          label: 'Đánh giá & Xếp hạng',
          icon: Star
        }
      ]
    },
    {
      groupTitle: 'GIÁM SÁT & TÁC VỤ',
      items: [
        {
          id: 'complaints',
          label: 'Phản ánh & Khiếu nại',
          icon: AlertCircle,
          badge: '12',
          badgeType: 'danger',
          onClick: () => {
            if (onFilterComplaints) onFilterComplaints();
          }
        },
        {
          id: 'orders',
          label: 'Đơn hàng online',
          icon: ShoppingCart,
          badge: '5',
          badgeType: 'neutral'
        },
        {
          id: 'fees',
          label: 'Thu phí thị trường',
          icon: Receipt,
          badge: '93%',
          badgeType: 'brand',
          onClick: () => {
            if (currentView !== 'market_map') onSelectView('market_map');
            if (onScrollToFees) onScrollToFees();
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
      className={`shrink-0 select-none flex-col justify-between border-r border-[var(--color-slate-border)] bg-[var(--color-slate-surface)] text-[var(--color-slate-text-muted)] ${
        isMobilePanel
          ? 'fixed inset-y-0 left-0 z-40 flex h-[100dvh] w-72 max-w-[85vw] shadow-xl'
          : `hidden md:relative md:z-30 md:flex md:h-auto md:shadow-xs ${showCollapsed ? 'md:w-16' : 'md:w-60'}`
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-14 px-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          {!showCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-green)] text-white flex items-center justify-center font-bold font-mono shadow-xs">
                SM
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                  SMART MARKET
                </h1>
                <p className="text-[10px] text-slate-500 font-sans font-medium">Ban Quản Lý Chợ Đồng Xuân</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-green)] text-white flex items-center justify-center font-bold font-mono shadow-xs">
                SM
              </div>
            </div>
          )}
          {isMobilePanel ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Đóng menu điều hướng"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={showCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              className="hidden h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] md:flex"
              title={showCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {showCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="py-3 px-2 space-y-4">
          {navigationGroups.map((group, idx) => (
            <div key={idx}>
              {!showCollapsed && (
                <div className="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-sans">
                  {group.groupTitle}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.view ? currentView === item.view : false;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        item.onClick?.();
                        if (isMobilePanel) onCloseMobile?.();
                      }}
                      aria-label={item.badge ? `${item.label} ${item.badge}` : item.label}
                      className={`w-full min-h-11 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] ${
                        isActive
                          ? 'bg-[var(--color-selected-surface)] text-[var(--color-brand-green)] shadow-2xs border border-emerald-200/80 font-bold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      } ${showCollapsed ? 'justify-center px-0' : ''}`}
                      title={showCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--color-brand-green)]' : 'text-slate-500'}`} />
                      {!showCollapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                item.badgeType === 'danger'
                                  ? 'bg-rose-100 text-rose-700 font-extrabold border border-rose-200'
                                  : item.badgeType === 'warning'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : item.badgeType === 'brand'
                                  ? 'bg-emerald-100 text-[var(--color-brand-green)] border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
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
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 text-[11px] text-slate-500">
        {!showCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-emerald-100 text-[var(--color-brand-green)] flex items-center justify-center font-bold text-xs">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="text-slate-800 font-bold text-xs">Hệ thống Trực ban IoT</div>
              <div className="text-[10px] text-slate-400">Canonical Spatial v3.2.0</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Building2 className="w-4 h-4 text-[var(--color-brand-green)]" />
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
