'use client';

import React from 'react';
import type { StallEntity } from '../model/types';
import { getStallSvgStyle } from './presentationAdapter';
import { deriveStallVisual } from '../presentation/stallVisualAdapter';

export interface StallGlyphProps {
  stall: StallEntity;
  isSelected?: boolean;
  isHovered?: boolean;
  isMacroView?: boolean;
  isDimmed?: boolean;
  operationalFilter?: 'all' | 'p0' | 'warning' | 'maintenance' | 'empty';
  onSelect?: (stall: StallEntity) => void;
  onHover?: (stall: StallEntity, isHovered: boolean) => void;
}

export const StallGlyph: React.FC<StallGlyphProps> = ({
  stall,
  isSelected = false,
  isHovered = false,
  isMacroView = false,
  isDimmed: propDimmed,
  operationalFilter = 'all',
  onSelect,
  onHover,
}) => {
  const style = getStallSvgStyle(stall, { isSelected, isHovered });
  const descriptor = deriveStallVisual(stall, { selected: isSelected, operationalFilter });
  const unifiedBadge = descriptor.unifiedBadge;
  const isDimmed = propDimmed ?? descriptor.isDimmed ?? false;

  // 1. Calculate Geometry & Center Point
  let centerX = 0;
  let centerY = 0;
  let width = 60;
  let height = 40;
  let rotationAngle = stall.rotation ?? stall.geometry.rotation ?? 0;

  if (stall.geometry.type === 'rectangle') {
    width = stall.geometry.width;
    height = stall.geometry.height;
    centerX = stall.geometry.x + width / 2;
    centerY = stall.geometry.y + height / 2;
  } else if (stall.geometry.type === 'polygon') {
    const xs = stall.geometry.vertices.map(v => v[0]);
    const ys = stall.geometry.vertices.map(v => v[1]);
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
  const badgeWidth = Math.max(28, Math.min(width - 6, isLargeStall ? 68 : isMediumStall ? 54 : 44));
  const badgeHeight = isLargeStall ? 13.5 : 12;
  const badgeFontSize = isLargeStall ? "8" : "7.2";

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
      opacity={isDimmed ? 0.22 : 1.0}
      filter={isDimmed ? 'grayscale(80%)' : undefined}
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
      {/* LAYER 0: P0 PULSING RADAR SONAR WAVES (TÂM ĐIỂM SỰ CỐ KHẨN CẤP) */}
      {/* ------------------------------------------------------------- */}
      {isP0 && isPendingDispatch && (
        <g pointerEvents="none">
          <circle
            cx={centerX}
            cy={centerY}
            r={Math.max(width, height) / 2 + 10}
            fill="none"
            stroke="#e11d48"
            strokeWidth="2"
            opacity="0.8"
            className="spatial-sonar-wave"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={Math.max(width, height) / 2 + 18}
            fill="none"
            stroke="#e11d48"
            strokeWidth="1.5"
            opacity="0.4"
            className="spatial-sonar-wave-delay"
          />
        </g>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LAYER 1: BASE GEOMETRY (RECTANGLE / POLYGON) */}
      {/* ------------------------------------------------------------- */}
      {stall.geometry.type === 'rectangle' ? (
        <rect
          x={stall.geometry.x}
          y={stall.geometry.y}
          width={width}
          height={height}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          rx="4"
          strokeDasharray={style.strokeDasharray}
          className={isInteractive ? 'hover:filter hover:brightness-95 transition-all' : ''}
        />
      ) : stall.geometry.type === 'polygon' ? (
        <polygon
          points={formatPoints(stall.geometry.vertices)}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          strokeDasharray={style.strokeDasharray}
        />
      ) : null}

      {/* ------------------------------------------------------------- */}
      {/* LAYER 2: MAINTENANCE PATTERN OVERLAY */}
      {/* ------------------------------------------------------------- */}
      {style.hasHatch && (
        stall.geometry.type === 'rectangle' ? (
          <rect
            x={stall.geometry.x}
            y={stall.geometry.y}
            width={width}
            height={height}
            fill="url(#maintenance-hatch)"
            opacity="0.45"
            rx="3"
            pointerEvents="none"
          />
        ) : stall.geometry.type === 'polygon' ? (
          <polygon
            points={formatPoints(stall.geometry.vertices)}
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
          {stall.metadata?.name ? (
            stall.metadata.name.length > (isLargeStall ? 16 : 13)
              ? `${stall.metadata.name.slice(0, isLargeStall ? 15 : 12)}…`
              : stall.metadata.name
          ) : (
            stall.metadata?.category || ''
          )}
        </text>
      )}

      {/* CỤM BADGE THỐNG NHẤT KHI CÓ SỰ CỐ / CẢNH BÁO */}
      {unifiedBadge && (
        <g pointerEvents="none">
          {/* Pulsing Sonar Beacon if P0 Urgent */}
          {unifiedBadge.isPulsing && (
            <circle
              cx={centerX}
              cy={centerY + 3}
              r={isLargeStall ? "16" : "13"}
              fill={unifiedBadge.badgeBg}
              opacity="0.25"
              className="spatial-pulsing-beacon"
            />
          )}

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
