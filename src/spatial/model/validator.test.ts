import { describe, it, expect } from 'vitest';
import { validateFloorDataset, validateMarketDataset } from './validator';
import { SAMPLE_FLOOR_1_DATA, SAMPLE_MARKET_DATA } from './sampleFloorData';
import { 
  FIXTURE_A_DONG_XUAN, 
  FIXTURE_B_L_SHAPED_MARKET, 
  FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET, 
  ALL_CANONICAL_FIXTURES 
} from '../fixtures';

describe('CANONICAL SPATIAL MODEL 3.2.0 VALIDATION SUITE', () => {
  it('should validate Canonical Floor 1 Dataset without errors', () => {
    const report = validateFloorDataset(SAMPLE_FLOOR_1_DATA);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.stats.totalEntities).toBeGreaterThan(0);
    expect(report.stats.stallsCount).toBeGreaterThan(0);
    expect(report.stats.zonesCount).toBe(3);
    expect(report.stats.totalOperationalIssues).toBeGreaterThan(0);
  });

  it('should validate Canonical Market Dataset without errors', () => {
    const report = validateMarketDataset(SAMPLE_MARKET_DATA);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('should validate all 3 real-world market fixtures (Fixture A, B, C)', () => {
    Object.entries(ALL_CANONICAL_FIXTURES).forEach(([key, floor]) => {
      const report = validateFloorDataset(floor);
      expect(report.isValid, `Fixture ${key} should be valid`).toBe(true);
      expect(report.errors).toHaveLength(0);
    });
  });

  it('should validate MEGA_FLOOR_DONG_XUAN (160 stalls, 5 zones) with zero errors', async () => {
    const { MEGA_FLOOR_DONG_XUAN } = await import('../../data/megaMarketData');
    const report = validateFloorDataset(MEGA_FLOOR_DONG_XUAN);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.stats.stallsCount).toBe(160);
    expect(report.stats.zonesCount).toBe(5);
  });

  it('should catch Duplicate Entity ID error (Negative Test)', () => {
    const dupFloor = {
      ...SAMPLE_FLOOR_1_DATA,
      stalls: [
        ...SAMPLE_FLOOR_1_DATA.stalls,
        { ...SAMPLE_FLOOR_1_DATA.stalls[0], id: 'stall_A01' }
      ]
    };
    const report = validateFloorDataset(dupFloor);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.code === 'DUPLICATE_ENTITY_ID')).toBe(true);
  });

  it('should catch Dangling Zone Reference error (Negative Test)', () => {
    const danglingFloor = {
      ...SAMPLE_FLOOR_1_DATA,
      stalls: [
        { ...SAMPLE_FLOOR_1_DATA.stalls[0], id: 'stall_ghost', zoneId: 'zone_non_existent' }
      ]
    };
    const report = validateFloorDataset(danglingFloor);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.code === 'DANGLING_ZONE_REFERENCE')).toBe(true);
  });

  it('should catch Polygon with insufficient vertices (Negative Test)', () => {
    const polyFloor = {
      ...SAMPLE_FLOOR_1_DATA,
      stalls: [
        { 
          ...SAMPLE_FLOOR_1_DATA.stalls[0], 
          id: 'stall_bad_poly', 
          geometry: { type: 'polygon' as const, vertices: [[100, 100], [200, 200]] as [number, number][] } 
        }
      ]
    };
    const report = validateFloorDataset(polyFloor as any);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.code === 'POLY_INSUFFICIENT_VERTICES')).toBe(true);
  });
});
