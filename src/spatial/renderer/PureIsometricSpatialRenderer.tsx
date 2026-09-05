'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { RotateCcw, AlertTriangle, ShieldAlert, CheckCircle2, Eye, Wrench, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';
import type { FloorEntity, StallEntity } from '../model/types';
import { deriveStallVisual } from '../presentation/stallVisualAdapter';
import {
  computeIsoStallFaces,
  computeCanopyStripes,
  pointsToSvgPath,
  projectIso,
  DEFAULT_ISO_CONFIG,
  type Point2D,
} from '../isometric/isometricMath';

export interface PureIsometricSpatialRendererProps {
  floor: FloorEntity;
  selectedEntityId?: string | null;
  highlightedEntityIds?: Set<string> | string[] | null;
  onSelectEntity?: (entity: any) => void;
  onHoverEntity?: (entity: any) => void;
  onSelectZone?: (zoneId: string) => void;
  selectedZone?: string | null;
  operationalFilter?: 'all' | 'p0' | 'warning' | 'maintenance' | 'empty';
  zoomLevel?: number;
  className?: string;
  showLayers?: {
    cctv?: boolean;
    sensors?: boolean;
    fireExit?: boolean;
  };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PURE PROGRAMMATIC 2.5D ISOMETRIC SVG ENGINE
 * Động cơ sơ đồ 2.5D kiến trúc AutoCAD thuần mã nguồn vector SVG.
 * 100% không dùng ảnh bitmap JPG, độ nét vô cực, tải tức thì, tích hợp
 * toàn vẹn lớp tương tác nghiệp vụ tác chiến và đồng bộ hai chiều.
 * ════════════════════════════════════════════════════════════════════════════
 */

export const PureIsometricSpatialRenderer: React.FC<PureIsometricSpatialRendererProps> = ({
  floor,
  selectedEntityId = null,
  highlightedEntityIds = null,
  onSelectEntity,
  onHoverEntity,
  onSelectZone,
  selectedZone = null,
  operationalFilter = 'all',
  zoomLevel = 1.0,
  className = '',
  showLayers = { cctv: true, sensors: true, fireExit: false },
}) => {
  const [hoveredStallId, setHoveredStallId] = useState<string | null>(null);
  const [internalZoom, setInternalZoom] = useState(zoomLevel);

  useEffect(() => {
    setInternalZoom(zoomLevel);
  }, [zoomLevel]);

  const [tooltipData, setTooltipData] = useState<{
    stall: StallEntity;
    clientX: number;
    clientY: number;
  } | null>(null);

  // Pan & Drag Engine
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Kiểm tra sạp có nằm trong danh sách highlight không
  const isEntityHighlighted = useCallback(
    (id: string) => {
      if (!highlightedEntityIds) return true;
      if (highlightedEntityIds instanceof Set) return highlightedEntityIds.has(id);
      return Array.isArray(highlightedEntityIds) && highlightedEntityIds.includes(id);
    },
    [highlightedEntityIds]
  );

  // Xử lý kéo thả chuột (Pan Engine)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  // Click vào sạp trên sơ đồ 2.5D
  const handleStallClick = (e: React.MouseEvent, stall: StallEntity) => {
    e.stopPropagation();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const enrichedStall = {
      ...stall,
      _clientPos: { x: clientX, y: clientY },
    };
    onSelectEntity?.(enrichedStall);
  };

  // Tính toán dữ liệu hình khối 2.5D và sắp xếp theo chiều sâu (Depth Sorting)
  const sortedStallsWithFaces = useMemo(() => {
    if (!floor?.stalls) return [];

    return floor.stalls
      .map((stall) => {
        let x = 0, y = 0, width = 56, depth = 38;
        if (stall.geometry.type === 'rectangle') {
          x = stall.geometry.x;
          y = stall.geometry.y;
          width = stall.geometry.width;
          depth = stall.geometry.height;
        } else if (stall.geometry.type === 'polygon' && stall.boundingBox) {
          x = stall.boundingBox.minX;
          y = stall.boundingBox.minY;
          width = stall.boundingBox.width;
          depth = stall.boundingBox.height;
        }

        const isSelected = selectedEntityId === stall.id;
        const visual = deriveStallVisual(stall, { selected: isSelected });
        const faces = computeIsoStallFaces(x, y, width, depth, 22, 16);

        // Bảng màu mái bạt theo ngành hàng
        const prefix = stall.code.charAt(0).toUpperCase();
        let canopyColor = '#076C31'; // Mặc định xanh Smart Market
        if (visual.primaryTheme === 'complaint') canopyColor = '#ef4444'; // Đỏ khẩn cấp
        else if (visual.primaryTheme === 'expiring') canopyColor = '#f59e0b'; // Vàng chú ý
        else if (prefix === 'A') canopyColor = '#dc2626'; // Khu A (Thịt cá): Đỏ tươi
        else if (prefix === 'B') canopyColor = '#16a34a'; // Khu B (Rau củ): Xanh lá
        else if (prefix === 'C') canopyColor = '#2563eb'; // Khu C (Gia vị & Khô): Xanh dương
        else if (prefix === 'D') canopyColor = '#9333ea'; // Khu D (Thời trang): Tím
        else if (prefix === 'E') canopyColor = '#ea580c'; // Khu E (Ẩm thực): Cam

        const stripes = computeCanopyStripes(faces.top, 5);

        return {
          stall,
          visual,
          faces,
          stripes,
          canopyColor,
          isSelected,
          isP0: visual.primaryTheme === 'complaint',
          isWarning: visual.primaryTheme === 'expiring' || (stall.state as any)?.warningStatus === 'warning',
          depthScore: faces.depthScore,
        };
      })
      .sort((a, b) => a.depthScore - b.depthScore); // Sắp xếp từ xa đến gần
  }, [floor, selectedEntityId]);

  // Các điểm mốc sàn phân khu lớn Isometric (Zone Boundary Tiles)
  const zonePlates = useMemo(() => {
    const makeZonePolygon = (minX: number, minY: number, maxX: number, maxY: number) => {
      const p0 = projectIso(minX, minY, 0);
      const p1 = projectIso(maxX, minY, 0);
      const p2 = projectIso(maxX, maxY, 0);
      const p3 = projectIso(minX, maxY, 0);
      return pointsToSvgPath([p0, p1, p2, p3]);
    };

    return [
      { id: 'zone_B', name: 'KHU B • RAU CỦ QUẢ', color: '#fef3c7', stroke: '#16a34a', path: makeZonePolygon(140, 80, 470, 310) },
      { id: 'zone_A', name: 'KHU A • THỦY HẢI SẢN & THỊT', color: '#e0f2fe', stroke: '#2563eb', path: makeZonePolygon(540, 80, 880, 310) },
      { id: 'zone_C', name: 'KHU C • GIA VỊ & ĐỒ KHÔ', color: '#fef9c3', stroke: '#ca8a04', path: makeZonePolygon(120, 340, 395, 610) },
      { id: 'zone_D', name: 'KHU D • THỜI TRANG & MAY MẶC', color: '#fae8ff', stroke: '#9333ea', path: makeZonePolygon(395, 340, 605, 610) },
      { id: 'zone_E', name: 'KHU E • ẨM THỰC & ĐỒ UỐNG', color: '#ffedd5', stroke: '#ea580c', path: makeZonePolygon(605, 340, 910, 610) },
    ];
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-full select-none bg-slate-900/5 overflow-hidden flex items-center justify-center ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      } ${className}`}
    >
      {/* KHUNG KẾT XUẤT VECTOR SVG TRỰC GIAO 2.5D ISOMETRIC (ZERO BITMAP) */}
      <div
        className="transition-transform duration-300 ease-out origin-center relative flex items-center justify-center w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${internalZoom})`,
          width: '100%',
          height: '100%',
        }}
      >
        <svg
          data-testid="pure-isometric-svg"
          viewBox="0 0 1600 1100"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            {/* Gradient thảm cỏ ngoại cảnh */}
            <linearGradient id="lawn-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>

            {/* Gradient sàn hành lang chợ */}
            <linearGradient id="aisle-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>

            {/* Gradient bóng đổ hông quầy gỗ */}
            <linearGradient id="counter-left-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>

            <linearGradient id="counter-front-wood" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>

            {/* Hiệu ứng phát sáng Halo Ring Xanh */}
            <filter id="iso-focus-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#076C31" floodOpacity="0.9" />
            </filter>

            {/* Hiệu ứng phát sáng P0 Danger Red */}
            <filter id="iso-danger-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ef4444" floodOpacity="0.95" />
            </filter>

            {/* CSS Animations */}
            <style>{`
              @keyframes iso-radar-wave {
                0% { r: 8px; opacity: 1; stroke-width: 3px; }
                50% { r: 28px; opacity: 0.45; stroke-width: 2px; }
                100% { r: 42px; opacity: 0; stroke-width: 0.5px; }
              }
              .iso-radar-anim {
                animation: iso-radar-wave 2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
                transform-origin: center;
              }
              @keyframes iso-halo-pulse {
                0%, 100% { stroke-opacity: 1; stroke-width: 3.5px; }
                50% { stroke-opacity: 0.5; stroke-width: 4.5px; }
              }
              .iso-halo-anim {
                animation: iso-halo-pulse 1.8s ease-in-out infinite;
              }
            `}</style>
          </defs>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LỚP 1: NGOẠI CẢNH 2.5D (THẢM CỎ, ĐƯỜNG XE TẢI, HÀNG RÀO)          */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* Đa giác thảm cỏ Isometric bao quanh */}
          <polygon
            points={pointsToSvgPath([
              projectIso(-80, -120, 0),
              projectIso(1100, -120, 0),
              projectIso(1100, 760, 0),
              projectIso(-80, 760, 0),
            ])}
            fill="url(#lawn-grad)"
            stroke="#15803d"
            strokeWidth="3"
          />

          {/* Dải đường nhựa xe tải nhận hàng phía Bắc */}
          <polygon
            points={pointsToSvgPath([
              projectIso(-70, -110, 0),
              projectIso(1090, -110, 0),
              projectIso(1090, -20, 0),
              projectIso(-70, -20, 0),
            ])}
            fill="#334155"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Xe tải giao hàng 2.5D đậu phía Cổng Bắc */}
          <g transform={`translate(${projectIso(840, -65, 0).x}, ${projectIso(840, -65, 0).y})`}>
            {/* Bóng xe */}
            <ellipse cx="0" cy="8" rx="38" ry="16" fill="rgba(0,0,0,0.3)" />
            {/* Thùng xe tải */}
            <polygon points="-28,-14 16,-34 32,-26 -12,-6" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
            <polygon points="-28,-14 -12,-6 -12,12 -28,4" fill="#0369a1" stroke="#075985" strokeWidth="1.5" />
            <polygon points="-12,-6 32,-26 32,-8 -12,12" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
            {/* Cabin xe */}
            <polygon points="16,-34 36,-44 48,-38 28,-28" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
            <polygon points="28,-28 48,-38 48,-20 28,-10" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" />
            <text x="8" y="2" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace">LOGISTICS</text>
          </g>

          {/* Hàng rào cọc gỗ trắng 2.5D bao quanh */}
          <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
            {[-40, 150, 350, 550, 750, 950].map((rx, idx) => {
              const pTop = projectIso(rx, -15, 12);
              const pBot = projectIso(rx, -15, 0);
              return <line key={`fence_n_${idx}`} x1={pTop.x} y1={pTop.y} x2={pBot.x} y2={pBot.y} />;
            })}
          </g>

          {/* Nền gạch chung của toàn chợ */}
          <polygon
            points={pointsToSvgPath([
              projectIso(80, 40, 0),
              projectIso(950, 40, 0),
              projectIso(950, 650, 0),
              projectIso(80, 650, 0),
            ])}
            fill="url(#aisle-grad)"
            stroke="#94a3b8"
            strokeWidth="3"
          />

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LỚP 2: SÀN PHÂN KHU CHỨC NĂNG ISOMETRIC (ZONE TILES)              */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {zonePlates.map((zp) => (
            <g key={zp.id} className="cursor-pointer" onClick={() => onSelectZone?.(zp.id)}>
              <polygon
                points={zp.path}
                fill={zp.color}
                stroke={zp.stroke}
                strokeWidth={selectedZone === zp.id ? '4' : '2'}
                strokeDasharray={selectedZone === zp.id ? 'none' : '4 3'}
                opacity={selectedZone && selectedZone !== zp.id ? '0.45' : '0.85'}
                className="transition-all hover:opacity-100"
              />
            </g>
          ))}

          {/* 4 CỔNG CHÍNH 2.5D VỚI BIỂN CHỈ HƯỚNG */}
          {[
            { name: 'CỔNG BẮC (ĐẠI LỘ)', x: 505, y: 38, rot: 0 },
            { name: 'CỔNG NAM (BÃI XE)', x: 505, y: 652, rot: 0 },
            { name: 'CỔNG TÂY', x: 78, y: 345, rot: 0 },
            { name: 'CỔNG ĐÔNG', x: 952, y: 345, rot: 0 },
          ].map((gate, i) => {
            const pGate = projectIso(gate.x, gate.y, 22);
            return (
              <g key={`gate_${i}`} transform={`translate(${pGate.x}, ${pGate.y})`}>
                <rect x="-65" y="-12" width="130" height="24" rx="6" fill="#076C31" stroke="#ffffff" strokeWidth="2" filter="url(#iso-focus-glow)" />
                <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="extrabold" textAnchor="middle" fontFamily="sans-serif">
                  {gate.name}
                </text>
              </g>
            );
          })}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LỚP 3: 86 QUẦY SẠP 2.5D ISOMETRIC ĐA GIÁC (DEPTH SORTED)         */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {sortedStallsWithFaces.map(({ stall, visual, faces, stripes, canopyColor, isSelected, isP0, isWarning }) => {
            const isDimmed = !isEntityHighlighted(stall.id);
            const isHovered = hoveredStallId === stall.id;

            return (
              <g
                key={stall.id}
                id={`stall-iso-${stall.code}`}
                data-testid={`iso-stall-${stall.id}`}
                onClick={(e) => handleStallClick(e, stall)}
                onMouseEnter={(e) => {
                  setHoveredStallId(stall.id);
                  setTooltipData({ stall, clientX: e.clientX, clientY: e.clientY });
                  onHoverEntity?.(stall);
                }}
                onMouseLeave={() => {
                  setHoveredStallId(null);
                  setTooltipData(null);
                }}
                className={`cursor-pointer transition-opacity duration-200 ${
                  isDimmed ? 'opacity-25' : 'opacity-100'
                }`}
              >
                {/* 1. Bóng đổ sàn 2.5D (Isometric Ground Shadow) */}
                <polygon
                  points={pointsToSvgPath(faces.base)}
                  fill="rgba(15, 23, 42, 0.18)"
                  transform="translate(4, 6)"
                />

                {/* 2. Mặt vách bên trái có bóng đổ tối (Left Shaded Face) */}
                <polygon
                  points={pointsToSvgPath(faces.left)}
                  fill={isP0 ? '#991b1b' : isSelected ? '#065f46' : 'url(#counter-left-shadow)'}
                  stroke="#334155"
                  strokeWidth="1.2"
                />

                {/* 3. Mặt trước quầy gỗ có biển hiệu (Right Front Face) */}
                <polygon
                  points={pointsToSvgPath(faces.right)}
                  fill={isP0 ? '#b91c1c' : isSelected ? '#047857' : 'url(#counter-front-wood)'}
                  stroke="#334155"
                  strokeWidth="1.2"
                />

                {/* Biển mã sạp mặt trước quầy */}
                <g transform={`translate(${faces.right[1].x}, ${faces.right[1].y})`}>
                  <rect
                    x="2"
                    y="-11"
                    width="26"
                    height="12"
                    rx="3"
                    fill={isP0 ? '#ffffff' : '#f8fafc'}
                    stroke={isP0 ? '#ef4444' : '#076C31'}
                    strokeWidth="1.2"
                  />
                  <text
                    x="15"
                    y="-3"
                    fill={isP0 ? '#ef4444' : '#0f172a'}
                    fontSize="8.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {stall.code}
                  </text>
                </g>

                {/* 4. Mái bạt sọc uốn lượn 2.5D (Canopy Awning Striped Roof) */}
                <g>
                  {stripes.map((st, sIdx) => (
                    <polygon
                      key={`stripe_${sIdx}`}
                      points={pointsToSvgPath(st.points)}
                      fill={st.isPrimary ? canopyColor : '#ffffff'}
                      stroke={st.isPrimary ? canopyColor : '#e2e8f0'}
                      strokeWidth="0.8"
                    />
                  ))}
                  {/* Viền ngoài mái bạt */}
                  <polygon
                    points={pointsToSvgPath(faces.top)}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1.5"
                  />
                </g>

                {/* 5. VÒNG CHỌN SẠP NỔI BẬT (SELECTION FOCUS HALO RING #076C31) */}
                {isSelected && (
                  <g data-testid={`iso-halo-ring-${stall.id}`} filter="url(#iso-focus-glow)">
                    {/* Vòng đáy */}
                    <polygon
                      points={pointsToSvgPath(faces.base)}
                      fill="none"
                      stroke="#076C31"
                      strokeWidth="3.5"
                      className="iso-halo-anim"
                    />
                    {/* Vòng nóc mái */}
                    <polygon
                      points={pointsToSvgPath(faces.top)}
                      fill="rgba(7, 108, 49, 0.25)"
                      stroke="#076C31"
                      strokeWidth="3.5"
                      className="iso-halo-anim"
                    />
                    {/* Kim chỉ thị đỉnh */}
                    <circle cx={faces.center.x} cy={faces.center.y - 12} r="5" fill="#076C31" stroke="#ffffff" strokeWidth="2" />
                  </g>
                )}

                {/* 6. HUY HIỆU CẢNH BÁO KHẨN CẤP P0 (PULSING RADAR BEACON) TẠI A12 & E08 */}
                {isP0 && (
                  <g data-testid={`p0-beacon-${stall.id}`} transform={`translate(${faces.center.x}, ${faces.center.y - 10})`}>
                    {/* Sóng radar xung kích màu đỏ nhấp nháy */}
                    <circle cx="0" cy="0" r="10" fill="none" stroke="#ef4444" className="iso-radar-anim" />
                    <circle cx="0" cy="0" r="10" fill="none" stroke="#ef4444" className="iso-radar-anim" style={{ animationDelay: '0.9s' }} />

                    {/* Huy hiệu đỏ nổi bật có chấm than */}
                    <circle cx="0" cy="0" r="11" fill="#ef4444" stroke="#ffffff" strokeWidth="2.2" filter="url(#iso-danger-glow)" />
                    <text x="0" y="4.5" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                      !
                    </text>
                  </g>
                )}

                {/* 7. HUY HIỆU CẢNH BÁO VÀNG / CHÚ Ý (B03 / C11) */}
                {!isP0 && isWarning && (
                  <g transform={`translate(${faces.center.x}, ${faces.center.y - 10})`}>
                    <polygon points="0,-10 9,7 -9,7" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.8" />
                    <text x="0" y="5" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                      !
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* LỚP 4: HUD ĐIỀU KHIỂN & CHỈ DẪN 2.5D THUẦN VECTOR                      */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-lg flex items-center gap-3 text-xs font-sans">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#076C31] animate-pulse"></span>
          <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
            Sơ đồ 2.5D Isometric AutoCAD
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          </span>
        </div>
        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
        <div className="text-[11px] text-slate-500 hidden md:flex items-center gap-2">
          <span>Vector thuần nét căng 100% • Kéo chuột để di chuyển • Nhấp sạp xem nghiệp vụ</span>
        </div>
        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
          <button
            type="button"
            onClick={() => setInternalZoom((z) => Math.min(2.4, Math.round((z + 0.15) * 100) / 100))}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#076C31] transition-colors cursor-pointer border border-slate-200 font-bold text-xs flex items-center justify-center min-w-[26px]"
            title="Phóng to (+)"
            aria-label="Phóng to"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setInternalZoom((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100))}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#076C31] transition-colors cursor-pointer border border-slate-200 font-bold text-xs flex items-center justify-center min-w-[26px]"
            title="Thu nhỏ (-)"
            aria-label="Thu nhỏ"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => {
              setPan({ x: 0, y: 0 });
              setInternalZoom(1.0);
            }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#076C31] transition-colors cursor-pointer border border-slate-200"
            title="Căn giữa toàn chợ"
            aria-label="Căn giữa bản đồ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TOOLTIP NỔI KHI RÊ CHUỘT QUA SẠP */}
      {tooltipData && !isPanning && (
        <div
          className="fixed pointer-events-none z-50 bg-slate-900/95 text-white p-3 rounded-lg shadow-2xl border border-slate-700/80 text-xs font-sans min-w-[200px] backdrop-blur-sm"
          style={{
            left: `${tooltipData.clientX + 16}px`,
            top: `${tooltipData.clientY - 40}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5 mb-1.5">
            <span className="font-extrabold font-mono text-emerald-400 text-sm">
              {tooltipData.stall.code}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-300">
              {tooltipData.stall.metadata?.category || 'Gian hàng'}
            </span>
          </div>
          <div className="font-bold text-slate-100 mb-1">
            {tooltipData.stall.metadata?.name || tooltipData.stall.code}
          </div>
          <div className="text-[11px] text-slate-300">
            Tiểu thương: <strong>{tooltipData.stall.metadata?.merchantName || 'Đang cập nhật'}</strong>
          </div>
          {tooltipData.stall.state.complaintsCount > 0 && (
            <div className="mt-1.5 text-[10px] text-rose-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              Sự cố: {tooltipData.stall.state.issues?.[0]?.description || 'Cần xử lý khẩn cấp'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
