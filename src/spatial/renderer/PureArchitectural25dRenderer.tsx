'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import type { FloorEntity, StallEntity } from '../model/types';
import { deriveStallVisual } from '../presentation/stallVisualAdapter';

export interface PureArchitectural25dRendererProps {
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

// Hệ số phóng to tỷ lệ Ultra-HD (Scale 2x từ 1024x682 lên 2048x1364)
const S = 2;

export const PureArchitectural25dRenderer: React.FC<PureArchitectural25dRendererProps> = ({
  floor,
  selectedEntityId,
  highlightedEntityIds,
  onSelectEntity,
  onHoverEntity,
  onSelectZone,
  selectedZone = null,
  operationalFilter = 'all',
  zoomLevel = 1.0,
  className = '',
  showLayers = { cctv: true, sensors: true, fireExit: true },
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
    if (e.button !== 0) return;
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Động cơ cử chỉ cảm ứng hiện trường (Field Touch Engine: Vuốt 1 ngón & Chụm 2 ngón)
  const pinchStartDistRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      dragStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    pinchStartDistRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.12 : 0.12;
    setInternalZoom((prev) => Math.min(2.8, Math.max(0.55, Math.round((prev + delta) * 100) / 100)));
  };

  const handleStallClick = (e: React.MouseEvent, stall: StallEntity) => {
    e.stopPropagation();
    onSelectEntity?.(stall);
  };

  // Chuẩn bị dữ liệu sạp với phân loại ngành hàng và trạng thái
  const enrichedStalls = useMemo(() => {
    return floor.stalls.map((stall) => {
      let x = 0, y = 0, w = 50, h = 50;
      if (stall.geometry.type === 'rectangle') {
        x = stall.geometry.x;
        y = stall.geometry.y;
        w = stall.geometry.width;
        h = stall.geometry.height;
      } else if (stall.geometry.type === 'polygon' && stall.boundingBox) {
        x = stall.boundingBox.minX;
        y = stall.boundingBox.minY;
        w = stall.boundingBox.width;
        h = stall.boundingBox.height;
      }

      const isSelected = selectedEntityId === stall.id;
      const visual = deriveStallVisual(stall, { selected: isSelected });
      const prefix = stall.code.charAt(0).toUpperCase();

      const isA12 = stall.code === 'A12';
      const isE08 = stall.code === 'E08';
      const isB03 = stall.code === 'B03';
      const isC11 = stall.code === 'C11';

      return {
        stall,
        x: x * S,
        y: y * S,
        w: w * S,
        h: h * S,
        visual,
        prefix,
        isSelected,
        isP0: isA12 || isE08 || visual.primaryTheme === 'complaint',
        isWarning: isB03 || visual.primaryTheme === 'expiring',
        isOverdue: isC11,
      };
    });
  }, [floor, selectedEntityId]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onWheel={handleWheel}
      style={{ touchAction: 'none' }}
      className={`relative w-full h-full select-none bg-slate-950 overflow-hidden flex items-center justify-center ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      } ${className}`}
    >
      {/* KHUNG KẾT XUẤT VECTOR SVG 2.5D TOP-DOWN ARCHITECTURAL CUTAWAY (2048 x 1364 ULTRA-HD) */}
      <div
        className="transition-transform duration-200 ease-out origin-center relative flex items-center justify-center w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${internalZoom})`,
          width: '100%',
          height: '100%',
        }}
      >
        <svg
          data-testid="pure-architectural-svg"
          viewBox="0 0 2048 1364"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full drop-shadow-2xl"
        >
          <defs>
            {/* Bộ lọc đổ bóng tường 2.5D dập nổi */}
            <filter id="wall-inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="3" dy="5" stdDeviation="5" floodColor="#090d16" floodOpacity="0.45" />
            </filter>

            {/* Bộ lọc đổ bóng quầy sạp 2.5D */}
            <filter id="stall-soft-shadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.22" />
            </filter>

            {/* Hiệu ứng hào quang Selection Focus Halo Ring #076C31 */}
            <filter id="focus-glow-green" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#076C31" floodOpacity="0.95" />
            </filter>

            {/* Hiệu ứng hào quang P0 Danger Red */}
            <filter id="p0-danger-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#ef4444" floodOpacity="0.95" />
            </filter>

            {/* Hiệu ứng cảnh báo Warning Yellow */}
            <filter id="warning-glow-yellow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#f59e0b" floodOpacity="0.9" />
            </filter>

            {/* Hoa văn gạch men chữ thập hành lang trung tâm */}
            <pattern id="hallway-tiles" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#f8fafc" />
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1.2" />
            </pattern>

            {/* Hoa văn vạch sơn bãi xe giao hàng */}
            <pattern id="loading-stripes" width="24" height="24" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <rect width="12" height="24" fill="#fbbf24" opacity="0.6" />
              <rect x="12" width="12" height="24" fill="#1e293b" opacity="0.8" />
            </pattern>

            {/* Keyframe Animations */}
            <style>{`
              @keyframes p0-radar-expand {
                0% { r: 12px; opacity: 1; stroke-width: 3.5px; }
                60% { r: 36px; opacity: 0.4; stroke-width: 2px; }
                100% { r: 52px; opacity: 0; stroke-width: 0.5px; }
              }
              .p0-radar-wave {
                animation: p0-radar-expand 1.8s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
                transform-origin: center;
              }
              @keyframes halo-pulse-anim {
                0%, 100% { stroke-opacity: 0.95; stroke-width: 5px; }
                50% { stroke-opacity: 0.55; stroke-width: 3.5px; }
              }
              .halo-ring-pulse {
                animation: halo-pulse-anim 1.5s ease-in-out infinite;
              }
            `}</style>
          </defs>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LỚP 0: SÂN NGOẠI CẢNH & NỀN GẠCH HÀNH LANG CHỮ THẬP CHỢ           */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* Sân ngoài chợ */}
          <rect x="0" y="0" width="2048" height="1364" fill="#0f172a" />
          
          {/* Nền gạch hành lang toàn chợ */}
          <rect x="80" y="50" width="1888" height="1264" rx="16" fill="url(#hallway-tiles)" />

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LỚP 1: HỆ THỐNG TƯỜNG BAO 2.5D DẬP NỔI & 4 CỔNG CHÍNH             */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* Tường bao bê tông ngoại vi có độ dày 2.5D */}
          <g filter="url(#wall-inner-shadow)">
            {/* Tường đỉnh Bắc */}
            <rect x="80" y="44" width="1888" height="24" fill="#334155" />
            <rect x="80" y="44" width="1888" height="6" fill="#64748b" />

            {/* Tường đáy Nam */}
            <rect x="80" y="1296" width="1888" height="24" fill="#334155" />
            <rect x="80" y="1296" width="1888" height="6" fill="#64748b" />

            {/* Tường sườn Tây (Trái) */}
            <rect x="80" y="44" width="24" height="1276" fill="#334155" />
            <rect x="80" y="44" width="6" height="1276" fill="#64748b" />

            {/* Tường sườn Đông (Phải) */}
            <rect x="1944" y="44" width="24" height="1276" fill="#334155" />
            <rect x="1944" y="44" width="6" height="1276" fill="#64748b" />
          </g>

          {/* BẬC TAM CẤP & KHỐI KIẾN TRÚC 4 CỔNG */}
          {/* CỔNG BẮC (ĐẠI LỘ) */}
          <g id="gate-bac" transform="translate(1024, 38)">
            {/* Bậc thang đá */}
            <rect x="-110" y="-8" width="220" height="8" fill="#e2e8f0" stroke="#94a3b8" />
            <rect x="-100" y="-16" width="200" height="8" fill="#cbd5e1" stroke="#94a3b8" />
            <rect x="-90" y="-24" width="180" height="8" fill="#94a3b8" stroke="#64748b" />
            {/* Biển hiệu Cổng Bắc */}
            <rect x="-85" y="-34" width="170" height="34" rx="6" fill="#076C31" stroke="#ffffff" strokeWidth="2.5" />
            <text x="0" y="-12" fill="#ffffff" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              CỔNG BẮC
            </text>
          </g>

          {/* CỔNG NAM (BÃI XE CHÍNH) */}
          <g id="gate-nam" transform="translate(1024, 1318)">
            {/* Bậc thang đón tiếp lớn */}
            <rect x="-120" y="0" width="240" height="8" fill="#e2e8f0" stroke="#94a3b8" />
            <rect x="-110" y="8" width="220" height="8" fill="#cbd5e1" stroke="#94a3b8" />
            <rect x="-100" y="16" width="200" height="8" fill="#94a3b8" stroke="#64748b" />
            {/* Biển hiệu Cổng Nam */}
            <rect x="-85" y="10" width="170" height="34" rx="6" fill="#076C31" stroke="#ffffff" strokeWidth="2.5" />
            <text x="0" y="32" fill="#ffffff" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              CỔNG NAM
            </text>
          </g>

          {/* CỔNG TÂY */}
          <g id="gate-tay" transform="translate(72, 682)">
            <rect x="-24" y="-75" width="24" height="150" fill="#cbd5e1" stroke="#94a3b8" />
            <rect x="-40" y="-60" width="34" height="120" rx="6" fill="#076C31" stroke="#ffffff" strokeWidth="2.5" />
            <text x="-23" y="6" fill="#ffffff" fontSize="15" fontWeight="900" textAnchor="middle" transform="rotate(-90 -23 6)" fontFamily="sans-serif">
              CỔNG TÂY
            </text>
          </g>

          {/* CỔNG ĐÔNG */}
          <g id="gate-dong" transform="translate(1976, 682)">
            <rect x="0" y="-75" width="24" height="150" fill="#cbd5e1" stroke="#94a3b8" />
            <rect x="6" y="-60" width="34" height="120" rx="6" fill="#076C31" stroke="#ffffff" strokeWidth="2.5" />
            <text x="23" y="6" fill="#ffffff" fontSize="15" fontWeight="900" textAnchor="middle" transform="rotate(90 23 6)" fontFamily="sans-serif">
              CỔNG ĐÔNG
            </text>
          </g>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LỚP 2: HẠ TẦNG TIỆN ÍCH - PCCC, CCTV, WC, CÂY XANH & 2 XE TẢI     */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* Cụm phòng WC (4 Góc Chợ) */}
          {[
            { x: 120, y: 70, label: 'WC' },
            { x: 1800, y: 70, label: 'WC' },
            { x: 670, y: 1220, label: 'WC' },
            { x: 1340, y: 1220, label: 'WC' },
          ].map((wc, idx) => (
            <g key={`wc_${idx}`} transform={`translate(${wc.x}, ${wc.y})`}>
              <rect width="60" height="50" rx="4" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="6" y="6" width="48" height="38" rx="2" fill="#0284c7" />
              <text x="30" y="30" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                🚻
              </text>
            </g>
          ))}

          {/* Trạm PCCC Đỏ Rực & Đèn Exit Xanh Lá */}
          {showLayers.fireExit && (
            <g id="pccc-stations">
              {[
                { x: 260, y: 70 },
                { x: 1720, y: 70 },
                { x: 86, y: 340 },
                { x: 1910, y: 340 },
                { x: 86, y: 880 },
                { x: 1910, y: 880 },
                { x: 260, y: 1220 },
                { x: 1720, y: 1220 },
              ].map((fire, i) => (
                <g key={`pccc_${i}`} transform={`translate(${fire.x}, ${fire.y})`}>
                  {/* Hộp PCCC */}
                  <rect x="0" y="0" width="44" height="24" rx="3" fill="#dc2626" stroke="#ffffff" strokeWidth="1.2" />
                  <text x="22" y="16" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                    PCCC
                  </text>
                  {/* Đèn Exit */}
                  <rect x="48" y="2" width="30" height="20" rx="3" fill="#16a34a" stroke="#ffffff" strokeWidth="1" />
                  <text x="63" y="16" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                    ➔
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Camera CCTV Giám Sát */}
          {showLayers.cctv && (
            <g id="cctv-cameras">
              {[
                { x: 800, y: 100 },
                { x: 1240, y: 100 },
                { x: 940, y: 440 },
                { x: 1100, y: 440 },
                { x: 940, y: 820 },
                { x: 1100, y: 820 },
                { x: 800, y: 1180 },
                { x: 1240, y: 1180 },
                { x: 150, y: 580 },
                { x: 1870, y: 580 },
              ].map((cam, i) => (
                <g key={`cam_${i}`} transform={`translate(${cam.x}, ${cam.y})`}>
                  <circle cx="0" cy="0" r="11" fill="#ffffff" stroke="#334155" strokeWidth="2" />
                  <circle cx="0" cy="0" r="6" fill="#1e293b" />
                  <circle cx="2" cy="-2" r="2" fill="#ef4444" />
                  <text x="0" y="24" fill="#334155" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    CCTV
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* KHU NHẬN HÀNG VÀ 2 CHIẾC XE TẢI MÀU TRẮNG (DELIVERY TRUCKS) */}
          {/* Khu nhận hàng Tây (Góc dưới trái) */}
          <g id="loading-bay-west" transform="translate(110, 1080)">
            <rect x="0" y="0" width="100" height="150" fill="#334155" rx="6" stroke="#475569" strokeWidth="2" />
            <rect x="4" y="4" width="92" height="142" fill="url(#loading-stripes)" />
            <rect x="8" y="8" width="84" height="26" rx="4" fill="#1e293b" />
            <text x="50" y="25" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
              KHU NHẬN HÀNG
            </text>

            {/* Xe tải màu trắng Tây */}
            <g transform="translate(18, 42)">
              {/* Bánh xe */}
              <rect x="-4" y="16" width="6" height="16" rx="2" fill="#0f172a" />
              <rect x="62" y="16" width="6" height="16" rx="2" fill="#0f172a" />
              <rect x="-4" y="68" width="6" height="18" rx="2" fill="#0f172a" />
              <rect x="62" y="68" width="6" height="18" rx="2" fill="#0f172a" />
              {/* Thùng hàng trắng */}
              <rect x="2" y="36" width="60" height="56" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Cabin trắng */}
              <rect x="6" y="4" width="52" height="30" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Kính chắn gió xanh đen */}
              <rect x="12" y="10" width="40" height="12" rx="2" fill="#0284c7" opacity="0.85" />
              {/* Gương chiếu hậu */}
              <rect x="2" y="12" width="4" height="6" fill="#64748b" />
              <rect x="58" y="12" width="4" height="6" fill="#64748b" />
            </g>
          </g>

          {/* Khu nhận hàng Đông (Góc dưới phải) */}
          <g id="loading-bay-east" transform="translate(1820, 1080)">
            <rect x="0" y="0" width="100" height="150" fill="#334155" rx="6" stroke="#475569" strokeWidth="2" />
            <rect x="4" y="4" width="92" height="142" fill="url(#loading-stripes)" />
            <rect x="8" y="8" width="84" height="26" rx="4" fill="#1e293b" />
            <text x="50" y="25" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
              KHU NHẬN HÀNG
            </text>

            {/* Xe tải màu trắng Đông */}
            <g transform="translate(18, 42)">
              {/* Bánh xe */}
              <rect x="-4" y="16" width="6" height="16" rx="2" fill="#0f172a" />
              <rect x="62" y="16" width="6" height="16" rx="2" fill="#0f172a" />
              <rect x="-4" y="68" width="6" height="18" rx="2" fill="#0f172a" />
              <rect x="62" y="68" width="6" height="18" rx="2" fill="#0f172a" />
              {/* Thùng hàng trắng */}
              <rect x="2" y="36" width="60" height="56" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Cabin trắng */}
              <rect x="6" y="4" width="52" height="30" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Kính chắn gió xanh đen */}
              <rect x="12" y="10" width="40" height="12" rx="2" fill="#0284c7" opacity="0.85" />
              {/* Gương chiếu hậu */}
              <rect x="2" y="12" width="4" height="6" fill="#64748b" />
              <rect x="58" y="12" width="4" height="6" fill="#64748b" />
            </g>
          </g>

          {/* Chậu Cây Cảnh Sinh Thái Dọc Hành Lang */}
          {[
            { x: 1024, y: 320 },
            { x: 1024, y: 440 },
            { x: 740, y: 1200 },
            { x: 1220, y: 1200 },
          ].map((tree, i) => (
            <g key={`tree_${i}`} transform={`translate(${tree.x}, ${tree.y})`}>
              <rect x="-18" y="-18" width="36" height="36" rx="6" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="14" fill="#22c55e" />
              <circle cx="-3" cy="-3" r="10" fill="#4ade80" />
              <circle cx="4" cy="4" r="8" fill="#16a34a" />
            </g>
          ))}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LỚP 3: 5 SÀN PHÂN KHU CHỨC NĂNG PASTEL & BIỂN HIỆU KHU VỰC         */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* KHU B: RAU CỦ QUẢ (Tây Bắc) */}
          <g id="plate-zone-B" className="cursor-pointer" onClick={() => onSelectZone?.('zone_B')}>
            <rect x="308" y="184" width="600" height="408" rx="8" fill="#dcfce7" stroke="#16a34a" strokeWidth={selectedZone === 'zone_B' ? 4 : 2} opacity="0.9" />
            {/* Biển hiệu KHU B */}
            <rect x="480" y="196" width="220" height="42" rx="6" fill="#15803d" stroke="#ffffff" strokeWidth="2" filter="url(#stall-soft-shadow)" />
            <text x="590" y="223" fill="#ffffff" fontSize="20" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              🌱 KHU B
            </text>
          </g>

          {/* KHU A: THỰC PHẨM TƯƠI SỐNG (Đông Bắc) */}
          <g id="plate-zone-A" className="cursor-pointer" onClick={() => onSelectZone?.('zone_A')}>
            <rect x="1108" y="184" width="632" height="408" rx="8" fill="#ccfbf1" stroke="#0d9488" strokeWidth={selectedZone === 'zone_A' ? 4 : 2} opacity="0.9" />
            {/* Biển hiệu KHU A */}
            <rect x="1310" y="196" width="220" height="42" rx="6" fill="#0f766e" stroke="#ffffff" strokeWidth="2" filter="url(#stall-soft-shadow)" />
            <text x="1420" y="223" fill="#ffffff" fontSize="20" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              🐟 KHU A
            </text>
          </g>

          {/* KHU C: BÁCH HÓA ĐỒ KHÔ (Tây Nam) */}
          <g id="plate-zone-C" className="cursor-pointer" onClick={() => onSelectZone?.('zone_C')}>
            <rect x="252" y="700" width="536" height="496" rx="8" fill="#ffedd5" stroke="#ea580c" strokeWidth={selectedZone === 'zone_C' ? 4 : 2} opacity="0.9" />
            {/* Biển hiệu KHU C */}
            <rect x="420" y="710" width="200" height="40" rx="6" fill="#c2410c" stroke="#ffffff" strokeWidth="2" filter="url(#stall-soft-shadow)" />
            <text x="520" y="736" fill="#ffffff" fontSize="19" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              🥫 KHU C
            </text>
          </g>

          {/* KHU D: THỜI TRANG MAY MẶC (Nam Trung Tâm) */}
          <g id="plate-zone-D" className="cursor-pointer" onClick={() => onSelectZone?.('zone_D')}>
            <rect x="764" y="690" width="440" height="506" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth={selectedZone === 'zone_D' ? 4 : 2} opacity="0.9" />
            {/* Biển hiệu KHU D */}
            <rect x="880" y="702" width="200" height="40" rx="6" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" filter="url(#stall-soft-shadow)" />
            <text x="980" y="728" fill="#ffffff" fontSize="19" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              👕 KHU D
            </text>
          </g>

          {/* KHU E: ẨM THỰC ĐẶC SẢN (Đông Nam) */}
          <g id="plate-zone-E" className="cursor-pointer" onClick={() => onSelectZone?.('zone_E')}>
            <rect x="1240" y="690" width="568" height="506" rx="8" fill="#cffafe" stroke="#0891b2" strokeWidth={selectedZone === 'zone_E' ? 4 : 2} opacity="0.9" />
            {/* Biển hiệu KHU E */}
            <rect x="1420" y="702" width="200" height="40" rx="6" fill="#0e7490" stroke="#ffffff" strokeWidth="2" filter="url(#stall-soft-shadow)" />
            <text x="1520" y="728" fill="#ffffff" fontSize="19" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              🍲 KHU E
            </text>
          </g>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LỚP 4: 86 QUẦY SẠP 2.5D VECTOR CHI TIẾT THEO NGÀNH HÀNG           */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {enrichedStalls.map(({ stall, x, y, w, h, prefix, isSelected, isP0, isWarning, isOverdue }) => {
            const isDimmed = !isEntityHighlighted(stall.id);
            const isHovered = hoveredStallId === stall.id;

            // Xác định màu vách và nền sạp
            let stallBg = '#ffffff';
            let stallBorder = '#94a3b8';
            if (isP0) {
              stallBg = '#fee2e2';
              stallBorder = '#ef4444';
            } else if (isWarning) {
              stallBg = '#fef3c7';
              stallBorder = '#f59e0b';
            } else if (isOverdue) {
              stallBg = '#ffedd5';
              stallBorder = '#ea580c';
            } else if (prefix === 'B') {
              stallBg = '#f0fdf4';
              stallBorder = '#86efac';
            } else if (prefix === 'A') {
              stallBg = '#f0fdfa';
              stallBorder = '#5eead4';
            } else if (prefix === 'C') {
              stallBg = '#fff7ed';
              stallBorder = '#fdba74';
            } else if (prefix === 'D') {
              stallBg = '#eff6ff';
              stallBorder = '#93c5fd';
            } else if (prefix === 'E') {
              stallBg = '#ecfeff';
              stallBorder = '#67e8f9';
            }

            return (
              <g
                key={stall.id}
                id={`stall-${stall.code}`}
                data-testid={`stall-arch-${stall.code}`}
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
                className={`cursor-pointer transition-all duration-150 ${
                  isDimmed ? 'opacity-25' : 'opacity-100'
                }`}
              >
                {/* 1. Bóng đổ quầy sạp 2.5D */}
                <rect
                  x={x + 4}
                  y={y + 6}
                  width={w}
                  height={h}
                  rx="6"
                  fill="rgba(15, 23, 42, 0.2)"
                />

                {/* 2. Vách ngăn quầy sạp 2.5D */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="6"
                  fill={stallBg}
                  stroke={stallBorder}
                  strokeWidth={isP0 || isWarning || isOverdue ? 3 : 2}
                  filter={isHovered ? 'url(#stall-soft-shadow)' : undefined}
                />

                {/* 3. Vách cạnh 2.5D giả lập độ sâu kiến trúc */}
                <rect x={x + 3} y={y + h - 8} width={w - 6} height="5" rx="1.5" fill="rgba(0,0,0,0.08)" />

                {/* 4. Mã hiệu sạp hiển thị to rõ nét */}
                <rect
                  x={x + w / 2 - 34}
                  y={y + 6}
                  width="68"
                  height="22"
                  rx="4"
                  fill={isP0 ? '#ef4444' : isWarning ? '#f59e0b' : '#ffffff'}
                  stroke={isP0 ? '#b91c1c' : isWarning ? '#d97706' : '#cbd5e1'}
                  strokeWidth="1.2"
                />
                <text
                  x={x + w / 2}
                  y={y + 21}
                  fill={isP0 || isWarning ? '#ffffff' : '#0f172a'}
                  fontSize="12"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {stall.code}
                </text>

                {/* 5. Mô phỏng hàng hóa vector chi tiết theo từng ngành hàng */}
                {/* Khu B: Rau Củ Quả (Sọt rau xanh, cà rốt cam, quả bí vàng) */}
                {prefix === 'B' && (
                  <g transform={`translate(${x + 8}, ${y + 36})`}>
                    <rect x="0" y="0" width={w - 16} height={h - 48} rx="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                    {/* Sọt rau củ */}
                    <circle cx="16" cy="14" r="8" fill="#22c55e" stroke="#16a34a" />
                    <circle cx="40" cy="14" r="8" fill="#f97316" stroke="#ea580c" />
                    <circle cx="64" cy="14" r="8" fill="#ef4444" stroke="#dc2626" />
                    {w > 90 && <circle cx="84" cy="14" r="8" fill="#eab308" stroke="#ca8a04" />}
                  </g>
                )}

                {/* Khu A: Thực phẩm tươi sống (Tủ kính bảo ôn bạc inox, khay cá) */}
                {prefix === 'A' && (
                  <g transform={`translate(${x + 8}, ${y + 36})`}>
                    <rect x="0" y="0" width={w - 16} height={h - 48} rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2" />
                    {/* Khay inox đựng cá & hải sản */}
                    <rect x="6" y="6" width="36" height={h - 60} rx="2" fill="#0284c7" opacity="0.85" />
                    <path d={`M 14 14 Q 24 8 34 14 Q 24 20 14 14 Z`} fill="#ffffff" />
                    <rect x="48" y="6" width="36" height={h - 60} rx="2" fill="#ef4444" opacity="0.75" />
                    {w > 95 && <rect x="88" y="6" width="16" height={h - 60} rx="2" fill="#38bdf8" />}
                  </g>
                )}

                {/* Khu C: Bách hóa đồ khô (Kệ gỗ nhiều tầng, lọ hộp gia vị) */}
                {prefix === 'C' && (
                  <g transform={`translate(${x + 8}, ${y + 36})`}>
                    <rect x="0" y="0" width={w - 16} height={h - 48} rx="3" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />
                    {/* Hàng hộp lọ gia vị */}
                    <rect x="8" y="6" width="12" height="14" rx="2" fill="#b45309" />
                    <rect x="26" y="6" width="12" height="14" rx="2" fill="#d97706" />
                    <rect x="44" y="6" width="12" height="14" rx="2" fill="#78350f" />
                    <rect x="62" y="6" width="14" height="14" rx="3" fill="#a16207" />
                  </g>
                )}

                {/* Khu D: Thời trang may mặc (Sào treo móc áo thun đa sắc) */}
                {prefix === 'D' && (
                  <g transform={`translate(${x + 8}, ${y + 36})`}>
                    <rect x="0" y="0" width={w - 16} height={h - 48} rx="3" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1" />
                    {/* Thanh sào kim loại */}
                    <line x1="6" y1="12" x2={w - 22} y2="12" stroke="#1e293b" strokeWidth="2.5" />
                    {/* Áo thun treo đa màu sắc */}
                    <rect x="10" y="10" width="8" height="16" rx="2" fill="#ef4444" />
                    <rect x="22" y="10" width="8" height="16" rx="2" fill="#3b82f6" />
                    <rect x="34" y="10" width="8" height="16" rx="2" fill="#22c55e" />
                    <rect x="46" y="10" width="8" height="16" rx="2" fill="#eab308" />
                    <rect x="58" y="10" width="8" height="16" rx="2" fill="#ffffff" stroke="#cbd5e1" />
                  </g>
                )}

                {/* Khu E: Ẩm thực đặc sản (Bàn ghế quầy ăn, khay thức ăn nóng) */}
                {prefix === 'E' && (
                  <g transform={`translate(${x + 8}, ${y + 36})`}>
                    <rect x="0" y="0" width={w - 16} height={h - 48} rx="3" fill="#a5f3fc" stroke="#0891b2" strokeWidth="1" />
                    {/* Bàn khay đồ ăn inox */}
                    <circle cx="16" cy="14" r="8" fill="#f97316" stroke="#c2410c" />
                    <circle cx="38" cy="14" r="8" fill="#ef4444" stroke="#b91c1c" />
                    <circle cx="60" cy="14" r="8" fill="#eab308" stroke="#a16207" />
                  </g>
                )}

                {/* 6. VÒNG CHỌN SẠP SELECTION FOCUS HALO RING (#076C31) */}
                {isSelected && (
                  <g data-testid={`halo-ring-${stall.code}`} filter="url(#focus-glow-green)">
                    <rect
                      x={x - 6}
                      y={y - 6}
                      width={w + 12}
                      height={h + 12}
                      rx="10"
                      fill="rgba(7, 108, 49, 0.18)"
                      stroke="#076C31"
                      strokeWidth="5"
                      className="halo-ring-pulse"
                    />
                  </g>
                )}

                {/* 7. HUY HIỆU CẢNH BÁO KHẨN CẤP P0 (PULSING RADAR BEACON) TẠI A12 & E08 */}
                {isP0 && (
                  <g
                    data-testid={`p0-beacon-${stall.code}`}
                    transform={`translate(${x + w - 4}, ${y + 4})`}
                  >
                    {/* Sóng radar đỏ tỏa tròn liên tục */}
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#ef4444" className="p0-radar-wave" />
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#ef4444" className="p0-radar-wave" style={{ animationDelay: '0.8s' }} />

                    {/* Bong bóng đỏ cảnh báo có chấm than */}
                    <circle cx="0" cy="0" r="15" fill="#ef4444" stroke="#ffffff" strokeWidth="3" filter="url(#p0-danger-glow)" />
                    <text x="0" y="6" fill="#ffffff" fontSize="17" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                      !
                    </text>
                  </g>
                )}

                {/* 8. HUY HIỆU CẢNH BÁO VÀNG CHÚ Ý TẠI SẠP B03 */}
                {!isP0 && isWarning && (
                  <g
                    data-testid={`warning-beacon-${stall.code}`}
                    transform={`translate(${x + w - 4}, ${y + 4})`}
                  >
                    <circle cx="0" cy="0" r="14" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" filter="url(#warning-glow-yellow)" />
                    <text x="0" y="5.5" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
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
      {/* LỚP 5: HUD ĐIỀU KHIỂN & CHỈ DẪN 2.5D VECTOR CHUẨN ULTRA-HD             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-xl flex items-center gap-3 text-xs font-sans">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#076C31] animate-pulse"></span>
          <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
            Sơ đồ 2.5D Top-Down Architectural Cutaway
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </span>
        </div>
        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
        <div className="text-[11px] text-slate-500 hidden md:flex items-center gap-2">
          <span>Vector thuần nét căng 100% • 2048 x 1364 Ultra-HD • Nhấp sạp tác chiến</span>
        </div>
        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
          <button
            type="button"
            onClick={() => setInternalZoom((z) => Math.min(2.8, Math.round((z + 0.15) * 100) / 100))}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#076C31] transition-colors cursor-pointer border border-slate-200 font-bold text-xs flex items-center justify-center min-w-[28px]"
            title="Phóng to (+)"
            aria-label="Phóng to"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setInternalZoom((z) => Math.max(0.55, Math.round((z - 0.15) * 100) / 100))}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#076C31] transition-colors cursor-pointer border border-slate-200 font-bold text-xs flex items-center justify-center min-w-[28px]"
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
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#076C31] transition-colors cursor-pointer border border-slate-200 font-bold text-xs flex items-center gap-1"
            title="Căn giữa toàn chợ"
            aria-label="Căn giữa bản đồ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Căn giữa</span>
          </button>
        </div>
      </div>

      {/* TOOLTIP NỔI KHI RÊ CHUỘT QUA SẠP */}
      {tooltipData && !isPanning && (
        <div
          className="fixed pointer-events-none z-50 bg-slate-900/95 text-white p-3 rounded-lg shadow-2xl border border-slate-700/80 text-xs font-sans min-w-[210px] backdrop-blur-sm"
          style={{
            left: `${tooltipData.clientX + 16}px`,
            top: `${tooltipData.clientY - 40}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5 mb-1.5">
            <span className="font-extrabold font-mono text-emerald-400 text-sm">
              SẠP {tooltipData.stall.code}
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
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Sự cố: {tooltipData.stall.state.issues?.[0]?.description || 'Cần xử lý khẩn cấp'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PureArchitectural25dRenderer;
