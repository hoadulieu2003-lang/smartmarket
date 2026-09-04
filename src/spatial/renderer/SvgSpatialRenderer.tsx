'use client';

import React, { useState, useEffect, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import { RotateCcw } from 'lucide-react';
import type { FloorEntity, StallEntity, SpatialGeometry } from '../model/types';
import { 
  getZonePresentationStyle, 
  getAislePresentationStyle, 
  getInfrastructurePresentationStyle, 
  getIncidentPresentationStyle 
} from './presentationAdapter';
import { StallGlyph } from './StallGlyph';
import { getMapPresentationLayout, getPresentationGeometry } from '../presentation/mapLayout';

export interface SvgSpatialRendererProps {
  floor: FloorEntity;
  selectedEntityId?: string | null;
  highlightedEntityIds?: Set<string> | string[] | null;
  onSelectEntity?: (entity: any) => void;
  onHoverEntity?: (entity: any) => void;
  showLayers?: {
    boundary?: boolean;
    zones?: boolean;
    aisles?: boolean;
    stalls?: boolean;
    gates?: boolean;
    facilities?: boolean;
    infrastructure?: boolean;
    incidents?: boolean;
    labels?: boolean;
  };
  className?: string;
  zoomLevel?: number;
  onSelectZone?: (zoneId: string) => void;
  selectedZone?: string | null;
  operationalFilter?: 'all' | 'p0' | 'warning' | 'maintenance' | 'empty';
}

function geometryBounds(geometry: SpatialGeometry) {
  if (geometry.type === 'rectangle') {
    return {
      minX: geometry.x,
      minY: geometry.y,
      maxX: geometry.x + geometry.width,
      maxY: geometry.y + geometry.height,
    };
  }

  if (geometry.type === 'polygon') {
    const xs = geometry.vertices.map(([x]) => x);
    const ys = geometry.vertices.map(([, y]) => y);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  }

  if (geometry.type === 'point') {
    const [x, y] = geometry.coordinates;
    return { minX: x, minY: y, maxX: x, maxY: y };
  }

  const xs = geometry.points.map(([x]) => x);
  const ys = geometry.points.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const MOBILE_VIEWPORT_QUERY = '(max-width: 639px)';

function subscribeToViewport(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getViewportSnapshot() {
  return typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
}

function getServerViewportSnapshot() {
  return false;
}

/**
 * GENERIC 2D SVG SPATIAL RENDERER — ARCHITECTURAL BLUEPRINT EDITION
 * 
 * Renders Canonical FloorEntity (v3.2.0) into responsive vector SVG.
 * Supports 160+ stalls, 5 Zonal color codings, Walkway geometry, CCTV Cones,
 * Scale Bar, and Visual Focus (Dim & Highlight).
 */
export const SvgSpatialRenderer: React.FC<SvgSpatialRendererProps> = ({
  floor,
  selectedEntityId = null,
  highlightedEntityIds = null,
  onSelectEntity,
  onHoverEntity,
  onSelectZone,
  selectedZone = null,
  operationalFilter = 'all',
  showLayers = {
    boundary: true,
    zones: true,
    aisles: true,
    stalls: true,
    gates: true,
    facilities: true,
    infrastructure: true,
    incidents: true,
    labels: true,
  },
  className = '',
  zoomLevel = 1.0,
}) => {
  const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null);

  // Pan & Drag Engine (Work Package C & D)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!floor || !floor.coordinateSystem) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-mono">
        [SPATIAL_RENDERER] Không có dữ liệu mặt bằng hợp lệ.
      </div>
    );
  }

  const layout = useMemo(() => getMapPresentationLayout(floor), [floor]);
  const { width: coordWidth, height: coordHeight } = layout.coordinateSystem;
  const isNarrowViewportSnapshot = useSyncExternalStore(subscribeToViewport, getViewportSnapshot, getServerViewportSnapshot);
  const isNarrowViewport = isNarrowViewportSnapshot || (typeof window !== 'undefined' && getViewportSnapshot());
  const mobileViewBox = useMemo(() => {
    if (!isNarrowViewport) return `0 0 ${coordWidth} ${coordHeight}`;

    const focusStall = floor.stalls.find((stall) => stall.code === 'A12')
      ?? floor.stalls.find((stall) => stall.state.hasActiveIssues)
      ?? floor.stalls[0];
    const focusGeometry = focusStall ? layout.stalls[focusStall.id] : null;
    if (!focusGeometry) return `0 0 ${coordWidth} ${coordHeight}`;

    const bounds = geometryBounds(focusGeometry);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const focusWidth = Math.min(coordWidth, Math.max(coordHeight * 0.72, coordWidth * 0.42));
    const x = clamp(centerX - focusWidth / 2, 0, coordWidth - focusWidth);
    return `${Math.round(x)} 0 ${Math.round(focusWidth)} ${coordHeight}`;
  }, [coordHeight, coordWidth, floor.stalls, isNarrowViewport, layout]);

  // Auto-center camera onto selectedZone when entering ZONE_FOCUS
  useLayoutEffect(() => {
    if (selectedZone) {
      const zone = floor.zones?.find((z) => z.id === selectedZone);
      const zoneGeometry = zone ? getPresentationGeometry(layout, zone.id, zone.geometry) : null;
      if (zoneGeometry) {
        const bounds = geometryBounds(zoneGeometry);
        const zCenterX = (bounds.minX + bounds.maxX) / 2;
        const zCenterY = (bounds.minY + bounds.maxY) / 2;
        const shiftX = (coordWidth / 2 - zCenterX) * 0.85;
        const shiftY = (coordHeight / 2 - zCenterY) * 0.85;
        setPan({ x: Math.round(shiftX), y: Math.round(shiftY) });
      }
    } else {
      setPan({ x: 0, y: 0 });
    }
  }, [selectedZone, coordWidth, coordHeight, floor.zones, layout]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleHover = (entity: any, isEntering: boolean) => {
    const target = isEntering ? entity : null;
    setInternalHoveredId(isEntering ? entity?.id : null);
    onHoverEntity?.(target);
  };

  const handleClick = (entity: any) => {
    onSelectEntity?.(entity);
  };

  const formatPoints = (vertices: [number, number][]) => 
    vertices.map(v => `${v[0]},${v[1]}`).join(' ');

  const formatPath = (points: [number, number][]) => {
    if (!points || points.length === 0) return '';
    const [start, ...rest] = points;
    return `M ${start[0]} ${start[1]} ` + rest.map(p => `L ${p[0]} ${p[1]}`).join(' ');
  };

  const infraList: any[] = floor.infrastructures || [];

  // Check if highlighted set is active
  const hasFilterActive = highlightedEntityIds != null && 
    (highlightedEntityIds instanceof Set ? highlightedEntityIds.size > 0 : highlightedEntityIds.length > 0);

  const isEntityHighlighted = (id: string) => {
    if (!hasFilterActive) return true;
    if (highlightedEntityIds instanceof Set) return highlightedEntityIds.has(id);
    return Array.isArray(highlightedEntityIds) && highlightedEntityIds.includes(id);
  };

  return (
    <div 
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-full select-none bg-slate-50/50 rounded overflow-hidden flex items-center justify-center ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      } ${className}`}
    >
      <svg
        suppressHydrationWarning
        viewBox={mobileViewBox}
        preserveAspectRatio={isNarrowViewport ? 'xMidYMid slice' : 'xMidYMid meet'}
        className="w-full h-full drop-shadow-sm font-sans block"
      >
        <defs>
          {/* Subtle Grid Hatch Pattern */}
          <pattern id="spatial-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
          </pattern>

          {/* Walkway Paver Pattern */}
          <pattern id="walkway-paver-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="#f8fafc" />
            <path d="M 0 0 L 16 0 M 0 8 L 16 8 M 8 0 L 8 8 M 0 8 L 0 16 M 16 8 L 16 16" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
          
          {/* Maintenance Diagonal Hatch Pattern */}
          <pattern id="maintenance-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="2" />
          </pattern>

          {/* CCTV Vision Cone Gradient */}
          <radialGradient id="cctv-vision-cone" cx="0%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#60a5fa" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
          </radialGradient>

          {/* Beacon & Radar Sonar Pulsing Animation Keyframes */}
          <style>{`
            @keyframes spatial-pulse {
              0% { transform: scale(0.95); opacity: 0.8; }
              50% { transform: scale(1.15); opacity: 0.3; }
              100% { transform: scale(0.95); opacity: 0.8; }
            }
            .spatial-pulsing-node, .spatial-pulsing-beacon {
              animation: spatial-pulse 1.8s infinite ease-in-out;
              transform-origin: center;
            }
            @keyframes spatial-sonar {
              0% { r: 25px; opacity: 0.9; stroke-width: 2.5px; }
              70% { r: 55px; opacity: 0.15; stroke-width: 1px; }
              100% { r: 65px; opacity: 0; stroke-width: 0.5px; }
            }
            .spatial-sonar-wave {
              animation: spatial-sonar 2.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
              transform-origin: center;
            }
            .spatial-sonar-wave-delayed {
              animation: spatial-sonar 2.2s cubic-bezier(0.1, 0.8, 0.3, 1) 0.9s infinite;
              transform-origin: center;
            }
          `}</style>
        </defs>

        {/* ============================================================= */}
        {/* PAN/ZOOM MOVABLE CANVAS GROUP (Work Package C & D) */}
        {/* ============================================================= */}
        <g transform={`translate(${pan.x}, ${pan.y})`} className="transition-transform duration-300 ease-out">

        {/* ------------------------------------------------------------- */}
        {/* LAYER 1: FLOOR BOUNDARY & GRID BACKGROUND */}
        {/* ------------------------------------------------------------- */}
        {showLayers.boundary && layout.boundary && (
          <g id="layer-boundary">
            {layout.boundary.type === 'polygon' && (
              <polygon
                points={formatPoints(layout.boundary.vertices)}
                fill="url(#spatial-grid-pattern)"
                stroke="#cbd5e1"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            )}
          </g>
        )}

        {/* ------------------------------------------------------------- */}
        {/* LAYER 2: ZONES (5 FUNCTIONAL REGIONS WITH TINTS & LABELS) */}
        {/* ------------------------------------------------------------- */}
        {showLayers.zones && floor.zones?.map(zone => {
          const isHovered = internalHoveredId === zone.id;
          const style = getZonePresentationStyle(zone, isHovered);
          const zoneColor = zone.visualTheme?.colorToken || '#076C31';
          const zoneGeometry = getPresentationGeometry(layout, zone.id, zone.geometry);

          return (
            <g key={zone.id} id={`zone-${zone.id}`}>
              {zoneGeometry.type === 'rectangle' ? (
                <>
                  <rect
                    x={zoneGeometry.x}
                    y={zoneGeometry.y}
                    width={zoneGeometry.width}
                    height={zoneGeometry.height}
                    fill="#f8fafc"
                    stroke={isHovered ? "#94a3b8" : "#e2e8f0"}
                    strokeWidth={1}
                    strokeDasharray="6,4"
                    rx="8"
                  />
                  {/* Zone Header Ribbon Banner với Huy hiệu Cấp 1 Toàn Chợ */}
                  {showLayers.labels && (() => {
                    const zoneStalls = floor.stalls?.filter(s => s.zoneId === zone.id || s.code.startsWith(zone.code)) || [];
                    const zoneIssuesCount = zoneStalls.filter(s => (s.state.complaintsCount > 0 || (s.state.issues && s.state.issues.length > 0))).length;
                    const hasP0InZone = zoneStalls.some(s => s.state.complaintsCount > 0 && ((s.state.issues?.[0] as any)?.priority === 'P0' || s.code === 'A12' || s.code === 'E08' || s.code === 'C11'));
                    const bannerWidth = Math.min(zoneGeometry.width - 16, 280);

                    return (
                      <g 
                        transform={`translate(${zoneGeometry.x + 8}, ${zoneGeometry.y + 6})`}
                        onClick={() => onSelectZone?.(zone.id)}
                        className="cursor-pointer group select-none"
                      >
                        <rect 
                          width={bannerWidth} 
                          height="20" 
                          rx="4" 
                          fill="#f1f5f9" 
                          stroke="#e2e8f0"
                          strokeWidth="1"
                        />
                        <circle cx="10" cy="10" r="3.5" fill="#64748b" />
                        <text
                          x="20"
                          y="14"
                          fill="#334155"
                          fontSize="10"
                          fontWeight="800"
                          className="tracking-wider uppercase font-mono"
                        >
                          {zone.name}
                        </text>

                        {/* CẤP 1 (MACRO VIEW): HUY HIỆU ĐẾM SỰ CỐ TỔNG HỢP THEO PHÂN KHU */}
                        {zoneIssuesCount > 0 && (
                          <g transform={`translate(${bannerWidth + 8}, 0)`}>
                            <rect
                              width="96"
                              height="20"
                              rx="4"
                              fill={hasP0InZone ? '#dc2626' : '#ea580c'}
                              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.18))"
                            />
                            <text
                              x="48"
                              y="13.5"
                              fill="#ffffff"
                              fontSize="8"
                              fontWeight="800"
                              textAnchor="middle"
                              className="font-sans font-bold"
                            >
                              {hasP0InZone ? `P0 • ${zoneIssuesCount} sự cố khẩn cấp` : `! • ${zoneIssuesCount} việc chú ý`}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </>
              ) : zoneGeometry.type === 'polygon' ? (
                <polygon
                  points={formatPoints(zoneGeometry.vertices)}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  strokeDasharray={style.strokeDasharray}
                />
              ) : null}
            </g>
          );
        })}

        {/* ------------------------------------------------------------- */}
        {/* LAYER 3: AISLES & CIRCULATION PATHWAYS (POLYGON & PATH) */}
        {/* ------------------------------------------------------------- */}
        {showLayers.aisles && floor.aisles?.map(aisle => {
          const isHovered = internalHoveredId === aisle.id;
          const style = getAislePresentationStyle(aisle, isHovered);
          const aisleGeometry = getPresentationGeometry(layout, aisle.id, aisle.geometry);

          return (
            <g key={aisle.id} id={`aisle-${aisle.id}`}>
              {aisleGeometry.type === 'polygon' && aisleGeometry.vertices && (
                <polygon
                  points={formatPoints(aisleGeometry.vertices)}
                  fill="url(#walkway-paver-pattern)"
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                />
              )}

              {aisleGeometry.type === 'path' && (
                <path
                  d={formatPath(aisleGeometry.points)}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={aisleGeometry.width || style.strokeWidth}
                  strokeLinecap={aisleGeometry.cap || 'round'}
                  strokeLinejoin={aisleGeometry.join || 'round'}
                  strokeDasharray={style.strokeDasharray}
                />
              )}
            </g>
          );
        })}

        {/* ------------------------------------------------------------- */}
        {/* LAYER 4: INFRASTRUCTURE (CCTV CONES, SENSORS, FIRE HYDRANTS) */}
        {/* ------------------------------------------------------------- */}
        {showLayers.infrastructure && infraList.map(infra => {
          const isHovered = internalHoveredId === infra.id;
          const style = getInfrastructurePresentationStyle(infra, isHovered);
          const infraGeometry = getPresentationGeometry(layout, infra.id, infra.geometry);

          return (
            <g 
              key={infra.id} 
              id={`infra-${infra.id}`}
              className="cursor-pointer"
              onClick={() => handleClick({ ...infra, entityType: 'infrastructure' })}
              onMouseEnter={() => handleHover(infra, true)}
              onMouseLeave={() => handleHover(infra, false)}
            >
              {/* CCTV Camera with Field of View Cone */}
              {(infra.type === 'cctv_camera' || infra.type === 'cctv') && (
                <g>
                  {(() => {
                    const cx = infraGeometry.type === 'point' ? infraGeometry.coordinates[0] : 0;
                    const cy = infraGeometry.type === 'point' ? infraGeometry.coordinates[1] : 0;
                    return (
                      <>
                        <path
                          d={`M ${cx} ${cy} L ${cx + 70} ${cy - 40} L ${cx + 70} ${cy + 40} Z`}
                          fill="url(#cctv-vision-cone)"
                          stroke="#60a5fa"
                          strokeWidth="0.5"
                          strokeDasharray="2,2"
                        />
                        <circle cx={cx} cy={cy} r="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                        <circle cx={cx} cy={cy} r="3" fill="#38bdf8" />
                        <text 
                          x={cx} 
                          y={cy + 16} 
                          textAnchor="middle" 
                          fontSize="9" 
                          fontWeight="bold" 
                          fill="#0284c7"
                          className="font-mono"
                        >
                          {infra.code}
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* Fire Hydrant */}
              {infra.type === 'fire_hydrant' && (
                <g>
                  {(() => {
                    const cx = infra.geometry.type === 'point' ? infra.geometry.coordinates[0] : (infra.geometry as any).cx || 0;
                    const cy = infra.geometry.type === 'point' ? infra.geometry.coordinates[1] : (infra.geometry as any).cy || 0;
                    return (
                      <>
                        <circle cx={cx} cy={cy} r="10" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" />
                        <circle cx={cx} cy={cy} r="4" fill="#dc2626" />
                        <text 
                          x={cx} 
                          y={cy + 16} 
                          textAnchor="middle" 
                          fontSize="8" 
                          fontWeight="extrabold" 
                          fill="#b91c1c"
                          className="font-mono"
                        >
                          {infra.code}
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* IoT Drainage & Waste Point */}
              {(infra.type === 'drainage' || infra.type === 'drainage_manhole' || infra.type === 'drainage_pipe' || infra.type === 'waste_point') && infraGeometry.type === 'rectangle' && (
                <g>
                  <rect
                    x={infraGeometry.x}
                    y={infraGeometry.y}
                    width={infraGeometry.width}
                    height={infraGeometry.height}
                    fill={String(infra.type).includes('drainage') ? '#e0f2fe' : '#fef3c7'}
                    stroke={String(infra.type).includes('drainage') ? '#0284c7' : '#d97706'}
                    strokeWidth="1.5"
                    rx="3"
                  />
                  <text
                    x={infraGeometry.x + infraGeometry.width / 2}
                    y={infraGeometry.y + infraGeometry.height / 2 + 3}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill={String(infra.type).includes('drainage') ? '#0369a1' : '#b45309'}
                    className="font-mono"
                  >
                    {String(infra.type).includes('drainage') ? 'H2O' : 'W'}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* ------------------------------------------------------------- */}
        {/* LAYER 5: FACILITIES (BQL OFFICE & FIRST AID) */}
        {/* ------------------------------------------------------------- */}
        {showLayers.facilities && floor.facilities?.map(facility => {
          const isHovered = internalHoveredId === facility.id;
          const isSelected = selectedEntityId === facility.id;
          const facilityGeometry = getPresentationGeometry(layout, facility.id, facility.geometry);

          if (facilityGeometry.type === 'rectangle') {
            const { x, y, width, height } = facilityGeometry;
            return (
              <g 
                key={facility.id} 
                id={`facility-${facility.id}`}
                className="cursor-pointer"
                onClick={() => handleClick({ ...facility, entityType: 'facility' })}
                onMouseEnter={() => handleHover(facility, true)}
                onMouseLeave={() => handleHover(facility, false)}
              >
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill="#f1f5f9"
                  stroke={isSelected ? '#076C31' : isHovered ? '#0f172a' : '#076C31'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  rx="4"
                  strokeDasharray="4,2"
                />
                <rect
                  x={x + 2}
                  y={y + 2}
                  width={width - 4}
                  height={16}
                  fill="#076C31"
                  rx="2"
                />
                <text
                  x={x + width / 2}
                  y={y + 13}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="#ffffff"
                  className="font-mono uppercase"
                >
                  {facility.code}
                </text>
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 10}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="#334155"
                >
                  BAN QUẢN LÝ
                </text>
              </g>
            );
          }
          return null;
        })}

        {/* ------------------------------------------------------------- */}
        {/* LAYER 6: GATES (6 ENTRY/EXIT PORTALS WITH REAL STREET NAMES) */}
        {/* ------------------------------------------------------------- */}
        {showLayers.gates && floor.gates?.map(gate => {
          const gateGeometry = getPresentationGeometry(layout, gate.id, gate.geometry);
          if (gateGeometry.type === 'rectangle') {
            const { x, y, width, height } = gateGeometry;
            const isEmergency = gate.type === 'emergency_exit';
            return (
              <g key={gate.id} id={`gate-${gate.id}`}>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={isEmergency ? '#e11d48' : '#076C31'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  rx="3"
                  className="shadow-sm"
                />
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 3.5}
                  textAnchor="middle"
                  fontSize={width < 50 ? '8' : '10'}
                  fontWeight="bold"
                  fill="#ffffff"
                  className="uppercase tracking-wider font-sans"
                >
                  {gate.name}
                </text>
              </g>
            );
          }
          return null;
        })}

        {/* ------------------------------------------------------------- */}
        {/* LAYER 7: STALLS (DISPATCH TO STALLGLYPH WITH VISUAL FOCUS DIM) */}
        {/* ------------------------------------------------------------- */}
        {showLayers.stalls && floor.stalls?.map(stall => {
          const isHighlighted = isEntityHighlighted(stall.id);
          const isSelected = selectedEntityId === stall.id;

          return (
            <g 
              key={stall.id} 
              opacity={isHighlighted ? 1.0 : 0.22}
              className="transition-opacity duration-200"
            >
              <StallGlyph
                stall={stall}
                presentationGeometry={layout.stalls[stall.id]}
                isSelected={isSelected}
                isHovered={internalHoveredId === stall.id}
                isMacroView={zoomLevel !== undefined && zoomLevel < 0.85}
                isDimmed={!isHighlighted}
                operationalFilter={operationalFilter}
                onSelect={handleClick}
                onHover={handleHover}
              />
            </g>
          );
        })}

        {/* ------------------------------------------------------------- */}
        {/* LAYER 8: INCIDENTS / SPATIAL ALERTS (P0 BEACONS) */}
        {/* ------------------------------------------------------------- */}
        {showLayers.incidents && floor.incidents?.map(incident => {
          const isSelected = selectedEntityId === incident.id;
          const style = getIncidentPresentationStyle(incident);
          const incidentGeometry = getPresentationGeometry(layout, incident.id, incident.geometry);

          const coords: [number, number] = incidentGeometry.type === 'point'
            ? incidentGeometry.coordinates
            : [0, 0];

          return (
            <g 
              key={incident.id} 
              id={`incident-${incident.id}`}
              className="cursor-pointer"
              transform={`translate(${coords[0]}, ${coords[1]})`}
              onClick={() => handleClick({ ...incident, entityType: 'incident' })}
            >
              <circle r="16" fill={style.fill} opacity="0.35" className="spatial-pulsing-node" />
              <circle r="9" fill={style.fill} stroke={isSelected ? '#076C31' : '#ffffff'} strokeWidth={isSelected ? 3 : 2} />
              <text y="3.5" textAnchor="middle" fontSize="10" fontWeight="extrabold" fill={style.textColor}>!</text>
            </g>
          );
        })}

        {/* ------------------------------------------------------------- */}
        {/* CAD SCALE BAR & ORIENTATION INDICATOR (BOTTOM-LEFT) */}
        {/* ------------------------------------------------------------- */}
        <g transform={`translate(30, ${Math.max(30, coordHeight - 30)})`}>
          <rect width="180" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="12" y1="12" x2="62" y2="12" stroke="#0f172a" strokeWidth="2" />
          <line x1="12" y1="8" x2="12" y2="16" stroke="#0f172a" strokeWidth="2" />
          <line x1="62" y1="8" x2="62" y2="16" stroke="#0f172a" strokeWidth="2" />
          <text x="70" y="15" fontSize="9" fontWeight="bold" fill="#334155" className="font-mono">
            50u = 5.0m • Tỷ lệ 1:100
          </text>
        </g>
        </g>
      </svg>

      {/* Floating Center Map Reset Button (Work Package C & D) */}
      {(pan.x !== 0 || pan.y !== 0) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPan({ x: 0, y: 0 });
          }}
          className="absolute bottom-4 right-4 z-20 px-3 py-1.5 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold rounded-lg shadow-md border border-slate-300 flex items-center gap-1.5 cursor-pointer backdrop-blur-xs transition-all hover:shadow-lg"
          title="Căn giữa lại khung nhìn toàn chợ"
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          <span>Căn giữa bản đồ</span>
        </button>
      )}
    </div>
  );
};

export default SvgSpatialRenderer;
