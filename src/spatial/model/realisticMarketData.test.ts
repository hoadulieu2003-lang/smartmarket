import { describe, it, expect } from 'vitest';
import { REALISTIC_FLOOR_DATA } from '@/data/realisticMarketData';

describe('REALISTIC 2.5D BLUEPRINT SPATIAL MODEL VERIFICATION', () => {
  it('phải có đúng 86 sạp hàng và 5 phân khu chức năng', () => {
    expect(REALISTIC_FLOOR_DATA.stalls.length).toBe(86);
    expect(REALISTIC_FLOOR_DATA.zones.length).toBe(5);
  });

  it('hệ tọa độ phải khớp 100% tỷ lệ ảnh 1024 x 682', () => {
    expect(REALISTIC_FLOOR_DATA.coordinateSystem.width).toBe(1024);
    expect(REALISTIC_FLOOR_DATA.coordinateSystem.height).toBe(682);
  });

  it('toàn bộ 86 sạp phải có mã duy nhất và không bị trùng ID', () => {
    const ids = new Set<string>();
    const codes = new Set<string>();

    for (const stall of REALISTIC_FLOOR_DATA.stalls) {
      expect(ids.has(stall.id)).toBe(false);
      expect(codes.has(stall.code)).toBe(false);
      ids.add(stall.id);
      codes.add(stall.code);
    }
  });

  it('các sạp phải nằm hoàn toàn trong khung nhìn 1024 x 682', () => {
    for (const stall of REALISTIC_FLOOR_DATA.stalls) {
      expect(stall.geometry.type).toBe('rectangle');
      if (stall.geometry.type === 'rectangle') {
        expect(stall.geometry.x).toBeGreaterThanOrEqual(0);
        expect(stall.geometry.y).toBeGreaterThanOrEqual(0);
        expect(stall.geometry.x + stall.geometry.width).toBeLessThanOrEqual(1024);
        expect(stall.geometry.y + stall.geometry.height).toBeLessThanOrEqual(682);
      }
    }
  });

  it('sạp khẩn cấp A12 và E08 phải có cờ P0 và trạng thái critical', () => {
    const stallA12 = REALISTIC_FLOOR_DATA.stalls.find((s) => s.code === 'A12');
    expect(stallA12).toBeDefined();
    expect(stallA12?.state.highestSeverity).toBe('critical');
    expect(stallA12?.state.complaintsCount).toBeGreaterThan(0);
    expect((stallA12?.state.issues[0] as any)?.priority).toBe('P0');

    const stallE08 = REALISTIC_FLOOR_DATA.stalls.find((s) => s.code === 'E08');
    expect(stallE08).toBeDefined();
    expect(stallE08?.state.highestSeverity).toBe('critical');
    expect(stallE08?.state.complaintsCount).toBeGreaterThan(0);
    expect((stallE08?.state.issues[0] as any)?.priority).toBe('P0');
  });

  it('sạp B03 và C11 phải có trạng thái cảnh báo đúng theo sơ đồ', () => {
    const stallB03 = REALISTIC_FLOOR_DATA.stalls.find((s) => s.code === 'B03');
    expect(stallB03).toBeDefined();
    expect(stallB03?.state.contractDaysLeft).toBeLessThanOrEqual(30);

    const stallC11 = REALISTIC_FLOOR_DATA.stalls.find((s) => s.code === 'C11');
    expect(stallC11).toBeDefined();
    expect(stallC11?.state.feeStatus).toBe('overdue');
  });

  it('phải có đủ 4 cổng chính: Cổng Bắc, Nam, Tây, Đông', () => {
    const gateCodes = REALISTIC_FLOOR_DATA.gates.map((g) => g.code);
    expect(gateCodes).toContain('G-BAC');
    expect(gateCodes).toContain('G-NAM');
    expect(gateCodes).toContain('G-TAY');
    expect(gateCodes).toContain('G-DONG');
  });
});
