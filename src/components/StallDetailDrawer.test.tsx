import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StallDetailDrawer from './StallDetailDrawer';
import type { OperationalIssue, StallEntity } from '../spatial/model/types';

describe('PHASE 5 — DECISION PANEL COMPONENT TESTS', () => {
  const baseStall: StallEntity = {
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
      hasActiveIssues: false,
      complaintsCount: 0,
      hasCriticalComplaint: false,
      contractDaysLeft: 365,
      isExpiringSoon: false,
      isCriticalExpiry: false,
      feeStatus: 'paid',
      overdueAmount: '',
      issues: [],
      tags: [],
    },
  };

  it('renders as a full-width mobile panel with a bounded readable desktop width', () => {
    const { container } = render(
      <StallDetailDrawer stall={baseStall} onClose={vi.fn()} />
    );

    const panel = container.querySelector('#decision-panel-drawer');
    expect(panel).not.toBeNull();
    expect(panel?.className).toContain('w-full');
    expect(panel?.className).toContain('sm:w-[min(420px,calc(100vw-32px))]');
    expect(panel?.className).toContain('overflow-hidden');
  });

  it('exposes a labelled modal dialog and accessible close controls', () => {
    render(<StallDetailDrawer stall={baseStall} onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: /SẠP A12/i });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getAllByRole('button', { name: /Đóng bảng chi tiết/i }).length).toBeGreaterThan(0);
  });

  it('closes the decision panel when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<StallDetailDrawer stall={baseStall} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not expose structural issue-status emoji in drawer text', () => {
    const p0Stall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        complaintsCount: 1,
        issues: [
          {
            id: 'iss_p0',
            type: 'water',
            title: 'Tràn nước cống rãnh',
            severity: 'critical',
            status: 'open',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A12' },
          } satisfies OperationalIssue,
        ],
      },
    };

    render(<StallDetailDrawer stall={p0Stall} onClose={vi.fn()} />);

    expect(screen.getByTestId('decision-panel').textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it('renders all 6 standardized operational sections', () => {
    render(<StallDetailDrawer stall={baseStall} onClose={vi.fn()} />);

    // Section 1
    expect(screen.getByText(/1\. Mã Sạp & Mức Ưu Tiên/i)).toBeDefined();
    expect(screen.getAllByText(/SẠP A12/i).length).toBeGreaterThanOrEqual(1);

    // Section 2
    expect(screen.getByText(/2\. Thông tin Tiểu thương/i)).toBeDefined();
    expect(screen.getAllByText(/Trần Văn Hùng/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/0901234567/i)).toBeDefined();

    // Section 3
    expect(screen.getByText(/3\. Các Vấn Đề Hiện Tại/i)).toBeDefined();

    // Section 4
    expect(screen.getByText(/4\. Người Xử Lý & Deadline/i)).toBeDefined();

    // Section 5
    expect(screen.getByText(/5\. Lịch Sử Gần Nhất/i)).toBeDefined();

    // Section 6 Action Button (Normal stall: Xem Lịch Sử Sạp)
    expect(screen.getByRole('button', { name: /Xem Lịch Sử Sạp/i })).toBeDefined();
  });

  it('adapts Dynamic Primary Action to P0 complaint ("Giao Xử Lý Ngay" + "Xem phản ánh")', () => {
    const p0Stall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        complaintsCount: 1,
        issues: [
          {
            id: 'iss_p0',
            type: 'complaint',
            title: 'Tràn nước cống rãnh',
            severity: 'critical',
            status: 'open',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A12' },
          } satisfies OperationalIssue,
        ],
      },
    };

    const onQuickDispatch = vi.fn();
    const onViewComplaints = vi.fn();

    render(
      <StallDetailDrawer
        stall={p0Stall}
        onClose={vi.fn()}
        onQuickDispatch={onQuickDispatch}
        onViewComplaints={onViewComplaints}
      />
    );

    // Primary action: Giao Xử Lý Ngay
    const primaryBtn = screen.getByRole('button', { name: /Giao Xử Lý Ngay/i });
    expect(primaryBtn).toBeDefined();
    expect(primaryBtn.className).toContain('min-h-[44px]');
    expect(primaryBtn.className).toContain('bg-rose-600');

    // Secondary action: Xem phản ánh
    const secondaryBtn = screen.getByRole('button', { name: /Xem phản ánh/i });
    expect(secondaryBtn).toBeDefined();

    // Trigger primary action
    fireEvent.click(primaryBtn);
    expect(onQuickDispatch).toHaveBeenCalled();

    // Trigger secondary action
    fireEvent.click(secondaryBtn);
    expect(onViewComplaints).toHaveBeenCalled();
  });

  it('adapts Dynamic Primary Action to Expiring contract ("Gia Hạn Hợp Đồng Ngay")', () => {
    const expiringStall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        contractDaysLeft: 12,
        isExpiringSoon: true,
      },
    };

    const onExtendContract = vi.fn();

    render(
      <StallDetailDrawer
        stall={expiringStall}
        onClose={vi.fn()}
        onExtendContract={onExtendContract}
      />
    );

    const primaryBtn = screen.getByRole('button', { name: /Gia Hạn Hợp Đồng Ngay/i });
    expect(primaryBtn).toBeDefined();
    expect(primaryBtn.className).toContain('min-h-[44px]');

    fireEvent.click(primaryBtn);
    expect(onExtendContract).toHaveBeenCalled();
  });

  it('adapts Dynamic Primary Action to Fee Pending ("Ghi Nhận Thu Phí")', () => {
    const feeStall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        feeStatus: 'overdue',
      },
    };

    const onCollectFee = vi.fn();

    render(
      <StallDetailDrawer
        stall={feeStall}
        onClose={vi.fn()}
        onCollectFee={onCollectFee}
      />
    );

    const primaryBtn = screen.getByRole('button', { name: /Ghi Nhận Thu Phí/i });
    expect(primaryBtn).toBeDefined();
    expect(primaryBtn.className).toContain('min-h-[44px]');

    fireEvent.click(primaryBtn);
    expect(onCollectFee).toHaveBeenCalled();
  });

  it('triggers onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<StallDetailDrawer stall={baseStall} onClose={onClose} />);

    const closeBtn = screen.getByTitle('Đóng bảng chi tiết');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
