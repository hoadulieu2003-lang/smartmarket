'use client';

import React from 'react';
import type { StallEntity } from '../model/types';
import { getStallSvgStyle } from './presentationAdapter';
import { deriveStallVisual } from '../presentation/stallVisualAdapter';

export interface StallGlyphProps {
  stall: StallEntity;
  presentationGeometry?: StallEntity['geometry'];
  isSelected?: boolean;
  isHovered?: boolean;
  isMacroView?: boolean;
  isDimmed?: boolean;
  operationalFilter?: 'all' | 'p0' | 'warning' | 'maintenance' | 'empty';
  dutyView?: 'all' | 'sanitation' | 'security_fire' | 'finance';
  onSelect?: (stall: StallEntity) => void;
  onHover?: (stall: StallEntity, isHovered: boolean) => void;
}

export const StallGlyph: React.FC<StallGlyphProps> = ({
  stall,
  presentationGeometry,
  isSelected = false,
  isHovered = false,
  isMacroView = false,
  isDimmed: propDimmed,
  operationalFilter = 'all',
  dutyView = 'all',
  onSelect,
  onHover,
}) => {
  const style = getStallSvgStyle(stall, { isSelected, isHovered });
  const descriptor = deriveStallVisual(stall, { selected: isSelected, operationalFilter, dutyView });
  const unifiedBadge = descriptor.unifiedBadge;
  const dutyBadge = descriptor.dutyBadge;
  const isDimmed = propDimmed ?? descriptor.isDimmed ?? false;
  const renderGeometry = presentationGeometry ?? stall.geometry;

  // 1. Calculate Geometry & Center Point
  let centerX = 0;
  let centerY = 0;
  let width = 60;
  let height = 40;
  let rotationAngle = stall.rotation ?? (renderGeometry.type === 'rectangle' ? renderGeometry.rotation : undefined) ?? 0;

  if (renderGeometry.type === 'rectangle') {
    width = renderGeometry.width;
    height = renderGeometry.height;
    centerX = renderGeometry.x + width / 2;
    centerY = renderGeometry.y + height / 2;
  } else if (renderGeometry.type === 'polygon') {
    const xs = renderGeometry.vertices.map(v => v[0]);
    const ys = renderGeometry.vertices.map(v => v[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    width = maxX - minX;
    height = maxY - minY;
    centerX = (minX + maxX) / 2;
    centerY = (minY + maxY) / 2;
  }

  // Format polygon vertices string
  const formatPoints = (vertices: [number, number][]) => 
    vertices.map(v => `${v[0]},${v[1]}`).join(' ');

  // Rotation transform string
  let transformAttr: string | undefined = undefined;
  if (rotationAngle !== 0) {
    transformAttr = `rotate(${rotationAngle}, ${centerX}, ${centerY})`;
  }

  const isInteractive = Boolean(onSelect);

  // Keyboard accessibility handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(stall);
    }
  };

  // Scalable Typography based on Stall Dimensions (Phase Larger Stalls)
  const isLargeStall = width >= 80;
  const isMediumStall = width >= 54;
  const codeFontSize = isMacroView ? "12" : isLargeStall ? "16" : isMediumStall ? "14.5" : "12.5";
  const nameFontSize = isLargeStall ? "11.5" : isMediumStall ? "10.5" : "9";
  const badgeWidth = Math.max(28, Math.min(width - 6, isLargeStall ? 70 : isMediumStall ? 56 : 46));
  const badgeHeight = isLargeStall ? 14.5 : 13;
  const badgeFontSize = isLargeStall ? "8.5" : "7.8";

  // Check if stall has P0 urgent issue for pulsing sonar beacon
  const complaintsCount = (stall.state?.complaintsCount ?? (stall as any).complaintsCount ?? 0);
  const isComplaint = descriptor.primaryTheme === 'complaint' || complaintsCount > 0;
  const issue = (stall.state?.issues && stall.state.issues[0]) as any;
  const isP0 = isComplaint && (
    issue?.priority === 'P0' || stall.code === 'A12' || stall.code === 'E08' || stall.code === 'C11'
  );
  const taskInfo = (stall.state as any)?.taskInfo;
  const dispatchStatus = taskInfo?.dispatchStatus || issue?.status || 'open';
  const isPendingDispatch = dispatchStatus === 'open' || dispatchStatus === 'pending_dispatch';

  return (
    <g
      id={`stall-${stall.id}`}
      data-testid={`stall-glyph-${stall.code}`}
      data-state={descriptor.primaryTheme}
      data-priority={descriptor.priority || 'normal'}
      data-dimmed={isDimmed}
      data-selected={isSelected}
      opacity={isDimmed ? 0.30 : 1.0}
      filter={isDimmed ? 'grayscale(70%)' : undefined}
      className={`${isInteractive ? 'cursor-pointer' : 'cursor-default'} select-none transition-all duration-200 outline-none`}
      transform={transformAttr}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      aria-label={`Sạp ${stall.code}${unifiedBadge ? `, ${unifiedBadge.priorityLabel}, ${unifiedBadge.totalIssues} vấn đề` : ', Hoạt động bình thường'}`}
      onClick={(e) => {
        (stall as any)._clientPos = { x: e.clientX, y: e.clientY };
        onSelect?.(stall);
      }}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onHover?.(stall, true)}
      onMouseLeave={() => onHover?.(stall, false)}
    >

      {/* ------------------------------------------------------------- */}
      {/* LAYER 1: BASE GEOMETRY (RECTANGLE / POLYGON) */}
      {/* ------------------------------------------------------------- */}
      {renderGeometry.type === 'rectangle' ? (
        <rect
          x={renderGeometry.x}
          y={renderGeometry.y}
          width={width}
          height={height}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          rx="4"
          strokeDasharray={style.strokeDasharray}
          className={isInteractive ? 'hover:filter hover:brightness-95 transition-all' : ''}
        />
      ) : renderGeometry.type === 'polygon' ? (
        <polygon
          points={formatPoints(renderGeometry.vertices)}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          strokeDasharray={style.strokeDasharray}
        />
      ) : null}

      {/* REAL-WORLD STALL DETAILS: COUNTER EDGE + SMALL PRODUCT BAYS */}
      {renderGeometry.type === 'rectangle' && width >= 46 && height >= 38 && (
        <g pointerEvents="none" opacity="0.72">
          <rect
            x={renderGeometry.x + 4}
            y={renderGeometry.y + 4}
            width={Math.max(4, width - 8)}
            height={Math.max(3, height - 8)}
            fill="none"
            stroke={style.stroke}
            strokeWidth="0.8"
            opacity="0.5"
            rx="2"
          />
          <rect
            x={renderGeometry.x + 5}
            y={renderGeometry.y + height - 10}
            width={Math.max(6, width - 10)}
            height="5"
            fill={style.stroke}
            opacity="0.28"
            rx="1.5"
          />
          {[0, 1, 2].map((bay) => (
            <rect
              key={bay}
              x={renderGeometry.x + 7 + bay * Math.max(5, (width - 18) / 3)}
              y={renderGeometry.y + height - 9}
              width={Math.max(3, (width - 22) / 3)}
              height="3"
              fill={style.stroke}
              opacity="0.68"
              rx="0.75"
            />
          ))}
        </g>
      )}

      {/* DIRECTLY VISIBLE ATTENTION MARKER, COMPLEMENTING THE TEXT BADGE */}
      {(isP0 || unifiedBadge?.priority === 'attention') && (
        <g data-testid={`stall-issue-marker-${stall.code}`} pointerEvents="none">
          <circle
            cx={centerX + width / 2 - 2}
            cy={centerY - height / 2 + 2}
            r={Math.max(6, Math.min(10, width / 8))}
            fill={unifiedBadge?.badgeBg || '#e11d48'}
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x={centerX + width / 2 - 2}
            y={centerY - height / 2 + 5.5}
            textAnchor="middle"
            fontSize="9"
            fontWeight="900"
            fill="#ffffff"
          >
            !
          </text>
        </g>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LAYER 2: MAINTENANCE PATTERN OVERLAY */}
      {/* ------------------------------------------------------------- */}
      {style.hasHatch && (
        renderGeometry.type === 'rectangle' ? (
          <rect
            x={renderGeometry.x}
            y={renderGeometry.y}
            width={width}
            height={height}
            fill="url(#maintenance-hatch)"
            opacity="0.45"
            rx="3"
            pointerEvents="none"
          />
        ) : renderGeometry.type === 'polygon' ? (
          <polygon
            points={formatPoints(renderGeometry.vertices)}
            fill="url(#maintenance-hatch)"
            opacity="0.45"
            pointerEvents="none"
          />
        ) : null
      )}

      {/* ------------------------------------------------------------- */}
      {/* LAYER 3: LABELS & UNIFIED OPERATIONAL BADGE CLUSTER */}
      {/* ------------------------------------------------------------- */}
      {/* Line 1: Stall Code (A12, B07) - FONT LỚN RÕ NÉT */}
      <text
        x={centerX}
        y={unifiedBadge ? centerY - (height > 65 ? 12 : 8) : (!isMacroView && stall.metadata?.name ? centerY - (height > 65 ? 6 : 3) : centerY + 5)}
        textAnchor="middle"
        fontSize={codeFontSize}
        fontWeight="800"
        fontFamily="monospace"
        fill={style.textColor}
        className="tracking-tight"
        pointerEvents="none"
      >
        {stall.code}
      </text>

      {/* Sạp bình thường (Quiet by Default): Tên ngành hàng ngắn gọn khi không có sự cố */}
      {!unifiedBadge && !isMacroView && (
        <text
          x={centerX}
          y={centerY + (height > 65 ? 16 : 11)}
          textAnchor="middle"
          fontSize={nameFontSize}
          fontWeight="600"
          fill={style.subTextColor}
          className="tracking-normal font-sans"
          pointerEvents="none"
        >
          {stall.state?.occupancyStatus === 'empty' ? '(Trống)' : (() => {
            const rawName = stall.metadata?.name;
            const category = stall.metadata?.category;
            const isSynthetic = rawName && stall.code && (
              rawName.trim() === `${category} ${stall.code}` ||
              rawName.trim() === `${category} ${stall.code.slice(1)}`
            );
            const displayName = (isSynthetic ? category : rawName) || category || '';
            return displayName.length > (isLargeStall ? 16 : 13)
              ? `${displayName.slice(0, isLargeStall ? 15 : 12)}…`
              : displayName;
          })()}
        </text>
      )}

      {/* HUY HIỆU CA TRỰC KHI ĐANG TRỰC CA (DUTY BADGE) */}
      {dutyBadge && !isDimmed && (
        <g pointerEvents="none" transform={`translate(${centerX}, ${unifiedBadge ? centerY + (height > 65 ? 18 : 14) : centerY + 3})`}>
          <rect
            x={-badgeWidth / 2}
            y={-badgeHeight / 2}
            width={badgeWidth}
            height={badgeHeight}
            rx="3"
            fill={dutyBadge.color}
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.18))"
          />
          <text
            y="2.5"
            textAnchor="middle"
            fontSize={badgeFontSize}
            fontWeight="800"
            fill="#ffffff"
            className="tracking-tight"
          >
            {dutyBadge.label}
          </text>
        </g>
      )}

      {/* CỤM BADGE THỐNG NHẤT KHI CÓ SỰ CỐ / CẢNH BÁO */}
      {unifiedBadge && !dutyBadge && (
        <g pointerEvents="none">

          {/* Dòng 2: Badge Mức Ưu Tiên + Icon Hình Học (● P0 / ▲ Chú ý / 🔧 Bảo trì) */}
          <g transform={`translate(${centerX}, ${centerY + 3})`}>
            <rect
              x={-badgeWidth / 2}
              y={-badgeHeight / 2}
              width={badgeWidth}
              height={badgeHeight}
              rx="3"
              fill={unifiedBadge.badgeBg}
              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.18))"
            />
            <text
              y="2.5"
              textAnchor="middle"
              fontSize={badgeFontSize}
              fontWeight="800"
              fill={unifiedBadge.badgeText}
              className="tracking-tight"
            >
              {unifiedBadge.priorityLabel}
            </text>
          </g>

          {/* Dòng 3: Số vấn đề gộp */}
          <text
            x={centerX}
            y={centerY + (height > 65 ? 18 : 15)}
            textAnchor="middle"
            fontSize={badgeFontSize}
            fontWeight="700"
            fill={unifiedBadge.priority === 'urgent' ? '#be123c' : unifiedBadge.priority === 'attention' ? '#c2410c' : '#854d0e'}
            className="tracking-tight font-sans"
          >
            {style.secondaryBadge ? `${style.secondaryBadge.label} • ` : ''}
            {unifiedBadge.totalIssues > 1 ? `${unifiedBadge.totalIssues} vấn đề` : (
              !isMacroView && stall.metadata?.name ? `${stall.metadata.name.slice(0, isLargeStall ? 14 : 10)}` : '1 vấn đề'
            )}
          </text>
        </g>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LAYER 4: SELECTED FOCUS OVERLAY & GLOW (Smart Market Green #076C31) */}
      {/* ------------------------------------------------------------- */}
      {isSelected && (
        <g pointerEvents="none">
          <rect
            x={centerX - width / 2 - 3}
            y={centerY - height / 2 - 3}
            width={width + 6}
            height={height + 6}
            fill="none"
            stroke="#076C31"
            strokeWidth="2.5"
            rx="5"
            filter="drop-shadow(0 0 6px rgba(7, 108, 49, 0.5))"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={Math.max(width, height) / 2 + 7}
            fill="none"
            stroke="#076C31"
            strokeWidth="1.5"
            opacity="0.4"
            strokeDasharray="4 2"
          />
        </g>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LAYER 5: TRANSPARENT HIT TARGET (MINIMUM 44x44px FOR WCAG 2.2 AAA) */}
      {/* ------------------------------------------------------------- */}
      <rect
        x={centerX - Math.max(width, 44) / 2}
        y={centerY - Math.max(height, 44) / 2}
        width={Math.max(width, 44)}
        height={Math.max(height, 44)}
        fill="transparent"
        pointerEvents="all"
      />
    </g>
  );
};
