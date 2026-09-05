import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { isStallMatchingDuty } from '@/types/stallVisual';
import { deriveStallVisual } from '@/spatial/presentation/stallVisualAdapter';
import { StallGlyph } from '@/spatial/renderer/StallGlyph';
import type { StallEntity } from '@/spatial/model/types';

describe('DUTY VIEWS INTEGRATION SUITE ($dev + $design)', () => {
  const sampleWaterStall: StallEntity = {
    id: 'stall_water_01',
    code: 'A12',
    floorId: 'floor_1',
    zoneId: 'zone_A',
    geometry: { type: 'rectangle', x: 100, y: 100, width: 60, height: 40 },
    boundingBox: { minX: 100, minY: 100, maxX: 160, maxY: 140, width: 60, height: 40 },
    state: {
      occupancyStatus: 'active',
      isOccupied: true,
      isUnderMaintenance: false,
      hasActiveIssues: true,
      complaintsCount: 2,
      hasCriticalComplaint: true,
      contractDaysLeft: 120,
      isExpiringSoon: false,
      isCriticalExpiry: false,
      feeStatus: 'paid',
      overdueAmount: '',
      issues: [
        {
          id: 'iss_water',
          type: 'complaint',
          priority: 'P0',
          title: 'Nước tràn cống xả cá',
          specificType: 'water',
          status: 'open',
        } as any,
      ],
      tags: [],
    },
    metadata: {
      name: 'Hải Sản Biển Đông',
      category: 'Thực phẩm tươi sống',
    },
  } as unknown as StallEntity;

  const sampleFireStall: StallEntity = {
    id: 'stall_fire_01',
    code: 'E08',
    floorId: 'floor_1',
    zoneId: 'zone_E',
    geometry: { type: 'rectangle', x: 200, y: 100, width: 60, height: 40 },
    boundingBox: { minX: 200, minY: 100, maxX: 260, maxY: 140, width: 60, height: 40 },
    state: {
      occupancyStatus: 'active',
      isOccupied: true,
      isUnderMaintenance: false,
      hasActiveIssues: true,
      complaintsCount: 1,
      hasCriticalComplaint: true,
      contractDaysLeft: 90,
      isExpiringSoon: false,
      isCriticalExpiry: false,
      feeStatus: 'paid',
      overdueAmount: '',
      issues: [
        {
          id: 'iss_fire',
          type: 'complaint',
          priority: 'P0',
          title: 'Bình gas mini rò rỉ quán lẩu',
          specificType: 'fire_safety',
          status: 'open',
        } as any,
      ],
      tags: [],
    },
    metadata: {
      name: 'Lẩu Ếch Đồng',
      category: 'Ẩm thực',
    },
  } as unknown as StallEntity;

  const sampleFinanceStall: StallEntity = {
    id: 'stall_fin_01',
    code: 'B03',
    floorId: 'floor_1',
    zoneId: 'zone_B',
    geometry: { type: 'rectangle', x: 300, y: 100, width: 60, height: 40 },
    boundingBox: { minX: 300, minY: 100, maxX: 360, maxY: 140, width: 60, height: 40 },
    state: {
      occupancyStatus: 'active',
      isOccupied: true,
      isUnderMaintenance: false,
      hasActiveIssues: true,
      complaintsCount: 0,
      hasCriticalComplaint: false,
      contractDaysLeft: 12,
      isExpiringSoon: true,
      isCriticalExpiry: false,
      feeStatus: 'overdue',
      overdueAmount: '3.500.000đ',
      issues: [
        {
          id: 'iss_exp',
          type: 'contract_expiry',
          priority: 'P2',
          title: 'Hợp đồng sắp hết hạn',
          specificType: 'contract_expiry',
          status: 'open',
        } as any,
      ],
      tags: [],
    },
    metadata: {
      name: 'Rau Sạch Đà Lạt',
      category: 'Rau củ quả',
    },
  } as unknown as StallEntity;

  it('1. isStallMatchingDuty identifies stalls accurately by domain specificType and state', () => {
    expect(isStallMatchingDuty(sampleWaterStall, 'sanitation')).toBe(true);
    expect(isStallMatchingDuty(sampleFireStall, 'sanitation')).toBe(false);
    expect(isStallMatchingDuty(sampleFinanceStall, 'sanitation')).toBe(false);

    expect(isStallMatchingDuty(sampleFireStall, 'security_fire')).toBe(true);
    expect(isStallMatchingDuty(sampleWaterStall, 'security_fire')).toBe(false);

    expect(isStallMatchingDuty(sampleFinanceStall, 'finance')).toBe(true);
    expect(isStallMatchingDuty(sampleWaterStall, 'finance')).toBe(false);

    expect(isStallMatchingDuty(sampleWaterStall, 'all')).toBe(true);
    expect(isStallMatchingDuty(sampleFireStall, 'all')).toBe(true);
    expect(isStallMatchingDuty(sampleFinanceStall, 'all')).toBe(true);
  });

  it('2. deriveStallVisual produces appropriate dutyBadge tokens and dims non-duty stalls', () => {
    // Ca Vệ Sinh
    const waterSanitation = deriveStallVisual(sampleWaterStall, { dutyView: 'sanitation' });
    const fireSanitation = deriveStallVisual(sampleFireStall, { dutyView: 'sanitation' });

    expect(waterSanitation.isDimmed).toBe(false);
    expect(waterSanitation.dutyBadge?.duty).toBe('sanitation');
    expect(waterSanitation.dutyBadge?.label).toBe('Vệ sinh / Nước');
    expect(fireSanitation.isDimmed).toBe(true);

    // Ca An Ninh/PCCC
    const fireSecurity = deriveStallVisual(sampleFireStall, { dutyView: 'security_fire' });
    expect(fireSecurity.isDimmed).toBe(false);
    expect(fireSecurity.dutyBadge?.duty).toBe('security_fire');
    expect(fireSecurity.dutyBadge?.label).toBe('PCCC / An ninh');

    // Ca Thu Phí
    const finDuty = deriveStallVisual(sampleFinanceStall, { dutyView: 'finance' });
    expect(finDuty.isDimmed).toBe(false);
    expect(finDuty.dutyBadge?.duty).toBe('finance');
    expect(finDuty.dutyBadge?.label).toBe('Hạn nợ / Hợp đồng');
  });

  it('3. StallGlyph renders SVG with dutyBadge when in duty shift', () => {
    const { container } = render(
      <svg>
        <StallGlyph stall={sampleWaterStall} dutyView="sanitation" isSelected={false} />
      </svg>
    );

    expect(screen.getByText('Vệ sinh / Nước')).toBeDefined();
    const glyph = container.querySelector('[data-testid="stall-glyph-A12"]');
    expect(glyph?.getAttribute('opacity')).toBe('1');
  });

  it('4. StallGlyph dims out-of-duty stall with calibrated 0.30 opacity', () => {
    const { container } = render(
      <svg>
        <StallGlyph stall={sampleFireStall} dutyView="sanitation" isSelected={false} />
      </svg>
    );

    const glyph = container.querySelector('[data-testid="stall-glyph-E08"]');
    expect(glyph?.getAttribute('data-dimmed')).toBe('true');
    expect(glyph?.getAttribute('opacity')).toBe('0.3');
  });
});
