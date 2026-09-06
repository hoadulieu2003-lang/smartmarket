'use client';

import React, { useEffect } from 'react';
import {
  Store, LayoutDashboard, Users, Globe,
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
  currentView = 'overview',
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
      groupTitle: 'ĐIỀU HÀNH CHỢ',
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
          id: 'stalls',
          label: 'Sơ đồ chợ',
          icon: Store,
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
          badge: 'Live',
          badgeType: 'neutral',
          onClick: () => {
            if (onSelectView) onSelectView('market_map');
          }
        },
        {
          id: 'merchants',
          label: 'Duyệt hồ sơ tiểu thương',
          icon: Users,
          badge: '7',
          badgeType: 'warning',
          view: 'pending_profiles',
          onClick: () => {
            onSelectView('pending_profiles');
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
      className={`shrink-0 select-none flex-col justify-between border-r border-[var(--color-slate-border)] bg-[var(--color-slate-surface)] text-[var(--color-slate-text-muted)] ${
        isMobilePanel
          ? 'fixed inset-y-0 left-0 z-40 flex h-[100dvh] w-72 max-w-[85vw] shadow-xl'
          : `hidden md:relative md:z-30 md:flex md:h-auto md:shadow-xs ${showCollapsed ? 'md:w-16' : 'md:w-60'}`
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
                className="w-8 h-8 object-contain shrink-0"
              />
              <div>
                <h1 className="text-sm font-black text-[#1D385F] tracking-tight leading-tight">
                  SMART MARKET
                </h1>
                <p className="text-[10px] text-[#7185A1] font-sans font-medium">Command Center</p>
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
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-[#7185A1] hover:text-[#1D385F] hover:bg-[#F5FAF8] border border-[#DCE8F1] transition-colors cursor-pointer md:flex"
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
                <div className="px-2.5 mb-1.5 text-[10px] font-black text-[#7185A1] tracking-wider uppercase font-sans">
                  {group.groupTitle}
                </div>
              )}
              <div className="space-y-1">
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
                      className={`w-full min-h-11 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B7A3A] ${
                        isActive
                          ? 'bg-[#0B7A3A] text-white shadow-[0_4px_14px_rgba(11,122,58,0.28)] font-extrabold'
                          : 'text-[#7185A1] hover:bg-[#E8F8EF] hover:text-[#0B7A3A]'
                      } ${showCollapsed ? 'justify-center px-0' : ''}`}
                      title={showCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#7185A1]'}`} />
                      {!showCollapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-extrabold font-mono px-1.5 py-0.5 rounded-md ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : item.badgeType === 'danger'
                                  ? 'bg-[#FFF1F2] text-[#EE565D] border border-[#FFD1D4]'
                                  : item.badgeType === 'warning'
                                  ? 'bg-[#FFFBEB] text-[#F5A623] border border-[#FDE68A]'
                                  : item.badgeType === 'brand'
                                  ? 'bg-[#E8F8EF] text-[#0B7A3A] border border-[#B9F4CA]'
                                  : 'bg-[#F5FAF8] text-[#7185A1] border border-[#DCE8F1]'
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
      <div className="p-3.5 border-t border-[#DCE8F1] bg-white text-[11px] text-[#7185A1]">
        {!showCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0B7A3A]"></div>
              <span className="text-[11px] font-bold text-[#1D385F]">Smart Market CMS</span>
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
