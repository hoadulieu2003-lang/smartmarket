import { describe, it, expect } from 'vitest';
import { 
  buildMegaFloorDongXuan, 
  ZONE_CONFIGS_OPTIMIZED, 
  ZONE_CONFIGS_STANDARD 
} from '@/data/megaMarketData';

describe('Map Display Flow: Larger Stall Units & Density Modes', () => {
  it('generates 160 stalls in both optimized and standard modes', () => {
    const floorOptimized = buildMegaFloorDongXuan('optimized');
    const floorStandard = buildMegaFloorDongXuan('standard');

    expect(floorOptimized.stalls).toHaveLength(160);
    expect(floorStandard.stalls).toHaveLength(160);
  });

  it('preserves all stall codes identically between modes', () => {
    const floorOptimized = buildMegaFloorDongXuan('optimized');
    const floorStandard = buildMegaFloorDongXuan('standard');

    const codesOpt = floorOptimized.stalls.map(s => s.code);
    const codesStd = floorStandard.stalls.map(s => s.code);

    expect(codesOpt).toEqual(codesStd);
  });

  it('uses enlarged dimensions in Zone A and B in optimized mode (90x72)', () => {
    const floor = buildMegaFloorDongXuan('optimized');
    const stallsA = floor.stalls.filter(s => s.code.startsWith('A'));
    const stallsB = floor.stalls.filter(s => s.code.startsWith('B'));

    expect(stallsA).toHaveLength(32);
    expect(stallsB).toHaveLength(32);

    stallsA.forEach(s => {
      expect((s.geometry as any).width).toBe(90);
      expect((s.geometry as any).height).toBe(72);
    });

    stallsB.forEach(s => {
      expect((s.geometry as any).width).toBe(90);
      expect((s.geometry as any).height).toBe(72);
    });
  });

  it('uses enlarged dimensions in Zone C, D, E in optimized mode (58x82)', () => {
    const floor = buildMegaFloorDongXuan('optimized');
    const stallsC = floor.stalls.filter(s => s.code.startsWith('C'));
    const stallsD = floor.stalls.filter(s => s.code.startsWith('D'));
    const stallsE = floor.stalls.filter(s => s.code.startsWith('E'));

    expect(stallsC).toHaveLength(32);
    expect(stallsD).toHaveLength(32);
    expect(stallsE).toHaveLength(32);

    stallsC.forEach(s => {
      expect((s.geometry as any).width).toBe(58);
      expect((s.geometry as any).height).toBe(82);
    });

    stallsD.forEach(s => {
      expect((s.geometry as any).width).toBe(58);
      expect((s.geometry as any).height).toBe(82);
    });

    stallsE.forEach(s => {
      expect((s.geometry as any).width).toBe(58);
      expect((s.geometry as any).height).toBe(82);
    });
  });

  it('preserves legacy compact dimensions in standard mode (68x52 and 44x50)', () => {
    const floor = buildMegaFloorDongXuan('standard');
    const stallsA = floor.stalls.filter(s => s.code.startsWith('A'));
    const stallsC = floor.stalls.filter(s => s.code.startsWith('C'));

    stallsA.forEach(s => {
      expect((s.geometry as any).width).toBe(68);
      expect((s.geometry as any).height).toBe(52);
    });

    stallsC.forEach(s => {
      expect((s.geometry as any).width).toBe(44);
      expect((s.geometry as any).height).toBe(50);
    });
  });

  it('ensures every stall bounding box is contained inside its zone geometry', () => {
    const floor = buildMegaFloorDongXuan('optimized');

    floor.zones.forEach(zone => {
      const zoneStalls = floor.stalls.filter(s => s.zoneId === zone.id || s.code.startsWith(zone.code));
      expect(zoneStalls.length).toBeGreaterThan(0);

      zoneStalls.forEach(stall => {
        expect(stall.boundingBox.minX).toBeGreaterThanOrEqual(zone.boundingBox.minX);
        expect(stall.boundingBox.minY).toBeGreaterThanOrEqual(zone.boundingBox.minY);
        expect(stall.boundingBox.maxX).toBeLessThanOrEqual(zone.boundingBox.maxX + 15); // with margin
        expect(stall.boundingBox.maxY).toBeLessThanOrEqual(zone.boundingBox.maxY + 15);
      });
    });
  });
});
