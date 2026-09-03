import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
