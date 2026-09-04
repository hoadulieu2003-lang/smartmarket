import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StallDetailDrawer from './StallDetailDrawer';
import InMapQuickActionCard from './InMapQuickActionCard';
import { SvgSpatialRenderer } from '../spatial/renderer/SvgSpatialRenderer';
import { FIXTURE_A_DONG_XUAN } from '../spatial/fixtures';
import type { StallEntity } from '../spatial/model/types';

describe('TABLET & MOBILE FIELD INSPECTION RESPONSIVE MODE TESTS', () => {
  const sampleStall: StallEntity = {
    id: 'stall_A12',
    code: 'A12',
    floorId: 'floor_1',
    zoneId: 'zone_A',
    geometry: { type: 'rectangle', x: 200, y: 150, width: 80, height: 60 },
    boundingBox: { minX: 200, minY: 150, maxX: 280, maxY: 210, width: 80, height: 60 },
    metadata: {
      name: 'Hải Sản Quảng Ninh',
      merchantName: 'Trần Văn Hùng',
      phone: '0901234567',
      category: 'Thủy hải sản',
      areaM2: 8.0,
      monthlyEstimatedRevenue: '60.000.000đ',
      rating: 4.9,
      ratingCount: 150,
      qrPaymentActive: true,
    },
    state: {
      occupancyStatus: 'active',
      isOccupied: true,
      isUnderMaintenance: false,
      hasActiveIssues: true,
      complaintsCount: 1,
      hasCriticalComplaint: true,
      contractDaysLeft: 365,
      isExpiringSoon: false,
      isCriticalExpiry: false,
      feeStatus: 'paid',
      overdueAmount: '',
      issues: [
        {
          id: 'iss_1',
          type: 'water',
          title: 'Tràn nước cống rãnh sạp A12',
          severity: 'critical',
          status: 'open',
          createdAt: '2026-09-04T08:00:00Z',
          updatedAt: '2026-09-04T08:00:00Z',
          entityRef: { entityType: 'stall', entityId: 'stall_A12' },
        },
      ],
      tags: [],
    },
  };

  it('renders mobile backdrop and tactile drag handle pill in StallDetailDrawer', () => {
    const { container } = render(
      <StallDetailDrawer stall={sampleStall} onClose={vi.fn()} />
    );

    // Backdrop for mobile & tablet
    const backdrop = screen.getByTestId('drawer-backdrop');
    expect(backdrop).not.toBeNull();
    expect(backdrop.className).toContain('lg:hidden');

    // Tactile drag pill for touch feedback
    const dragPill = screen.getByTestId('drag-handle-pill');
    expect(dragPill).not.toBeNull();
    expect(dragPill.className).toContain('cursor-grab');
  });

  it('supports toggling between expanded and compact peek modes in StallDetailDrawer', () => {
    const { container } = render(
      <StallDetailDrawer stall={sampleStall} onClose={vi.fn()} />
    );

    const panel = container.querySelector('#decision-panel-drawer');
    expect(panel).not.toBeNull();
    expect(panel?.className).toContain('max-h-full');

    // Click toggle button to collapse to peek view
    const toggleBtn = screen.getByTestId('toggle-sheet-mode-btn');
    fireEvent.click(toggleBtn);

    // After collapse, max-h-[46vh] should be present for peek mode
    expect(panel?.className).toContain('max-h-[46vh]');

    // Click again to expand back to full mode
    fireEvent.click(toggleBtn);
    expect(panel?.className).toContain('max-h-full');
  });

  it('handles swipe down gestures on StallDetailDrawer to dismiss or collapse', () => {
    const onClose = vi.fn();
    const { container } = render(
      <StallDetailDrawer stall={sampleStall} onClose={onClose} />
    );

    const panel = container.querySelector('#decision-panel-drawer')!;

    // First swipe down: collapses from expanded to peek
    fireEvent.touchStart(panel, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(panel, { changedTouches: [{ clientY: 200 }] });

    expect(panel.className).toContain('max-h-[46vh]');

    // Second swipe down: closes the drawer
    fireEvent.touchStart(panel, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(panel, { changedTouches: [{ clientY: 200 }] });

    expect(onClose).toHaveBeenCalled();
  });

  it('renders InMapQuickActionCard with touch-accessible buttons >= 44px', () => {
    const onQuickDispatch = vi.fn();
    render(
      <InMapQuickActionCard
        stall={sampleStall}
        onClose={vi.fn()}
        onOpenDrawer={vi.fn()}
        onQuickDispatch={onQuickDispatch}
      />
    );

    const sanitationBtn = screen.getByRole('button', { name: /Tổ Vệ Sinh/i });
    expect(sanitationBtn.className).toContain('min-h-11');

    const securityBtn = screen.getByRole('button', { name: /Đội Bảo Vệ/i });
    expect(securityBtn.className).toContain('min-h-11');

    fireEvent.click(sanitationBtn);
    expect(onQuickDispatch).toHaveBeenCalledWith('stall_A12', 'Tổ Vệ Sinh Ca Sáng');
  });

  it('SvgSpatialRenderer supports touch gestures and sets touchAction: none', () => {
    const { container } = render(
      <SvgSpatialRenderer floor={FIXTURE_A_DONG_XUAN} />
    );

    const mapContainer = container.firstChild as HTMLElement;
    expect(mapContainer.style.touchAction).toBe('none');

    // Simulate touch pan
    fireEvent.touchStart(mapContainer, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchMove(mapContainer, {
      touches: [{ clientX: 150, clientY: 120 }],
    });
    fireEvent.touchEnd(mapContainer);

    // Map container remains stable and ready
    expect(mapContainer).not.toBeNull();
  });
});
