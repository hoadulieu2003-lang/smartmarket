import { describe, expect, it } from 'vitest';
import {
  LIVE_FLOOR_DONG_XUAN,
  LIVE_MARKET_METADATA,
  LIVE_ZONES,
  LIVE_STALLS,
} from './liveMarketFixture';
import { deriveStallVisual } from '../presentation/stallVisualAdapter';

describe('Live Market Fixture — Chợ Đồng Xuân (Demo Live)', () => {
  it('conforms to Canonical Spatial Schema 3.2.0 with standard 1200x800 coordinates', () => {
    expect(LIVE_FLOOR_DONG_XUAN.schemaVersion).toBe('3.2.0');
    expect(LIVE_FLOOR_DONG_XUAN.coordinateSystem.width).toBe(1200);
    expect(LIVE_FLOOR_DONG_XUAN.coordinateSystem.height).toBe(800);
    expect(LIVE_FLOOR_DONG_XUAN.boundary.type).toBe('polygon');
    expect(LIVE_FLOOR_DONG_XUAN.backgroundImage).toBe('/maps/cho-dx-hn-map.svg');
  });

  it('contains exactly 50 stalls and 5 operational zones from production API', () => {
    expect(LIVE_STALLS.length).toBe(50);
    expect(LIVE_ZONES.length).toBe(5);
    expect(LIVE_MARKET_METADATA.totalStalls).toBe(50);
    expect(LIVE_MARKET_METADATA.code).toBe('CHO-DX-HN');
  });

  it('ensures every stall is bound to a valid zone and has positive geometry within canvas', () => {
    const validZoneIds = new Set(LIVE_ZONES.map((z) => z.id));

    LIVE_STALLS.forEach((stall) => {
      expect(validZoneIds.has(stall.zoneId)).toBe(true);
      expect(stall.geometry.type).toBe('rectangle');

      if (stall.geometry.type === 'rectangle') {
        expect(stall.geometry.x).toBeGreaterThanOrEqual(0);
        expect(stall.geometry.x + stall.geometry.width).toBeLessThanOrEqual(1200);
        expect(stall.geometry.y).toBeGreaterThanOrEqual(0);
        expect(stall.geometry.y + stall.geometry.height).toBeLessThanOrEqual(800);
        expect(stall.geometry.width).toBeGreaterThan(0);
        expect(stall.geometry.height).toBeGreaterThan(0);
      }
    });
  });

  it('correctly maps 15 stalls with active PAKN complaints to P0 priority', () => {
    const complaintStalls = LIVE_STALLS.filter(
      (s) => s.state.hasActiveIssues && s.state.issues.some((i) => (i as any).priority === 'P0')
    );
    expect(complaintStalls.length).toBe(15);

    // Verify deriveStallVisual produces alert_high visual weight and complaint badge
    const sampleComplaintStall = complaintStalls[0];
    const visual = deriveStallVisual(sampleComplaintStall, { selected: false });
    expect(visual.visualWeight).toBe('alert_high');
    expect(visual.primaryBadge?.type).toBe('complaint');
    expect(visual.priority).toBe('urgent');
  });

  it('correctly categorizes vacant stalls as empty state', () => {
    const emptyStalls = LIVE_STALLS.filter((s) => s.state.occupancyStatus === 'empty');
    expect(emptyStalls.length).toBe(21);

    const sampleEmpty = emptyStalls[0];
    const visual = deriveStallVisual(sampleEmpty, { selected: false });
    expect(visual.visualWeight).toBe('muted');
    expect(visual.isDashed).toBe(true);
    expect(visual.primaryBadge?.type).toBe('empty');
  });
});
