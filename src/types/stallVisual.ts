/**
 * STALL VISUAL CONTRACTS & TOKENS — SMART MARKET
 * Schema / Domain Type Definitions
 */

import type { StallEntity, OperationalIssue } from '../spatial/model/types';

export const SMART_MARKET_BRAND_GREEN = '#076C31';

export type StallVisualTheme = 
  | 'normal'        // Quiet baseline (slate/white, không badge)
  | 'complaint'     // Khẩn cấp P0 (Rose/Red semantic)
  | 'expiring'      // Hạn HĐ P2 (Amber/Orange warning)
  | 'maintenance'   // Bảo trì (Slate hatch pattern)
  | 'empty';        // Sạp trống (Dashed border)

export type StallVisualWeight = 'quiet' | 'alert_high' | 'warning_medium' | 'muted';

export type BadgeTone = 'critical_red' | 'warning_amber' | 'neutral_slate' | 'brand_green';

export interface StallVisualBadge {
  type: 'complaint' | 'expiring' | 'fee' | 'maintenance' | 'empty' | 'custom';
  label: string;
  count?: number;
  tone: BadgeTone;
  bgClass: string;
  textClass?: string;
  isPulsing?: boolean;
}

export interface StallVisualTokens {
  theme: StallVisualTheme;
  containerClasses: string;
  codeClasses: string;
  nameClasses: string;
  merchantClasses: string;
  primaryBadge: StallVisualBadge | null;
  secondaryBadge: StallVisualBadge | null;
  hasHatchPattern: boolean;
  isDashed: boolean;
  isSelected: boolean;
  selectionClasses: string;
  visualWeight: StallVisualWeight;
}

export interface StallVisualDescriptor {
  primaryTheme: StallVisualTheme;
  visualWeight: StallVisualWeight;
  primaryBadge: StallVisualBadge | null;
  secondaryBadge: StallVisualBadge | null;
  hasHatchPattern: boolean;
  isDashed: boolean;
  isSelected: boolean;
  selectionColor: string; // #076C31 Smart Market Green
  accessibleStatus: string;
  priority?: OperationalPriority;
  unifiedBadge?: UnifiedBadgeCluster | null;
  isDimmed?: boolean;
}

export interface StallAdapterOptions {
  isSelected?: boolean;
  isHovered?: boolean;
  operationalFilter?: OperationalFilter;
}

export type OperationalPriority = 'urgent' | 'attention' | 'maintenance' | 'normal';
export type OperationalFilter = 'all' | 'p0' | 'warning' | 'maintenance' | 'empty';

export interface UnifiedBadgeCluster {
  stallCode: string;
  priority: OperationalPriority;
  priorityLabel: string;
  priorityIcon: string;
  totalIssues: number;
  badgeBg: string;
  badgeText: string;
  isPulsing?: boolean;
}
