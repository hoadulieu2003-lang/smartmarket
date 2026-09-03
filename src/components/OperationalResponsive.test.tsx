import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import UrgentActionCards from './UrgentActionCards';
import InlineOverviewBar from './InlineOverviewBar';
import MarketFeeCollectionSection from './MarketFeeCollectionSection';
import PendingProfilesView from './PendingProfilesView';
import { URGENT_ACTIONS } from '../data/mockMarketData';

describe('Operational responsive contract', () => {
  it('exposes mobile disclosure controls for lower-priority operational sections', () => {
    render(
      <UrgentActionCards
        urgentData={URGENT_ACTIONS}
        onSelectFilter={vi.fn()}
        onNavigateToProfiles={vi.fn()}
        onSelectStallCode={vi.fn()}
      />
    );

    expect(screen.getByText(/Mức 1/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Mức 2 • Cảnh báo hạ tầng & cống rác/i }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: /Mức 3 • Hạn thuê sạp/i }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: /Mức 4 • Hồ sơ thẩm định/i }).getAttribute('aria-expanded')).toBe('false');
  });

  it('makes the level-one complaint card keyboard operable without breaking stall links', () => {
    const onSelectFilter = vi.fn();
    const onSelectStallCode = vi.fn();

    render(
      <UrgentActionCards
        urgentData={URGENT_ACTIONS}
        onSelectFilter={onSelectFilter}
        onNavigateToProfiles={vi.fn()}
        onSelectStallCode={onSelectStallCode}
      />
    );

    const complaintCard = screen.getByRole('button', { name: /Mức 1.*Phản ánh khẩn cấp/i });
    fireEvent.keyDown(complaintCard, { key: 'Enter' });
    fireEvent.keyDown(complaintCard, { key: ' ' });

    expect(onSelectFilter).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: 'A12' }));

    expect(onSelectStallCode).toHaveBeenCalledWith('A12');
    expect(onSelectFilter).toHaveBeenCalledTimes(2);
  });

  it('does not render no-op area-alert buttons when no area callback is provided', () => {
    render(
      <UrgentActionCards
        urgentData={URGENT_ACTIONS}
        onSelectFilter={vi.fn()}
        onNavigateToProfiles={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Mức 2 • Cảnh báo hạ tầng & cống rác/i }));

    expect(screen.getByText('Cống phía Đông').closest('button')).toBeNull();
  });

  it('keeps area-alert locations interactive and named when a callback is provided', () => {
    const onSelectAreaAlert = vi.fn();

    render(
      <UrgentActionCards
        urgentData={URGENT_ACTIONS}
        onSelectFilter={vi.fn()}
        onSelectAreaAlert={onSelectAreaAlert}
        onNavigateToProfiles={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Mức 2 • Cảnh báo hạ tầng & cống rác/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cống phía Đông.*7 ca/i }));

    expect(onSelectAreaAlert).toHaveBeenCalledWith(URGENT_ACTIONS.areaAlerts.locations[0]);
  });

  it('keeps all five quick filters available and exposes pressed state', () => {
    render(
      <InlineOverviewBar
        activeFilter="complaint"
        onFilterChange={vi.fn()}
        selectedCategory="all"
        onCategoryChange={vi.fn()}
        counts={{
          all: 160,
          complaint: 12,
          expiring: 9,
          maintenance: 4,
          empty: 18,
        }}
      />
    );

    const expectedFilters = [
      'all',
      'complaint',
      'expiring',
      'maintenance',
      'empty',
    ];

    for (const filterId of expectedFilters) {
      expect(screen.getByTestId(`quick-filter-${filterId}`)).toBeDefined();
    }

    expect(screen.getByRole('button', { name: /Phản ánh khẩn cấp/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Tất cả sạp/i }).getAttribute('aria-pressed')).toBe('false');
  });

  it('scopes narrow-width overflow to an internal quick-filter region', () => {
    render(
      <InlineOverviewBar
        activeFilter="all"
        onFilterChange={vi.fn()}
        selectedCategory="all"
        onCategoryChange={vi.fn()}
        counts={{
          all: 160,
          complaint: 12,
          expiring: 9,
          maintenance: 4,
          empty: 18,
        }}
      />
    );

    expect(screen.getByTestId('quick-filter-scroll-region').getAttribute('aria-label')).toBe('Bộ lọc nhanh theo trạng thái sạp');
  });

  it('keeps fee and profile layouts mobile-first without hiding operational actions', () => {
    const { container } = render(
      <>
        <MarketFeeCollectionSection />
        <PendingProfilesView onBackToMap={vi.fn()} />
      </>
    );

    expect(screen.getByRole('button', { name: /Xuất báo cáo/i })).toBeDefined();
    expect(screen.getByTestId('fee-summary-grid').className).toContain('grid-cols-1');
    expect(screen.getByTestId('pending-profile-grid').className).toContain('grid-cols-1');
    expect(container.querySelectorAll('.min-h-11').length).toBeGreaterThanOrEqual(4);
  });

  it('uses operational summary counts as the profile source of truth', () => {
    render(<PendingProfilesView onBackToMap={vi.fn()} />);

    expect(screen.getByText(/Tổng cộng có/i).textContent).toContain(String(URGENT_ACTIONS.pendingProfiles.totalPending));
    expect(screen.getByRole('button', { name: new RegExp(`Tất cả \\(${URGENT_ACTIONS.pendingProfiles.totalPending}\\)`) })).toBeDefined();
    expect(screen.getByRole('button', { name: new RegExp(`Quá hạn \\(${URGENT_ACTIONS.pendingProfiles.overdue}\\)`) })).toBeDefined();
    expect(screen.getByRole('button', { name: new RegExp(`Đang xử lý \\(${URGENT_ACTIONS.pendingProfiles.totalPending - URGENT_ACTIONS.pendingProfiles.overdue}\\)`) })).toBeDefined();
    expect(screen.getByText(/Đang hiển thị 4 hồ sơ mẫu/i)).toBeDefined();
  });

  it('labels uncollected fees without treating the same amount as overdue debt', () => {
    render(<MarketFeeCollectionSection />);

    expect(screen.getByText(/Tổng chưa thu \(14 sạp\)/i)).toBeDefined();
    expect(screen.getByText(/Nợ phí quá hạn \(4 sạp\)/i)).toBeDefined();
  });
});
