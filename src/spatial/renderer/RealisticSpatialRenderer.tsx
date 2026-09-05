'use client';

import React, { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Eye, Wrench, Layers, Sparkles } from 'lucide-react';
import type { FloorEntity, StallEntity } from '../model/types';

const MOBILE_VIEWPORT_QUERY = '(max-width: 639px)';

function subscribeToViewport(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
  mediaQuery.addEventListener('change', onChange);
  Promise.resolve().then(onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getViewportSnapshot() {
  return typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
}

function getServerViewportSnapshot() {
  return false;
}

export interface RealisticSpatialRendererProps {
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

export const RealisticSpatialRenderer: React.FC<RealisticSpatialRendererProps> = ({
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
  const [tooltipData, setTooltipData] = useState<{
    stall: StallEntity;
    clientX: number;
    clientY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const isEntityHighlighted = useCallback(
    (id: string) => {
      if (!highlightedEntityIds) return true;
      if (highlightedEntityIds instanceof Set) return highlightedEntityIds.has(id);
      return Array.isArray(highlightedEntityIds) && highlightedEntityIds.includes(id);
    },
    [highlightedEntityIds]
  );

  const handleStallClick = (e: React.MouseEvent | React.KeyboardEvent, stall: StallEntity) => {
    e.stopPropagation();
    const clientX = ('clientX' in e && typeof (e as React.MouseEvent).clientX === 'number' && (e as React.MouseEvent).clientX > 0)
      ? (e as React.MouseEvent).clientX
      : 500;
    const clientY = ('clientY' in e && typeof (e as React.MouseEvent).clientY === 'number' && (e as React.MouseEvent).clientY > 0)
      ? (e as React.MouseEvent).clientY
      : 300;
    
    setTooltipData(null);
    onSelectEntity?.({
      ...stall,
      _clickClientPos: { clientX, clientY },
    });
  };

  const handleStallMouseEnter = (e: React.MouseEvent, stall: StallEntity) => {
    setHoveredStallId(stall.id);
    onHoverEntity?.(stall);
    setTooltipData({
      stall,
      clientX: e.clientX,
      clientY: e.clientY,
    });
  };

  const handleStallMouseLeave = () => {
    setHoveredStallId(null);
    onHoverEntity?.(null);
    setTooltipData(null);
  };

  const isNarrowViewport = useSyncExternalStore(subscribeToViewport, getViewportSnapshot, getServerViewportSnapshot);
  // ViewBox: on mobile (< 640px), focus on Zone A & A12 (width: 524 < 1000)
  const currentViewBox = isNarrowViewport ? '500 0 524 682' : '0 0 1024 682';

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none bg-slate-950 overflow-hidden flex items-center justify-center ${className}`}
    >
      {/* KHUNG HIỂN THỊ TRÀN VIỀN FULL KHUNG (XÓA BỎ HOÀN TOÀN 2 KHOẢNG ĐEN) */}

      {/* KHUNG HIỂN THỊ TRÀN VIỀN FULL KHUNG (XÓA BỎ HOÀN TOÀN 2 KHOẢNG ĐEN) */}
      <div className="relative w-full h-full flex items-center justify-center p-0 overflow-hidden">
        {/* INTERACTIVE SVG LAYER (1024 x 682 COORDINATE LOCK) */}
        <svg
          viewBox={currentViewBox}
          preserveAspectRatio="none"
          suppressHydrationWarning
          className="w-full h-full pointer-events-auto border-0 bg-slate-950"
        >
          <defs>
            {/* Lưới sàn gạch đá hoa cương / granite công nghệ cao */}
            <pattern id="market-granite-tile" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="#0f172a" />
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.65" />
              <circle cx="8" cy="8" r="0.8" fill="#334155" opacity="0.4" />
            </pattern>

            {/* Pattern sọc cảnh báo bốc dỡ hàng */}
            <pattern id="loading-hazard-stripes" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <rect width="6" height="12" fill="#d97706" opacity="0.3" />
              <rect x="6" width="6" height="12" fill="#1e293b" opacity="0.4" />
            </pattern>

            {/* Đổ bóng tường bao 2.5D */}
            <filter id="wall-shadow-25d" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#020617" floodOpacity="0.8" />
            </filter>

            {/* Đổ bóng quầy sạp 2.5D */}
            <filter id="stall-shadow-25d" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#020617" floodOpacity="0.55" />
            </filter>

            {/* Focus Ring Green Glow */}
            <filter id="focus-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#076C31" floodOpacity="0.85" />
            </filter>

            {/* P0 Danger Red Glow */}
            <filter id="danger-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ef4444" floodOpacity="0.9" />
            </filter>

            {/* Warning Amber Glow */}
            <filter id="warning-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f59e0b" floodOpacity="0.8" />
            </filter>

            {/* Keyframe Animations */}
            <style>{`
              @keyframes realistic-pulse {
                0% { r: 8px; opacity: 0.95; stroke-width: 2.5px; }
                50% { r: 20px; opacity: 0.35; stroke-width: 1.5px; }
                100% { r: 28px; opacity: 0; stroke-width: 0.5px; }
              }
              .realistic-sonar-wave {
                animation: realistic-pulse 2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
                transform-origin: center;
              }
              .realistic-sonar-wave-delayed {
                animation: realistic-pulse 2s cubic-bezier(0.1, 0.8, 0.3, 1) 0.8s infinite;
                transform-origin: center;
              }
              @keyframes pulse-halo {
                0%, 100% { stroke-opacity: 1; stroke-width: 2.5px; }
                50% { stroke-opacity: 0.5; stroke-width: 3.5px; }
              }
              .focus-halo-anim {
                animation: pulse-halo 1.8s ease-in-out infinite;
              }
            `}</style>
          </defs>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* NỀN SA BÀN: VECTOR 2.5D THUẦN TUÝ (KHÔNG SỬ DỤNG ẢNH RASTER)        */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <g id="pure-vector-architectural-base" pointerEvents="none">
            {/* 1. Sân ngoại vi chợ */}
            <rect x="0" y="0" width="1024" height="682" fill="#090d16" />

            {/* 2. Đường kẻ phân làn sân kỹ thuật ngoại cảnh */}
            <line x1="30" y1="25" x2="994" y2="25" stroke="#1e293b" strokeWidth="1" strokeDasharray="6,6" opacity="0.4" />
            <line x1="30" y1="657" x2="994" y2="657" stroke="#1e293b" strokeWidth="1" strokeDasharray="6,6" opacity="0.4" />
            <line x1="30" y1="25" x2="30" y2="657" stroke="#1e293b" strokeWidth="1" strokeDasharray="6,6" opacity="0.4" />
            <line x1="994" y1="25" x2="994" y2="657" stroke="#1e293b" strokeWidth="1" strokeDasharray="6,6" opacity="0.4" />

            {/* 3. Khối tường bao kiến trúc 2.5D dập nổi */}
            <g filter="url(#wall-shadow-25d)">
              <rect x="42" y="27" width="940" height="628" rx="14" fill="#131b2e" stroke="#334155" strokeWidth="2.5" />
              <rect x="44" y="29" width="936" height="4" rx="2" fill="#64748b" opacity="0.7" />
            </g>

            {/* 4. Sàn gạch hoa cương toàn bộ hành lang di chuyển */}
            <rect x="48" y="33" width="928" height="616" rx="10" fill="url(#market-granite-tile)" />

            {/* 5. Hai trục đại lộ hành lang trung tâm (North-South & East-West Spine) */}
            <rect x="495" y="33" width="55" height="616" fill="#0f172a" opacity="0.5" />
            <line x1="522" y1="33" x2="522" y2="649" stroke="#334155" strokeWidth="1" strokeDasharray="8,6" opacity="0.6" />

            <rect x="48" y="300" width="928" height="45" fill="#0f172a" opacity="0.5" />
            <line x1="48" y1="322" x2="976" y2="322" stroke="#334155" strokeWidth="1" strokeDasharray="8,6" opacity="0.6" />

            {/* Bãi tiếp nhận vận chuyển hàng hóa Đông & Tây */}
            <rect x="52" y="540" width="65" height="65" rx="6" fill="url(#loading-hazard-stripes)" stroke="#475569" strokeWidth="1" />
            <text x="84" y="576" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-mono">
              KHO TÂY
            </text>
            <rect x="907" y="540" width="65" height="65" rx="6" fill="url(#loading-hazard-stripes)" stroke="#475569" strokeWidth="1" />
            <text x="939" y="576" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-mono">
              KHO ĐÔNG
            </text>
          </g>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* PHIẾN SÀN NỔI 2.5D CỦA 5 PHÂN KHU CHỢ (ZONES SLABS)               */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {floor.zones?.map((zone) => {
            if (zone.geometry.type !== 'rectangle') return null;
            const { x, y, width, height } = zone.geometry;
            const isZoneSelected = selectedZone === zone.id;

            const zoneTheme = 
              zone.id === 'zone_A' ? { bg: '#042f2e', border: '#0d9488', title: '#2dd4bf', label: 'KHU A • HẢI SẢN & TƯƠI SỐNG' } :
              zone.id === 'zone_B' ? { bg: '#022c22', border: '#059669', title: '#34d399', label: 'KHU B • RAU CỦ QUẢ SẠCH' } :
              zone.id === 'zone_C' ? { bg: '#2d1804', border: '#d97706', title: '#fbbf24', label: 'KHU C • BÁCH HÓA ĐỒ KHÔ' } :
              zone.id === 'zone_D' ? { bg: '#171738', border: '#6366f1', title: '#a5b4fc', label: 'KHU D • THỜI TRANG MAY MẶC' } :
              { bg: '#082f49', border: '#0284c7', title: '#38bdf8', label: 'KHU E • ẨM THỰC ĐẶC SẢN' };

            return (
              <g key={zone.id} id={`zone-${zone.id}`}>
                {/* Phiến sàn nổi phân khu 2.5D */}
                <g pointerEvents="none">
                  <rect
                    x={x + 2}
                    y={y + 2}
                    width={width}
                    height={height}
                    rx="8"
                    fill="#020617"
                    opacity="0.6"
                  />
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx="8"
                    fill={zoneTheme.bg}
                    stroke={zoneTheme.border}
                    strokeWidth="1.8"
                    opacity={isZoneSelected ? 0.95 : 0.75}
                  />
                  <rect
                    x={x + 1}
                    y={y + 1}
                    width={width - 2}
                    height={24}
                    rx="7"
                    fill={zoneTheme.border}
                    opacity="0.25"
                  />
                  <text
                    x={x + 10}
                    y={y + 16}
                    fill={zoneTheme.title}
                    fontSize="9"
                    fontWeight="900"
                    className="font-mono tracking-wider"
                  >
                    {zoneTheme.label}
                  </text>
                </g>

                {/* Zone Outline khi được chọn */}
                {isZoneSelected && (
                  <rect
                    x={x - 4}
                    y={y - 4}
                    width={width + 8}
                    height={height + 8}
                    rx="10"
                    fill="none"
                    stroke="#076C31"
                    strokeWidth="3"
                    strokeDasharray="6,4"
                    className="focus-halo-anim"
                  />
                )}

                {/* Clickable Header Area of Zone */}
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={28}
                  rx="6"
                  fill="transparent"
                  className="cursor-pointer hover:fill-emerald-500/15 transition-colors"
                  onClick={() => onSelectZone?.(zone.id)}
                >
                  <title>{`Bấm để lọc chi tiết ${zone.name}`}</title>
                </rect>
              </g>
            );
          })}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* 86 QUẦY SẠP VECTOR 2.5D DẬP NỔI SIÊU NÉT (INFINITE RESOLUTION)     */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {floor.stalls?.map((stall) => {
            if (stall.geometry.type !== 'rectangle') return null;
            const { x, y, width: w, height: h } = stall.geometry;

            const isSelected = selectedEntityId === stall.id;
            const isHovered = hoveredStallId === stall.id;
            const isHighlighted = isEntityHighlighted(stall.id);

            // Operational status checks
            const isP0 = stall.code === 'A12' || stall.code === 'E08' || stall.state.highestSeverity === 'critical';
            const isWarningYellow = stall.code === 'B03' || (stall.state.contractDaysLeft <= 30 && stall.state.contractDaysLeft > 0);
            const isWarningOrange = stall.code === 'C11' || stall.state.feeStatus === 'overdue';
            const isDispatched = (stall.state as any)?.taskInfo?.dispatchStatus === 'in_progress';

            // Filter dimming
            const isDimmed = !isHighlighted;

            // Màu sạp theo trạng thái
            const boothFill = isSelected
              ? '#064e3b'
              : isP0
              ? '#7f1d1d'
              : isWarningOrange
              ? '#7c2d12'
              : isWarningYellow
              ? '#713f12'
              : isHovered
              ? '#1e3a8a'
              : '#0f172a';

            const boothStroke = isSelected
              ? '#10b981'
              : isP0
              ? '#ef4444'
              : isWarningOrange
              ? '#f97316'
              : isWarningYellow
              ? '#eab308'
              : isHovered
              ? '#60a5fa'
              : '#334155';

            return (
              <g
                key={stall.id}
                id={`stall-${stall.id}`}
                data-testid={`stall-${stall.code}`}
                data-stall-code={stall.code}
                tabIndex={0}
                role="button"
                aria-label={`Sạp ${stall.code} — ${stall.metadata?.name || 'Gian hàng tiêu chuẩn'}`}
                opacity={isDimmed ? 0.25 : 1.0}
                className="cursor-pointer focus-visible:outline-none"
                onClick={(e) => handleStallClick(e, stall)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStallClick(e, stall);
                  }
                }}
                onFocus={() => {
                  setHoveredStallId(stall.id);
                  onHoverEntity?.(stall);
                }}
                onBlur={() => {
                  setHoveredStallId(null);
                  onHoverEntity?.(null);
                }}
                onMouseEnter={(e) => handleStallMouseEnter(e, stall)}
                onMouseLeave={handleStallMouseLeave}
              >
                {/* 1. Bóng đổ quầy 2.5D */}
                <rect
                  x={x + 1}
                  y={y + 2}
                  width={w}
                  height={h}
                  rx="4"
                  fill="#020617"
                  opacity="0.45"
                  pointerEvents="none"
                />

                {/* 2. Base Clickable Booth Body (Nhận click và vẽ màu sắc nét) */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="4"
                  fill={boothFill}
                  stroke={boothStroke}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.2}
                />

                {/* 3. Gờ sáng viền bàn quầy & Số hiệu sạp vector HD */}
                <g pointerEvents="none">
                  <line
                    x1={x + 2}
                    y1={y + 1.5}
                    x2={x + w - 2}
                    y2={y + 1.5}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    opacity="0.65"
                  />
                  <text
                    x={x + w / 2}
                    y={y + h / 2 + (h > 40 ? 3 : 2.5)}
                    textAnchor="middle"
                    fill={isP0 ? '#fecaca' : isSelected ? '#a7f3d0' : isHovered ? '#bfdbfe' : '#f8fafc'}
                    fontSize={w > 50 ? 10.5 : 9}
                    fontWeight="800"
                    className="font-mono tracking-tight select-none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.85)' }}
                  >
                    {stall.code}
                  </text>
                </g>

                {/* 4. P0 Emergency Indicator Static Dot */}
                {isP0 && (
                  <circle
                    cx={x + w - 4}
                    cy={y + 6}
                    r="4.5"
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    filter="url(#danger-glow)"
                    pointerEvents="none"
                  />
                )}

                {/* 5. Warning Badges (B03, C11) */}
                {(isWarningYellow || isWarningOrange) && (
                  <circle
                    cx={x + w - 4}
                    cy={y + 6}
                    r="3.5"
                    fill={isWarningOrange ? '#f97316' : '#eab308'}
                    stroke="#ffffff"
                    strokeWidth="1"
                    filter="url(#warning-glow)"
                    pointerEvents="none"
                  />
                )}

                {/* 6. In-Progress Dispatch Badge */}
                {isDispatched && (
                  <g pointerEvents="none" transform={`translate(${x + 4}, ${y + 4})`}>
                    <rect width="44" height="13" rx="3" fill="#047857" opacity="0.95" />
                    <circle cx="7" cy="6.5" r="2.5" fill="#a7f3d0" className="motion-safe:animate-ping" />
                    <text x="14" y="9.5" fontSize="7.5" fontWeight="bold" fill="#ffffff" className="font-mono">
                      XỬ LÝ
                    </text>
                  </g>
                )}

                {/* 7. Selection Halo Ring với Smart Market Green */}
                {isSelected && (
                  <g pointerEvents="none">
                    <rect
                      x={x - 3}
                      y={y - 3}
                      width={w + 6}
                      height={h + 6}
                      rx="7"
                      fill="none"
                      stroke="#076C31"
                      strokeWidth="3"
                      filter="url(#focus-glow)"
                      className="focus-halo-anim"
                    />
                    <rect
                      x={x - 1}
                      y={y - 1}
                      width={w + 2}
                      height={h + 2}
                      rx="5"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                  </g>
                )}

                {/* 8. Hover Badge */}
                {isHovered && (
                  <g pointerEvents="none" transform={`translate(${x + w / 2}, ${y - 12})`}>
                    <rect
                      x="-24"
                      y="-8"
                      width="48"
                      height="16"
                      rx="3"
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="1"
                      opacity="0.95"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="9"
                      fontWeight="900"
                      className="font-mono tracking-wider"
                    >
                      {stall.code}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* P0 EMERGENCY SONAR PULSING RADAR BEACONS OVERLAY LAYER            */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <g id="emergency-sonar-beacons" pointerEvents="none">
            {floor.stalls
              ?.filter((stall) => stall.code === 'A12' || stall.code === 'E08' || stall.state.highestSeverity === 'critical')
              .map((stall) => {
                if (stall.geometry.type !== 'rectangle') return null;
                const { x, y, width: w } = stall.geometry;
                const beaconX = x + w - 4;
                const beaconY = y + 6;
                return (
                  <g key={`sonar-${stall.id}`}>
                    <circle
                      cx={beaconX}
                      cy={beaconY}
                      className="realistic-sonar-wave"
                      fill="none"
                      stroke="#ef4444"
                    />
                    <circle
                      cx={beaconX}
                      cy={beaconY}
                      className="realistic-sonar-wave-delayed"
                      fill="none"
                      stroke="#dc2626"
                    />
                  </g>
                );
              })}
          </g>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* 4 CỔNG RA VÀO DẬP NỔI 2.5D (BẮC, NAM, TÂY, ĐÔNG)                  */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {floor.gates?.map((gate) => {
            if (gate.geometry.type !== 'rectangle') return null;
            const { x, y, width, height } = gate.geometry;

            return (
              <g
                key={gate.id}
                id={`gate-${gate.id}`}
                className="cursor-pointer group"
                onClick={() => onSelectEntity?.(gate)}
              >
                {/* Khối kiến trúc cổng 2.5D */}
                <g pointerEvents="none">
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx="4"
                    fill="#064e3b"
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x + width / 2}
                    y={y + height / 2 + 3}
                    fill="#ffffff"
                    fontSize="8"
                    fontWeight="900"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {gate.name}
                  </text>
                </g>

                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx="3"
                  fill="rgba(7, 108, 49, 0.15)"
                  stroke="#076C31"
                  strokeWidth="1.5"
                  className="group-hover:fill-emerald-600/30 transition-all"
                >
                  <title>{`${gate.name} — Bấm xem luồng giao thông`}</title>
                </rect>
              </g>
            );
          })}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* CCTV CAMERAS & SENSORS HOTSPOTS                                   */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {showLayers.cctv &&
            floor.infrastructures
              ?.filter((infra) => infra.type === 'cctv_camera')
              .map((cam) => {
                if (cam.geometry.type !== 'point') return null;
                const [cx, cy] = cam.geometry.coordinates;

                return (
                  <g
                    key={cam.id}
                    id={`cam-${cam.id}`}
                    className="cursor-pointer group"
                    transform={`translate(${cx}, ${cy})`}
                    onClick={() => onSelectEntity?.(cam)}
                  >
                    <circle r="9" fill="rgba(15, 23, 42, 0.8)" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle r="3" fill="#38bdf8" className="group-hover:scale-125 transition-transform" />
                    <title>{`${cam.name} — Bấm xem luồng camera trực tiếp`}</title>
                  </g>
                );
              })}
        </svg>

        {/* HOVER INTERACTIVE TOOLTIP */}
        {tooltipData && (
          <div
            className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 bg-slate-900/95 text-white text-xs rounded-lg shadow-xl backdrop-blur-xs border border-slate-700 min-w-[200px]"
            style={{
              left: `${tooltipData.clientX}px`,
              top: `${tooltipData.clientY - 12}px`,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5 mb-1.5">
              <span className="font-mono font-extrabold text-sky-400 text-sm">
                SẠP {tooltipData.stall.code}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                {tooltipData.stall.metadata.category}
              </span>
            </div>
            <div className="space-y-0.5 text-[11px] text-slate-300 font-sans">
              <div>
                Chủ sạp: <strong className="text-white">{tooltipData.stall.metadata.merchantName}</strong>
              </div>
              <div>
                Doanh thu ước tính: <span className="text-emerald-400 font-bold">{tooltipData.stall.metadata.monthlyEstimatedRevenue}</span>
              </div>
              {tooltipData.stall.state.complaintsCount > 0 && (
                <div className="text-rose-400 font-bold flex items-center gap-1 mt-1 pt-1 border-t border-rose-900/50">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{tooltipData.stall.state.issues[0]?.title || 'Có sự cố khẩn cấp cần xử lý!'}</span>
                </div>
              )}
              {tooltipData.stall.state.feeStatus === 'overdue' && (
                <div className="text-amber-400 font-bold flex items-center gap-1 mt-1 pt-1 border-t border-amber-900/50">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Nợ phí dịch vụ: {tooltipData.stall.state.overdueAmount}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealisticSpatialRenderer;
