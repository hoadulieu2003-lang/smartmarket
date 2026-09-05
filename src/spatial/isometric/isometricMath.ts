/**
 * ════════════════════════════════════════════════════════════════════════════
 * ISOMETRIC MATHEMATICAL PROJECTION ENGINE (2.5D AUTOCAD / CAD ARCHITECTURE)
 * Chuyển đổi tọa độ 2D mặt bằng phẳng sang hệ tọa độ trực giao trục đo 2.5D
 * Isometric tiêu chuẩn góc 30° chuẩn đồ họa kỹ thuật kiến trúc AutoCAD.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface IsoPoint {
  x: number;
  y: number;
}

export interface IsoBoxFaces {
  base: Point2D[];        // Đa giác mặt đáy
  top: Point2D[];         // Đa giác mặt mái quầy (Top Face)
  left: Point2D[];        // Đa giác mặt bên trái đổ bóng (Left Shaded Face)
  right: Point2D[];       // Đa giác mặt bên phải / mặt trước (Right Front Face)
  canopyPeak: Point2D[];  // Đa giác chóp mái bạt uốn lượn (Canopy Awning)
  center: Point2D;        // Tọa độ tâm chiếu để gắn huy hiệu cảnh báo / halo
  depthScore: number;     // Chỉ số sâu (X + Y) để sắp xếp thứ tự vẽ z-index
}

// Hằng số chiếu trục đo chuẩn Isometric 30 độ (cos(30°) = √3/2 ≈ 0.866, sin(30°) = 0.5)
export const ISO_COS = Math.cos(Math.PI / 6); // 0.8660254
export const ISO_SIN = Math.sin(Math.PI / 6); // 0.5

export interface IsoConfig {
  originX: number;
  originY: number;
  scaleX: number;
  scaleY: number;
}

export const DEFAULT_ISO_CONFIG: IsoConfig = {
  originX: 820,
  originY: 180,
  scaleX: 0.92,
  scaleY: 0.92,
};

/**
 * Chiếu một điểm không gian (X, Y, Z) sang tọa độ màn hình 2D Isometric
 */
export function projectIso(
  x: number,
  y: number,
  z = 0,
  config: IsoConfig = DEFAULT_ISO_CONFIG
): IsoPoint {
  const scaledX = x * config.scaleX;
  const scaledY = y * config.scaleY;

  // Công thức chuẩn trục đo 2.5D Isometric:
  // ScreenX = originX + (X - Y) * cos(30°)
  // ScreenY = originY + (X + Y) * sin(30°) - Z
  const screenX = config.originX + (scaledX - scaledY) * ISO_COS;
  const screenY = config.originY + (scaledX + scaledY) * ISO_SIN - z;

  return {
    x: Math.round(screenX * 10) / 10,
    y: Math.round(screenY * 10) / 10,
  };
}

/**
 * Chuyển mảng điểm Point2D sang chuỗi SVG points attribute "x1,y1 x2,y2 ..."
 */
export function pointsToSvgPath(points: Point2D[]): string {
  if (points.length === 0) return '';
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

/**
 * Tính toán hình khối đa giác 2.5D cho 1 sạp (3 mặt rõ rệt + mái bạt sọc uốn lượn)
 */
export function computeIsoStallFaces(
  x: number,
  y: number,
  width: number,
  height: number,
  counterHeight = 22,
  canopyHeight = 16,
  config: IsoConfig = DEFAULT_ISO_CONFIG
): IsoBoxFaces {
  // 4 đỉnh mặt đáy trên mặt bằng phẳng
  const p00 = projectIso(x, y, 0, config);
  const p10 = projectIso(x + width, y, 0, config);
  const p11 = projectIso(x + width, y + height, 0, config);
  const p01 = projectIso(x, y + height, 0, config);

  // 4 đỉnh mặt bàn quầy (độ cao = counterHeight)
  const c00 = projectIso(x, y, counterHeight, config);
  const c10 = projectIso(x + width, y, counterHeight, config);
  const c11 = projectIso(x + width, y + height, counterHeight, config);
  const c01 = projectIso(x, y + height, counterHeight, config);

  // 4 đỉnh đỉnh mái bạt sọc 2.5D (độ cao = counterHeight + canopyHeight)
  const t00 = projectIso(x, y, counterHeight + canopyHeight, config);
  const t10 = projectIso(x + width, y, counterHeight + canopyHeight, config);
  const t11 = projectIso(x + width, y + height, counterHeight + canopyHeight * 0.75, config);
  const t01 = projectIso(x, y + height, counterHeight + canopyHeight * 0.75, config);

  // Tâm của khối quầy
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const center = projectIso(centerX, centerY, counterHeight + canopyHeight * 0.85, config);

  return {
    base: [p00, p10, p11, p01],
    // Mặt trên: Mái hiên bạt sọc (Top Roof Face)
    top: [t00, t10, t11, t01],
    // Mặt trái: Vách hông có bóng đổ tối (Left Shaded Face)
    left: [p00, c00, c01, p01],
    // Mặt phải: Mặt trước quầy hàng sáng sủa (Right Front Face)
    right: [p01, c01, c11, p11],
    // Chóp vòm mái che
    canopyPeak: [c00, t00, t10, c10],
    center,
    depthScore: x + y, // Phục vụ Depth-Sorting (vẽ từ xa đến gần)
  };
}

/**
 * Chia mặt mái Top Face thành các dải sọc bạt Isometric uốn lượn
 */
export function computeCanopyStripes(
  topPoints: Point2D[],
  numStripes = 5
): Array<{ points: Point2D[]; isPrimary: boolean }> {
  if (topPoints.length < 4) return [];
  const [t0, t1, t2, t3] = topPoints;
  const stripes: Array<{ points: Point2D[]; isPrimary: boolean }> = [];

  for (let i = 0; i < numStripes; i++) {
    const f0 = i / numStripes;
    const f1 = (i + 1) / numStripes;

    // Nội suy tuyến tính giữa cạnh sau (t0 -> t1) và cạnh trước (t3 -> t2)
    const pA = { x: t0.x + (t1.x - t0.x) * f0, y: t0.y + (t1.y - t0.y) * f0 };
    const pB = { x: t0.x + (t1.x - t0.x) * f1, y: t0.y + (t1.y - t0.y) * f1 };
    const pC = { x: t3.x + (t2.x - t3.x) * f1, y: t3.y + (t2.y - t3.y) * f1 };
    const pD = { x: t3.x + (t2.x - t3.x) * f0, y: t3.y + (t2.y - t3.y) * f0 };

    stripes.push({
      points: [pA, pB, pC, pD],
      isPrimary: i % 2 === 0,
    });
  }

  return stripes;
}
