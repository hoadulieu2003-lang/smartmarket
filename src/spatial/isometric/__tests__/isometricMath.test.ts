import { describe, it, expect } from 'vitest';
import {
  projectIso,
  computeIsoStallFaces,
  computeCanopyStripes,
  pointsToSvgPath,
  DEFAULT_ISO_CONFIG,
  ISO_COS,
  ISO_SIN,
} from '../isometricMath';

describe('ISOMETRIC MATH & GEOMETRIC PROJECTION ENGINE', () => {
  it('hàm projectIso phải chiếu trực giao 30 độ chính xác với config cơ sở', () => {
    const unitConfig = { originX: 0, originY: 0, scaleX: 1, scaleY: 1 };

    // Điểm gốc (0, 0, 0)
    const origin = projectIso(0, 0, 0, unitConfig);
    expect(origin.x).toBeCloseTo(0, 1);
    expect(origin.y).toBeCloseTo(0, 1);

    // Di chuyển theo trục X: (10, 0, 0) -> x = 10 * cos(30°), y = 10 * sin(30°)
    const ptX = projectIso(10, 0, 0, unitConfig);
    expect(ptX.x).toBeCloseTo(10 * ISO_COS, 1);
    expect(ptX.y).toBeCloseTo(10 * ISO_SIN, 1);

    // Di chuyển theo trục Y: (0, 10, 0) -> x = -10 * cos(30°), y = 10 * sin(30°)
    const ptY = projectIso(0, 10, 0, unitConfig);
    expect(ptY.x).toBeCloseTo(-10 * ISO_COS, 1);
    expect(ptY.y).toBeCloseTo(10 * ISO_SIN, 1);

    // Di chuyển theo trục Z (chiều cao thẳng đứng): (0, 0, 10) -> x = 0, y = -10
    const ptZ = projectIso(0, 0, 10, unitConfig);
    expect(ptZ.x).toBeCloseTo(0, 1);
    expect(ptZ.y).toBeCloseTo(-10, 1);
  });

  it('hàm projectIso với DEFAULT_ISO_CONFIG phải có offset gốc chuẩn', () => {
    const origin = projectIso(0, 0, 0);
    expect(origin.x).toBe(DEFAULT_ISO_CONFIG.originX);
    expect(origin.y).toBe(DEFAULT_ISO_CONFIG.originY);
  });

  it('hàm computeIsoStallFaces phải tạo đủ các mặt base, top, left, right và canopyPeak', () => {
    const faces = computeIsoStallFaces(100, 100, 40, 30, 22, 16);

    expect(faces.base).toHaveLength(4);
    expect(faces.top).toHaveLength(4);
    expect(faces.left).toHaveLength(4);
    expect(faces.right).toHaveLength(4);
    expect(faces.canopyPeak).toHaveLength(4);
    expect(faces.center.x).toBeDefined();
    expect(faces.center.y).toBeDefined();
    expect(faces.depthScore).toBe(200); // x + y = 100 + 100
  });

  it('hàm computeCanopyStripes phải chia đều dải sọc bạt mái hiên', () => {
    const faces = computeIsoStallFaces(100, 100, 40, 30, 22, 16);
    const stripes = computeCanopyStripes(faces.top, 6);

    expect(stripes).toHaveLength(6);
    for (const stripe of stripes) {
      expect(stripe.points).toHaveLength(4);
      expect(typeof stripe.isPrimary).toBe('boolean');
    }
  });

  it('hàm pointsToSvgPath phải tạo chuỗi points SVG hợp lệ định dạng x,y x,y', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 5, y: 15 },
    ];
    const path = pointsToSvgPath(pts);
    expect(path).toBe('0,0 10,5 5,15');
  });
});
