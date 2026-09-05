import { describe, it, expect } from 'vitest';
import { getStallVisualTokens, deriveStallVisual } from './stallVisualAdapter';
import type { StallEntity } from '../model/types';

describe('STALL VISUAL ADAPTER — TDD SPECIFICATION (PHASE 3B.2.1)', () => {
  const baseStall: StallEntity = {
    id: 'stall_A01',
    code: 'A01',
    floorId: 'floor_1',
    zoneId: 'zone_A',
    geometry: { type: 'rectangle', x: 100, y: 100, width: 60, height: 40 },
    boundingBox: { minX: 100, minY: 100, maxX: 160, maxY: 140, width: 60, height: 40 },
    metadata: {
      name: 'Thực Phẩm Sạch Mai Anh',
      merchantName: 'Nguyễn Thị Mai',
      phone: '0901234567',
      category: 'Thực phẩm tươi sống',
      areaM2: 6.0,
      monthlyEstimatedRevenue: '45.000.000đ',
      rating: 4.8,
      ratingCount: 120,
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

  it('1. NORMAL STATE: Quiet by default, no operational badge', () => {
    const tokens = getStallVisualTokens(baseStall);
    expect(tokens.theme).toBe('normal');
    expect(tokens.visualWeight).toBe('quiet');
    expect(tokens.primaryBadge).toBeNull();
    expect(tokens.secondaryBadge).toBeNull();
    expect(tokens.hasHatchPattern).toBe(false);
    expect(tokens.isDashed).toBe(false);
  });

  it('2. COMPLAINT STATE (P0): Critical rose theme, prominent pulsing badge', () => {
    const complaintStall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        complaintsCount: 3,
        issues: [
          {
            id: 'iss_01',
            type: 'complaint',
            title: 'Mùi hôi cống thoát nước',
            severity: 'critical',
            status: 'open',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A01' },
          },
        ],
      },
    };

    const tokens = getStallVisualTokens(complaintStall);
    expect(tokens.theme).toBe('complaint');
    expect(tokens.visualWeight).toBe('alert_high');
    expect(tokens.primaryBadge).not.toBeNull();
    expect(tokens.primaryBadge?.type).toBe('complaint');
    expect(tokens.primaryBadge?.tone).toBe('critical_red');
    expect(tokens.primaryBadge?.count).toBe(3);
    expect(tokens.primaryBadge?.isPulsing).toBe(true);
  });

  it('3. EXPIRING STATE (P2): Warning amber theme, moderate visual weight', () => {
    const expiringStall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        contractDaysLeft: 12,
        isExpiringSoon: true,
        issues: [
          {
            id: 'iss_02',
            type: 'contract_expiry',
            title: 'Hợp đồng sắp hết hạn',
            severity: 'medium',
            status: 'open',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A01' },
          },
        ],
      },
    };

    const tokens = getStallVisualTokens(expiringStall);
    expect(tokens.theme).toBe('expiring');
    expect(tokens.visualWeight).toBe('warning_medium');
    expect(tokens.primaryBadge).not.toBeNull();
    expect(tokens.primaryBadge?.type).toBe('expiring');
    expect(tokens.primaryBadge?.tone).toBe('warning_amber');
    expect(tokens.primaryBadge?.label).toContain('12');
  });

  it('4. MULTI-STATUS (P0 Complaint + P2 Expiring): P0 wins theme, P2 becomes secondary sub-badge', () => {
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
            title: 'Mùi hôi cống',
            severity: 'critical',
            status: 'open',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A01' },
          },
          {
            id: 'iss_02',
            type: 'contract_expiry',
            title: 'Hợp đồng sắp hết hạn',
            severity: 'medium',
            status: 'open',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A01' },
          },
        ],
      },
    };

    const tokens = getStallVisualTokens(multiStall);
    // Primary theme MUST be complaint (Rose), NOT split color
    expect(tokens.theme).toBe('complaint');
    expect(tokens.visualWeight).toBe('alert_high');
    expect(tokens.primaryBadge?.type).toBe('complaint');
    // Secondary badge MUST be expiring
    expect(tokens.secondaryBadge).not.toBeNull();
    expect(tokens.secondaryBadge?.type).toBe('expiring');
    expect(tokens.secondaryBadge?.label).toContain('12');
  });

  it('5. MAINTENANCE STATE: Technical hatch pattern, neutral tone', () => {
    const maintenanceStall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        isUnderMaintenance: true,
        issues: [
          {
            id: 'iss_03',
            type: 'maintenance',
            title: 'Sửa đường điện',
            severity: 'low',
            status: 'in_progress',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_A01' },
          },
        ],
      },
    };

    const tokens = getStallVisualTokens(maintenanceStall);
    expect(tokens.theme).toBe('maintenance');
    expect(tokens.hasHatchPattern).toBe(true);
    expect(tokens.primaryBadge?.type).toBe('maintenance');
  });

  it('6. EMPTY STATE: Dashed border, subtle ready-to-rent badge', () => {
    const emptyStall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        occupancyStatus: 'empty',
        isOccupied: false,
        issues: [],
      },
    };

    const tokens = getStallVisualTokens(emptyStall);
    expect(tokens.theme).toBe('empty');
    expect(tokens.isDashed).toBe(true);
    expect(tokens.primaryBadge?.type).toBe('empty');
  });

  it('7. SELECTED STATE: Smart Market Green #076C31 ring, does NOT mutate operational state', () => {
    const complaintStall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        complaintsCount: 2,
      },
    };

    const tokens = getStallVisualTokens(complaintStall, { isSelected: true });
    expect(tokens.isSelected).toBe(true);
    expect(tokens.selectionClasses).toContain('#076C31');
    // Operational theme and badges MUST stay intact
    expect(tokens.theme).toBe('complaint');
    expect(tokens.primaryBadge?.type).toBe('complaint');
  });

  it('8. IMMUTABILITY: Adapter must NEVER mutate the canonical stall input', () => {
    const frozenStall: any = Object.freeze({
      ...baseStall,
      state: Object.freeze({
        ...baseStall.state,
        complaintsCount: 1,
        issues: Object.freeze([
          Object.freeze({
            id: 'iss_01',
            type: 'complaint',
            title: 'Complaint',
            severity: 'critical' as const,
            status: 'open' as const,
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: Object.freeze({ entityType: 'stall', entityId: 'stall_A01' }),
          }),
        ]),
      }),
    });

    expect(() => getStallVisualTokens(frozenStall)).not.toThrow();
    expect(() => deriveStallVisual(frozenStall, { selected: true })).not.toThrow();
  });

  it('9. DETERMINISM: Same canonical input produces identical tokens', () => {
    const tokensA = getStallVisualTokens(baseStall, { isSelected: true });
    const tokensB = getStallVisualTokens(baseStall, { isSelected: true });
    expect(tokensA).toEqual(tokensB);
  });
});

describe('PHASE 4 — OPERATIONAL PRIORITY LAYER: 6 MANDATORY TEST CASES', () => {
  const baseStall: StallEntity = {
    id: 'stall_TEST_01',
    code: 'T01',
    floorId: 'floor_1',
    zoneId: 'zone_A',
    geometry: { type: 'rectangle', x: 100, y: 100, width: 60, height: 40 },
    boundingBox: { minX: 100, minY: 100, maxX: 160, maxY: 140, width: 60, height: 40 },
    metadata: {
      name: 'Gian Hàng Chuẩn',
      merchantName: 'Nguyễn Văn Test',
      phone: '0901234567',
      category: 'Hàng khô',
      areaM2: 6.0,
      monthlyEstimatedRevenue: '30.000.000đ',
      rating: 5.0,
      ratingCount: 10,
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

  it('Ca 1: Chỉ có phản ánh P0 -> priority "urgent", unifiedBadge "● P0", totalIssues = 1', () => {
    const stall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        complaintsCount: 1,
        issues: [
          {
            id: 'iss_p0',
            type: 'complaint',
            title: 'Tràn nước cống',
            severity: 'critical',
            status: 'open',
            priority: 'P0',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_TEST_01' },
          } as any,
        ],
      },
    };

    const visual = deriveStallVisual(stall);
    expect(visual.priority).toBe('urgent');
    expect(visual.unifiedBadge).not.toBeNull();
    expect(visual.unifiedBadge?.priorityLabel).toBe('● Khẩn cấp');
    expect(visual.unifiedBadge?.totalIssues).toBe(1);
    expect(visual.unifiedBadge?.badgeBg).toBe('#e11d48');
  });

  it('Ca 2: Chỉ sắp hết hợp đồng -> priority "attention", unifiedBadge "▲ Cần chú ý", totalIssues = 1', () => {
    const stall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        contractDaysLeft: 12,
        isExpiringSoon: true,
        issues: [
          {
            id: 'iss_contract',
            type: 'contract_expiry',
            title: 'Hạn hợp đồng 12 ngày',
            severity: 'medium',
            status: 'open',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_TEST_01' },
          },
        ],
      },
    };

    const visual = deriveStallVisual(stall);
    expect(visual.priority).toBe('attention');
    expect(visual.unifiedBadge).not.toBeNull();
    expect(visual.unifiedBadge?.priorityLabel).toBe('▲ Cần chú ý');
    expect(visual.unifiedBadge?.totalIssues).toBe(1);
    expect(visual.unifiedBadge?.badgeBg).toBe('#ea580c');
  });

  it('Ca 3: Có cả hai trạng thái cùng lúc -> P0 thắng thế (urgent), unifiedBadge "● P0", totalIssues = 2', () => {
    const stall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        complaintsCount: 1,
        contractDaysLeft: 5,
        isExpiringSoon: true,
        issues: [
          {
            id: 'iss_p0',
            type: 'complaint',
            title: 'Sự cố rò rỉ gas',
            severity: 'critical',
            status: 'open',
            priority: 'P0',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_TEST_01' },
          } as any,
          {
            id: 'iss_contract',
            type: 'contract_expiry',
            title: 'Hạn HĐ 5 ngày',
            severity: 'high',
            status: 'open',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_TEST_01' },
          },
        ],
      },
    };

    const visual = deriveStallVisual(stall);
    expect(visual.priority).toBe('urgent');
    expect(visual.unifiedBadge?.priorityLabel).toBe('● Khẩn cấp');
    expect(visual.unifiedBadge?.totalIssues).toBe(2);
    expect(visual.unifiedBadge?.badgeBg).toBe('#e11d48');
  });

  it('Ca 4: Có bảo trì nhưng không khẩn cấp -> priority "maintenance", unifiedBadge "🔧 Bảo trì", không dùng màu đỏ', () => {
    const stall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        isUnderMaintenance: true,
        issues: [
          {
            id: 'iss_maint',
            type: 'maintenance',
            title: 'Thay bóng đèn LED trần sạp',
            severity: 'low',
            status: 'in_progress',
            createdAt: '2026-09-03T08:00:00Z',
            updatedAt: '2026-09-03T08:00:00Z',
            entityRef: { entityType: 'stall', entityId: 'stall_TEST_01' },
          },
        ],
      },
    };

    const visual = deriveStallVisual(stall);
    expect(visual.priority).toBe('maintenance');
    expect(visual.unifiedBadge?.priorityLabel).toBe('🔧 Bảo trì');
    expect(visual.unifiedBadge?.badgeBg).toBe('#ca8a04');
    expect(visual.unifiedBadge?.badgeBg).not.toBe('#e11d48');
  });

  it('Ca 5: Phản ánh khu vực chung không gán vào sạp -> sạp vẫn priority "normal", Quiet by Default', () => {
    // Sạp bình thường, không có issue nào gắn entityRef vào sạp này
    const stall: StallEntity = {
      ...baseStall,
    };

    const visual = deriveStallVisual(stall);
    expect(visual.priority).toBe('normal');
    expect(visual.unifiedBadge).toBeNull();
  });

  it('Ca 6: Không có sự cố nào -> Quiet by Default, unifiedBadge is null, priority "normal"', () => {
    const stall: StallEntity = {
      ...baseStall,
      state: {
        ...baseStall.state,
        complaintsCount: 0,
        issues: [],
        contractDaysLeft: 180,
        isUnderMaintenance: false,
      },
    };

    const visual = deriveStallVisual(stall);
    expect(visual.priority).toBe('normal');
    expect(visual.unifiedBadge).toBeNull();
  });

  it('Operational Filter (Lọc P0): Làm mờ (isDimmed = true) các sạp không liên quan', () => {
    const normalStall = { ...baseStall };
    const p0Stall: StallEntity = {
      ...baseStall,
      id: 'stall_P0',
      code: 'A12',
      state: {
        ...baseStall.state,
        complaintsCount: 1,
        issues: [{ id: 'iss_p0', type: 'complaint', priority: 'P0', severity: 'critical', status: 'open' } as any],
      },
    };

    const normalVisual = deriveStallVisual(normalStall, { operationalFilter: 'p0' });
    const p0Visual = deriveStallVisual(p0Stall, { operationalFilter: 'p0' });

    expect(normalVisual.isDimmed).toBe(true);
    expect(p0Visual.isDimmed).toBe(false);
  });

  it('Duty View (Góc nhìn ca trực): Xác định sạp khớp và làm mờ các sạp ngoài ca', () => {
    const waterStall: StallEntity = {
      ...baseStall,
      id: 'stall_water',
      code: 'A12',
      state: {
        ...baseStall.state,
        issues: [{ id: 'iss_w', type: 'complaint', specificType: 'water', title: 'Rò rỉ nước', status: 'open' } as any],
      },
    };

    const fireStall: StallEntity = {
      ...baseStall,
      id: 'stall_fire',
      code: 'E08',
      state: {
        ...baseStall.state,
        issues: [{ id: 'iss_f', type: 'complaint', specificType: 'fire_safety', title: 'Bình gas rò rỉ', status: 'open' } as any],
      },
    };

    const financeStall: StallEntity = {
      ...baseStall,
      id: 'stall_finance',
      code: 'C08',
      state: {
        ...baseStall.state,
        feeStatus: 'overdue',
        contractDaysLeft: 10,
        issues: [],
      },
    };

    // 1. Ca Vệ Sinh
    const waterSanitationVisual = deriveStallVisual(waterStall, { dutyView: 'sanitation' });
    const fireSanitationVisual = deriveStallVisual(fireStall, { dutyView: 'sanitation' });
    expect(waterSanitationVisual.isDimmed).toBe(false);
    expect(waterSanitationVisual.dutyBadge?.duty).toBe('sanitation');
    expect(waterSanitationVisual.dutyBadge?.iconName).toBe('Droplets');
    expect(fireSanitationVisual.isDimmed).toBe(true);

    // 2. Ca An Ninh / PCCC
    const fireSecurityVisual = deriveStallVisual(fireStall, { dutyView: 'security_fire' });
    const financeSecurityVisual = deriveStallVisual(financeStall, { dutyView: 'security_fire' });
    expect(fireSecurityVisual.isDimmed).toBe(false);
    expect(fireSecurityVisual.dutyBadge?.duty).toBe('security_fire');
    expect(fireSecurityVisual.dutyBadge?.iconName).toBe('Flame');
    expect(financeSecurityVisual.isDimmed).toBe(true);

    // 3. Ca Thu Phí
    const financeViewVisual = deriveStallVisual(financeStall, { dutyView: 'finance' });
    expect(financeViewVisual.isDimmed).toBe(false);
    expect(financeViewVisual.dutyBadge?.duty).toBe('finance');
    expect(financeViewVisual.dutyBadge?.iconName).toBe('ReceiptText');

    // 4. Toàn cảnh ('all'): không làm mờ sạp nào
    const allVisual = deriveStallVisual(fireStall, { dutyView: 'all' });
    expect(allVisual.isDimmed).toBe(false);
    expect(allVisual.dutyBadge).toBeFalsy();
  });
});

