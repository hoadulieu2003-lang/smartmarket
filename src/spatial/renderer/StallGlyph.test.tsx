import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { StallGlyph } from './StallGlyph';
import type { StallEntity } from '../model/types';

describe('STALL GLYPH SVG COMPONENT (PHASE 3B.2.1)', () => {
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

  it('renders Normal state with quiet appearance and no badge', () => {
    const { container } = render(
      <svg>
        <StallGlyph stall={baseStall} />
      </svg>
    );

    const group = container.querySelector('#stall-stall_A12');
    expect(group).not.toBeNull();
    expect(group?.getAttribute('data-state')).toBe('normal');
    expect(container.textContent).toContain('A12');
    expect(container.textContent).toContain('Hải Sản Quản');
  });

  it('renders Complaint state with alert badge and red theme', () => {
    const complaintStall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        complaintsCount: 3,
        issues: [
          {
            id: 'iss_01',
            type: 'complaint',
            title: 'Mùi cống rãnh',
            severity: 'critical',
            status: 'open',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A12' },
          },
        ],
      },
    };

    const { container } = render(
      <svg>
        <StallGlyph stall={complaintStall} />
      </svg>
    );

    const group = container.querySelector('#stall-stall_A12');
    expect(group?.getAttribute('data-state')).toBe('complaint');
    expect(container.textContent).toContain('● Khẩn cấp');
    expect(container.textContent).toContain('3 vấn đề');
  });

  it('renders Multi-status with Primary Complaint badge and Secondary Expiring badge', () => {
    const multiStall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        complaintsCount: 3,
        contractDaysLeft: 12,
        issues: [
          {
            id: 'iss_01',
            type: 'complaint',
            title: 'Phản ánh mùi',
            severity: 'critical',
            status: 'open',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A12' },
          },
          {
            id: 'iss_02',
            type: 'contract_expiry',
            title: 'Hạn HĐ',
            severity: 'medium',
            status: 'open',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A12' },
          },
        ],
      },
    };

    const { container } = render(
      <svg>
        <StallGlyph stall={multiStall} />
      </svg>
    );

    // Primary badge
    expect(container.textContent).toContain('● Khẩn cấp');
    // Secondary badge
    expect(container.textContent).toContain('HĐ 12n');
  });

  it('renders Selected state with Smart Market Green #076C31 ring', () => {
    const { container } = render(
      <svg>
        <StallGlyph stall={baseStall} isSelected={true} />
      </svg>
    );

    const group = container.querySelector('#stall-stall_A12');
    expect(group?.getAttribute('data-selected')).toBe('true');

    // Check presence of green focus ring
    const selectionRing = container.querySelector('rect[stroke="#076C31"]');
    expect(selectionRing).not.toBeNull();
  });

  it('triggers onSelect when clicked or when pressing Enter/Space', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <svg>
        <StallGlyph stall={baseStall} onSelect={onSelect} />
      </svg>
    );

    const group = container.querySelector('#stall-stall_A12')!;
    
    // 1. Mouse Click
    fireEvent.click(group);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(baseStall);

    // 2. Keyboard Enter
    fireEvent.keyDown(group, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(2);

    // 3. Keyboard Space
    fireEvent.keyDown(group, { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(3);
  });
});
