import { describe, expect, it } from 'vitest';
import {
  FIXTURE_A_DONG_XUAN,
  FIXTURE_B_L_SHAPED_MARKET,
  FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET,
} from '../fixtures';
import { getMapPresentationLayout } from './mapLayout';

function assertRectangleContained(
  stallGeometry: ReturnType<typeof getMapPresentationLayout>['stalls'][string],
  zoneGeometry: ReturnType<typeof getMapPresentationLayout>['zones'][string],
) {
  expect(stallGeometry.type).toBe('rectangle');
  expect(zoneGeometry.type).toBe('rectangle');

  if (stallGeometry.type !== 'rectangle' || zoneGeometry.type !== 'rectangle') return;

  expect(stallGeometry.x).toBeGreaterThanOrEqual(zoneGeometry.x);
  expect(stallGeometry.y).toBeGreaterThanOrEqual(zoneGeometry.y);
  expect(stallGeometry.x + stallGeometry.width).toBeLessThanOrEqual(zoneGeometry.x + zoneGeometry.width);
  expect(stallGeometry.y + stallGeometry.height).toBeLessThanOrEqual(zoneGeometry.y + zoneGeometry.height);
}

describe('getMapPresentationLayout', () => {
  it('covers every canonical stall without mutating the fixture', () => {
    const source = structuredClone(FIXTURE_A_DONG_XUAN);
    const layout = getMapPresentationLayout(source);

    expect(Object.keys(layout.stalls)).toHaveLength(source.stalls.length);
    expect(source).toEqual(FIXTURE_A_DONG_XUAN);
  });

  it('keeps fixture-specific silhouettes while making demo anchors readable', () => {
    const a = getMapPresentationLayout(FIXTURE_A_DONG_XUAN);
    const b = getMapPresentationLayout(FIXTURE_B_L_SHAPED_MARKET);
    const c = getMapPresentationLayout(FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET);

    expect(a.zones.zone_A).toBeDefined();
    expect(a.stalls.stall_A12).toBeDefined();
    expect(b.boundary.vertices.length).toBeGreaterThanOrEqual(6);
    expect(c.aisles.aisle_bridge_skywalk).toBeDefined();
  });

  it('keeps each derived stall inside its derived zone bounds', () => {
    const layout = getMapPresentationLayout(FIXTURE_A_DONG_XUAN);

    Object.entries(layout.stalls).forEach(([stallId, geometry]) => {
      const stall = FIXTURE_A_DONG_XUAN.stalls.find((item) => item.id === stallId);
      const zone = stall && FIXTURE_A_DONG_XUAN.zones.find((item) => item.id === stall.zoneId);
      const zoneGeometry = zone && layout.zones[zone.id];

      expect(stall).toBeDefined();
      expect(zoneGeometry).toBeDefined();
      if (zoneGeometry) assertRectangleContained(geometry, zoneGeometry);
    });
  });

  it('falls back to canonical geometry for unknown floor ids', () => {
    const source = structuredClone(FIXTURE_B_L_SHAPED_MARKET);
    source.id = 'floor_unknown_demo';
    const layout = getMapPresentationLayout(source);

    expect(layout.stalls[source.stalls[0].id]).toEqual(source.stalls[0].geometry);
    expect(layout.boundary).toEqual(source.boundary);
  });
});
