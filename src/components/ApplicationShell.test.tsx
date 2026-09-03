import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Header from './Header';
import Sidebar from './Sidebar';

describe('ApplicationShell responsive navigation contract', () => {
  it('starts with a collapsed mobile menu control that exposes its expanded state', () => {
    render(
      <Header
        searchQuery=""
        onSearchChange={vi.fn()}
        urgentCount={3}
      />
    );

    const menuButton = screen.getByRole('button', { name: /mở menu điều hướng/i });
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps core sidebar labels and operational badges visible when expanded', () => {
    render(
      <Sidebar
        isCollapsed={false}
        onToggleCollapse={vi.fn()}
        currentView="market_map"
        onSelectView={vi.fn()}
        onScrollToFees={vi.fn()}
        onFilterComplaints={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Tổng quan sơ đồ/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Sạp hàng không gian 38/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Hồ sơ tiểu thương 7/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Phản ánh & Khiếu nại 12/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Thu phí thị trường 93%/i })).toBeDefined();
  });

  it('keeps search and notifications discoverable by accessible text', () => {
    const { container } = render(
      <Header
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenActivityModal={vi.fn()}
        urgentCount={4}
      />
    );

    expect(screen.getByPlaceholderText(/Tìm mã sạp/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Nhật ký hoạt động/i })).toBeDefined();
    const urgentPing = container.querySelector('[data-urgent-ping="motion"]');
    expect(urgentPing).not.toBeNull();
    const urgentPingClasses = urgentPing?.className.split(/\s+/) ?? [];
    expect(urgentPingClasses).toContain('motion-safe:animate-ping');
    expect(urgentPingClasses).not.toContain('animate-ping');
  });

  it('does not expose closed mobile sidebar controls to keyboard or accessibility users', () => {
    render(
      <Sidebar
        isCollapsed={false}
        onToggleCollapse={vi.fn()}
        currentView="market_map"
        onSelectView={vi.fn()}
        onScrollToFees={vi.fn()}
        onFilterComplaints={vi.fn()}
        isMobileOpen={false}
        onCloseMobile={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /Đóng menu điều hướng/i })).toBeNull();
    expect(screen.queryByTestId('mobile-sidebar-panel')).toBeNull();
  });

  it('uses a truthful toggle action when the mobile menu is already open', () => {
    const onToggleMobileMenu = vi.fn();

    render(
      <Header
        searchQuery=""
        onSearchChange={vi.fn()}
        urgentCount={0}
        isMobileMenuOpen
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    const menuButton = screen.getByRole('button', { name: /Đóng menu điều hướng/i });
    expect(menuButton.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(menuButton);

    expect(onToggleMobileMenu).toHaveBeenCalledTimes(1);
  });
});
