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
  dutyBadge?: DutyBadgeInfo | null;
  isDimmed?: boolean;
}

export type DutyView = 'all' | 'sanitation' | 'security_fire' | 'finance';

export interface DutyBadgeInfo {
  duty: DutyView;
  label: string;
  iconName: string;
  color: string;
}

export interface StallAdapterOptions {
  isSelected?: boolean;
  isHovered?: boolean;
  operationalFilter?: OperationalFilter;
  dutyView?: DutyView;
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

/**
 * Kiểm tra xem sạp có khớp với góc nhìn ca trực đang chọn hay không
 */
export function isStallMatchingDuty(stall: Partial<StallEntity>, duty: DutyView): boolean {
  if (duty === 'all') return true;
  const state = (stall.state || {}) as any;
  const issues: any[] = state.issues || [];
  const code = stall.code || '';

  if (duty === 'sanitation') {
    return (
      code === 'A12' ||
      state.specificType === 'water' ||
      (typeof state.taskLabel === 'string' && state.taskLabel.includes('dọn rác')) ||
      issues.some(
        (i: any) =>
          i.specificType === 'water' ||
          i.title?.toLowerCase().includes('nước') ||
          i.title?.toLowerCase().includes('rác') ||
          i.title?.toLowerCase().includes('mùi') ||
          i.title?.toLowerCase().includes('vệ sinh')
      )
    );
  }

  if (duty === 'security_fire') {
    return (
      code === 'E08' ||
      code === 'B14' ||
      state.specificType === 'fire_safety' ||
      state.specificType === 'encroachment' ||
      issues.some(
        (i: any) =>
          i.specificType === 'fire_safety' ||
          i.specificType === 'encroachment' ||
          i.title?.toLowerCase().includes('gas') ||
          i.title?.toLowerCase().includes('lấn chiếm') ||
          i.title?.toLowerCase().includes('thoát hiểm') ||
          i.title?.toLowerCase().includes('cháy')
      )
    );
  }

  if (duty === 'finance') {
    const contractDaysLeft = (stall as any).daysLeftContract ?? state.contractDaysLeft;
    const feeStatus = state.feeStatus;
    return (
      code === 'C08' ||
      code === 'B03' ||
      feeStatus === 'overdue' ||
      (contractDaysLeft !== undefined && contractDaysLeft > 0 && contractDaysLeft <= 30) ||
      state.specificType === 'contract_expiry' ||
      state.specificType === 'fee_overdue' ||
      issues.some(
        (i: any) =>
          i.type === 'fee_overdue' ||
          i.type === 'contract_expiry' ||
          i.specificType === 'contract_expiry' ||
          i.title?.toLowerCase().includes('thu phí') ||
          i.title?.toLowerCase().includes('gia hạn')
      )
    );
  }

  return false;
}
