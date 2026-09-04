/**
 * PRESENTATION ADAPTER — SMART MARKET SVG 2D
 * 
 * Maps Stall Visual Tokens & Canonical Spatial Entities to SVG presentation attributes.
 * Decouples domain/business logic from renderer drawing.
 */

import type { 
  StallEntity, 
  ZoneEntity, 
  AisleEntity, 
  FacilityEntity, 
  InfrastructureEntity, 
  IncidentEntity 
} from '../model/types';
import { getStallVisualTokens, SMART_MARKET_BRAND_GREEN } from '../presentation/stallVisualAdapter';

export interface StallSvgStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  textColor: string;
  subTextColor: string;
  primaryBadge: {
    label: string;
    bg: string;
    text: string;
    isPulsing?: boolean;
    count?: number;
  } | null;
  secondaryBadge: {
    label: string;
    bg: string;
    text: string;
    count?: number;
  } | null;
  hasHatch: boolean;
  selectionRing?: {
    stroke: string;
    strokeWidth: number;
  } | null;
}

export interface GenericEntityStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  textColor: string;
  isPulsing?: boolean;
}

/** Pick a readable label color for the solid zone ribbon (WCAG AA target). */
function getReadableZoneTextColor(hexColor: string): string {
  const match = hexColor.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!match) return '#0f172a';

  const channels = [0, 2, 4].map((offset) => parseInt(match[1].slice(offset, offset + 2), 16) / 255);
  const luminance = channels.reduce((sum, channel, index) => {
    const linear = channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  const whiteContrast = 1.05 / (luminance + 0.05);
  return whiteContrast >= 4.5 ? '#ffffff' : '#0f172a';
}

export function getStallSvgStyle(
  stall: StallEntity,
  options: { isSelected?: boolean; isHovered?: boolean } = {}
): StallSvgStyle {
  const tokens = getStallVisualTokens(stall, { isSelected: options.isSelected });
  const isHovered = options.isHovered ?? false;

  let fill = '#ffffff';
  let stroke = isHovered ? '#94a3b8' : '#e2e8f0';
  let strokeWidth = 1;
  let strokeDasharray: string | undefined = undefined;
  let textColor = '#0f172a';
  let subTextColor = '#64748b';

  switch (tokens.theme) {
    case 'complaint':
      fill = '#fff1f2'; // Rose-50
      stroke = isHovered ? '#be123c' : '#f43f5e'; // Rose-500
      strokeWidth = 1.8;
      textColor = '#881337'; // Rose-900
      subTextColor = '#9f1239';
      break;

    case 'expiring':
      fill = '#fffbeb'; // Amber-50
      stroke = isHovered ? '#d97706' : '#fbbf24'; // Amber-400
      strokeWidth = 1.5;
      textColor = '#78350f'; // Amber-900
      subTextColor = '#92400e';
      break;

    case 'maintenance':
      fill = '#fefce8'; // Yellow-50 (Vàng: bảo trì, ưu tiên thấp)
      stroke = isHovered ? '#ca8a04' : '#eab308'; // Yellow-500
      strokeWidth = 1.2;
      textColor = '#854d0e'; // Yellow-900
      subTextColor = '#a16207';
      break;

    case 'empty':
      fill = '#f8fafc'; // Slate-50/40
      stroke = isHovered ? '#64748b' : '#94a3b8'; // Slate-400
      strokeWidth = 1;
      strokeDasharray = '4,3';
      textColor = '#94a3b8';
      subTextColor = '#cbd5e1';
      break;

    case 'normal':
    default:
      fill = '#ffffff';
      stroke = isHovered ? '#64748b' : '#e2e8f0';
      strokeWidth = 1;
      textColor = '#1e293b';
      subTextColor = '#64748b';
      break;
  }

  // Primary badge mapping
  let primaryBadge: StallSvgStyle['primaryBadge'] = null;
  if (tokens.primaryBadge) {
    let bg = '#475569';
    let text = '#ffffff';

    if (tokens.primaryBadge.tone === 'critical_red') {
      bg = '#e11d48'; // Rose-600
      text = '#ffffff';
    } else if (tokens.primaryBadge.tone === 'warning_amber') {
      bg = '#f59e0b'; // Amber-500
      text = '#ffffff';
    } else if (tokens.primaryBadge.tone === 'neutral_slate') {
      bg = '#e2e8f0';
      text = '#334155';
    }

    primaryBadge = {
      label: tokens.primaryBadge.label,
      bg,
      text,
      isPulsing: tokens.primaryBadge.isPulsing,
      count: tokens.primaryBadge.count,
    };
  }

  // Secondary badge mapping
  let secondaryBadge: StallSvgStyle['secondaryBadge'] = null;
  if (tokens.secondaryBadge) {
    let bg = '#fef3c7'; // Amber-100
    let text = '#92400e'; // Amber-800
    if (tokens.secondaryBadge.tone === 'critical_red') {
      bg = '#ffe4e6'; // Rose-100
      text = '#9f1239'; // Rose-800
    }

    secondaryBadge = {
      label: tokens.secondaryBadge.label,
      bg,
      text,
      count: tokens.secondaryBadge.count,
    };
  }

  // Selection Ring mapping
  const selectionRing = tokens.isSelected
    ? {
        stroke: SMART_MARKET_BRAND_GREEN,
        strokeWidth: 2.5,
      }
    : null;

  return {
    fill,
    stroke,
    strokeWidth,
    strokeDasharray,
    textColor,
    subTextColor,
    primaryBadge,
    secondaryBadge,
    hasHatch: tokens.hasHatchPattern,
    selectionRing,
  };
}

// ----------------------------------------------------------------------------
// COMPATIBILITY & OTHER ENTITIES (ZONES, AISLES, INFRASTRUCTURE, INCIDENTS)
// ----------------------------------------------------------------------------

export function getStallPresentationStyle(
  stall: StallEntity, 
  isSelected = false, 
  isHovered = false
) {
  const svgStyle = getStallSvgStyle(stall, { isSelected, isHovered });
  return {
    fill: svgStyle.fill,
    stroke: svgStyle.stroke,
    strokeWidth: svgStyle.strokeWidth,
    strokeDasharray: svgStyle.strokeDasharray,
    textColor: svgStyle.textColor,
    primaryBadge: svgStyle.primaryBadge ? {
      label: svgStyle.primaryBadge.count ? `! ${svgStyle.primaryBadge.count} ${svgStyle.primaryBadge.label.toUpperCase()}` : svgStyle.primaryBadge.label.toUpperCase(),
      bg: svgStyle.primaryBadge.bg,
      text: svgStyle.primaryBadge.text,
    } : undefined,
    secondaryBadges: svgStyle.secondaryBadge ? [{
      type: 'contract',
      bg: svgStyle.secondaryBadge.bg,
      text: svgStyle.secondaryBadge.label,
      tooltip: svgStyle.secondaryBadge.label,
    }] : [],
    isPulsing: svgStyle.primaryBadge?.isPulsing ?? false,
  };
}

export function getZonePresentationStyle(zone: ZoneEntity, isHovered = false): GenericEntityStyle {
  const accent = zone.visualTheme?.colorToken || '#076C31';
  return {
    fill: accent,
    stroke: accent,
    strokeWidth: isHovered ? 1.5 : 1.0,
    strokeDasharray: '6,4',
    textColor: getReadableZoneTextColor(accent),
  };
}

export function getAislePresentationStyle(aisle: AisleEntity, isHovered = false): GenericEntityStyle {
  const isBlocked = !aisle.isClearOfObstacles;
  return {
    fill: 'none',
    stroke: isBlocked ? '#fecdd3' : '#f1f5f9',
    strokeWidth: aisle.geometry.type === 'path' ? (aisle.geometry.width || 25) : 25,
    strokeDasharray: isBlocked ? '8,4' : undefined,
    textColor: '#64748b',
  };
}

export function getInfrastructurePresentationStyle(infra: InfrastructureEntity, isHovered = false): GenericEntityStyle {
  const isClogged = infra.state?.status === 'clogged';
  return {
    fill: infra.geometry.type === 'point' ? (isClogged ? '#e11d48' : '#0284c7') : 'none',
    stroke: isClogged ? '#e11d48' : '#0284c7',
    strokeWidth: isHovered ? 3.0 : 2.0,
    strokeDasharray: infra.geometry.type === 'path' ? '4,3' : undefined,
    textColor: '#0284c7',
    isPulsing: isClogged,
  };
}

export function getIncidentPresentationStyle(incident: IncidentEntity, isHovered = false): GenericEntityStyle {
  const isCritical = incident.state.severity === 'critical';
  return {
    fill: isCritical ? '#e11d48' : '#d97706',
    stroke: '#ffffff',
    strokeWidth: 2.0,
    textColor: '#ffffff',
    isPulsing: true,
  };
}
