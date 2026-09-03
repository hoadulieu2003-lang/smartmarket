/**
 * STALL VISUAL ADAPTER — PHASE 3B.2.1
 * 
 * Pure function mapping Canonical Stall Data & Operational Issues to Visual Presentation Tokens.
 * Decouples 100% of styling, color semantics, and typography from Canonical Data.
 */

import type { StallEntity } from '../model/types';
import type { 
  StallVisualTokens, 
  StallVisualBadge, 
  StallVisualDescriptor, 
  StallVisualTheme, 
  StallVisualWeight,
  StallAdapterOptions,
  OperationalPriority,
  OperationalFilter,
  UnifiedBadgeCluster,
} from './stallVisual.types';

export const SMART_MARKET_BRAND_GREEN = '#076C31';

/**
 * Suy diễn mức độ ưu tiên vận hành duy nhất (Precedence: urgent > attention > maintenance > normal)
 */
export function deriveOperationalPriority(signals: {
  hasP0Incident?: boolean;
  hasComplaint?: boolean;
  isContractExpiring?: boolean;
  hasNonUrgentMaintenance?: boolean;
}): OperationalPriority {
  if (signals.hasP0Incident) return 'urgent';
  if (signals.hasComplaint || signals.isContractExpiring) return 'attention';
  if (signals.hasNonUrgentMaintenance) return 'maintenance';
  return 'normal';
}

/**
 * Kiểm tra xem sạp có bị làm mờ (dimmed) khi áp dụng bộ lọc vận hành hay không
 */
export function shouldDimStall(priority: OperationalPriority, filter: OperationalFilter): boolean {
  return filter === 'p0' && priority !== 'urgent';
}

/**
 * Pure adapter calculating visual tokens for Stall UI representation.
 */
export function getStallVisualTokens(
  stall: Partial<StallEntity> & {
    status?: string;
    isOccupied?: boolean;
    isUnderMaintenance?: boolean;
    complaintsCount?: number;
    daysLeftContract?: number;
  },
  options: StallAdapterOptions = {}
): StallVisualTokens {
  const { isSelected = false } = options;

  // 1. Normalize Canonical State
  const state = (stall.state || {}) as any;
  const isOccupied = stall.isOccupied ?? state.isOccupied ?? (stall.status !== 'empty');
  const isUnderMaintenance = stall.isUnderMaintenance ?? state.isUnderMaintenance ?? (stall.status === 'maintenance');
  
  const complaintsCount = stall.complaintsCount ?? state.complaintsCount ?? (stall.status === 'complaint' ? 1 : 0);
  const contractDaysLeft = stall.daysLeftContract ?? state.contractDaysLeft ?? (stall.status === 'expiring' ? 12 : undefined);
  const issues: any[] = state.issues || [];

  // Active issue detection
  const hasCriticalComplaint = complaintsCount > 0 || issues.some((i: any) => i.type === 'complaint' && i.status !== 'resolved' && i.status !== 'closed');
  const hasExpiringContract = (contractDaysLeft !== undefined && contractDaysLeft > 0 && contractDaysLeft <= 30) || issues.some((i: any) => i.type === 'contract_expiry');
  const hasFeeOverdue = issues.some((i: any) => i.type === 'fee_overdue');

  let theme: StallVisualTheme = 'normal';
  let visualWeight: StallVisualWeight = 'quiet';
  let containerClasses = 'bg-white border border-slate-200 text-slate-850 shadow-2xs hover:border-slate-350 hover:bg-slate-50/70 transition-colors';
  let codeClasses = 'font-mono text-[11px] font-semibold text-slate-500 tracking-tight';
  let nameClasses = 'font-semibold text-xs text-slate-900 leading-tight';
  let merchantClasses = 'text-[10px] text-slate-500 leading-tight';
  let primaryBadge: StallVisualBadge | null = null;
  let secondaryBadge: StallVisualBadge | null = null;
  let hasHatchPattern = false;
  let isDashed = false;

  // 2. EMPTY STATE
  if (!isOccupied || stall.status === 'empty') {
    theme = 'empty';
    isDashed = true;
    visualWeight = 'muted';
    containerClasses = 'bg-slate-50/40 border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:bg-slate-100/40';
    codeClasses = 'font-mono text-[11px] font-medium text-slate-400';
    nameClasses = 'font-medium text-xs text-slate-400 italic';
    merchantClasses = 'text-[10px] text-slate-400';
    primaryBadge = {
      type: 'empty',
      label: 'Sẵn sàng thuê',
      tone: 'neutral_slate',
      bgClass: 'bg-slate-100 text-slate-500 border border-slate-200',
    };
  }
  // 3. MAINTENANCE STATE
  else if (isUnderMaintenance || stall.status === 'maintenance') {
    theme = 'maintenance';
    hasHatchPattern = true;
    visualWeight = 'muted';
    containerClasses = 'bg-slate-100/70 border border-slate-300 text-slate-600 hover:border-slate-400';
    codeClasses = 'font-mono text-[11px] font-semibold text-slate-600';
    nameClasses = 'font-semibold text-xs text-slate-700 leading-tight';
    merchantClasses = 'text-[10px] text-slate-500';
    primaryBadge = {
      type: 'maintenance',
      label: 'Bảo trì kỹ thuật',
      tone: 'neutral_slate',
      bgClass: 'bg-slate-200/90 text-slate-700 border border-slate-300',
    };
  }
  // 4. COMPLAINT STATE (PRIMARY P0 - CRITICAL)
  else if (hasCriticalComplaint) {
    theme = 'complaint';
    visualWeight = 'alert_high';
    containerClasses = 'bg-rose-50/70 border-1.5 border-rose-500 text-rose-950 shadow-xs hover:bg-rose-50 hover:border-rose-600';
    codeClasses = 'font-mono text-[11px] font-bold text-rose-900';
    nameClasses = 'font-bold text-xs text-rose-950 leading-tight';
    merchantClasses = 'text-[10px] text-rose-800/80';
    
    primaryBadge = {
      type: 'complaint',
      label: 'phản ánh',
      count: complaintsCount || 1,
      tone: 'critical_red',
      bgClass: 'bg-rose-600 text-white font-bold shadow-2xs',
      textClass: 'text-white',
      isPulsing: true,
    };

    // Multi-status: secondary issue is rendered as smaller badge
    if (hasExpiringContract) {
      secondaryBadge = {
        type: 'expiring',
        label: `HĐ ${contractDaysLeft ?? 12}n`,
        tone: 'warning_amber',
        bgClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
        textClass: 'text-amber-900',
      };
    } else if (hasFeeOverdue) {
      secondaryBadge = {
        type: 'fee',
        label: 'Nợ phí',
        tone: 'critical_red',
        bgClass: 'bg-rose-100 text-rose-800 border border-rose-200 font-semibold',
        textClass: 'text-rose-800',
      };
    }
  }
  // 5. EXPIRING CONTRACT STATE (PRIMARY P2 - WARNING)
  else if (hasExpiringContract || stall.status === 'expiring') {
    theme = 'expiring';
    visualWeight = 'warning_medium';
    containerClasses = 'bg-amber-50/50 border border-amber-400 text-amber-950 shadow-2xs hover:bg-amber-50 hover:border-amber-500';
    codeClasses = 'font-mono text-[11px] font-bold text-amber-900';
    nameClasses = 'font-semibold text-xs text-amber-950 leading-tight';
    merchantClasses = 'text-[10px] text-amber-800/80';

    primaryBadge = {
      type: 'expiring',
      label: `Hạn ${contractDaysLeft ?? 12} ngày`,
      count: contractDaysLeft,
      tone: 'warning_amber',
      bgClass: 'bg-amber-500 text-white font-bold shadow-2xs',
      textClass: 'text-white',
    };

    if (hasFeeOverdue) {
      secondaryBadge = {
        type: 'fee',
        label: 'Nợ phí',
        tone: 'critical_red',
        bgClass: 'bg-rose-100 text-rose-800 border border-rose-200 font-semibold',
        textClass: 'text-rose-800',
      };
    }
  }
  // 6. NORMAL STATE (BASELINE — QUIET BY DEFAULT)
  else {
    theme = 'normal';
    visualWeight = 'quiet';
    primaryBadge = null;
    secondaryBadge = null;
  }

  // 7. SELECTED FOCUS TREATMENT (Smart Market Green #076C31)
  let selectionClasses = '';
  if (isSelected) {
    selectionClasses = 'ring-2 ring-[#076C31] ring-offset-1 border-[#076C31] shadow-md z-20';
  }

  return {
    theme,
    containerClasses,
    codeClasses,
    nameClasses,
    merchantClasses,
    primaryBadge,
    secondaryBadge,
    hasHatchPattern,
    isDashed,
    isSelected,
    selectionClasses,
    visualWeight,
  };
}

/**
 * Pure descriptor projection for SVG and 2.5D renderers.
 */
export function deriveStallVisual(
  stall: any,
  interaction: { selected?: boolean; focused?: boolean; operationalFilter?: OperationalFilter } = {}
): StallVisualDescriptor {
  const tokens = getStallVisualTokens(stall, { isSelected: interaction.selected });

  // 1. Phân tích tín hiệu vận hành thực tế (Operational Signals)
  const state = (stall.state || {}) as any;
  const issues: any[] = state.issues || [];
  const complaintsCount = stall.complaintsCount ?? state.complaintsCount ?? (stall.status === 'complaint' ? 1 : 0);
  const contractDaysLeft = stall.daysLeftContract ?? state.contractDaysLeft ?? (stall.status === 'expiring' ? 12 : undefined);
  const isUnderMaintenance = stall.isUnderMaintenance ?? state.isUnderMaintenance ?? (stall.status === 'maintenance');

  const hasP0Incident = issues.some((i: any) => i.priority === 'P0') || (complaintsCount > 0 && (stall.code === 'A12' || stall.code === 'E08' || stall.code === 'C11'));
  const hasComplaint = complaintsCount > 0;
  const isContractExpiring = (contractDaysLeft !== undefined && contractDaysLeft > 0 && contractDaysLeft <= 30) || issues.some((i: any) => i.type === 'contract_expiry');
  const hasNonUrgentMaintenance = isUnderMaintenance && !hasP0Incident;

  const priority = deriveOperationalPriority({
    hasP0Incident,
    hasComplaint,
    isContractExpiring,
    hasNonUrgentMaintenance,
  });

  // 2. Tính tổng số vấn đề cho Unified Badge Cluster
  let totalIssues = 0;
  if (hasComplaint) totalIssues += complaintsCount || 1;
  if (isContractExpiring) totalIssues += 1;
  if (isUnderMaintenance) totalIssues += 1;

  // 3. Xây dựng Cụm Badge Thống Nhất (Unified Badge Cluster - Phase 4)
  let unifiedBadge: UnifiedBadgeCluster | null = null;
  if (priority === 'urgent') {
    unifiedBadge = {
      stallCode: stall.code || '',
      priority: 'urgent',
      priorityLabel: '● Khẩn cấp',
      priorityIcon: '●',
      totalIssues: totalIssues > 0 ? totalIssues : 1,
      badgeBg: '#e11d48',
      badgeText: '#ffffff',
      isPulsing: true,
    };
  } else if (priority === 'attention') {
    unifiedBadge = {
      stallCode: stall.code || '',
      priority: 'attention',
      priorityLabel: '▲ Cần chú ý',
      priorityIcon: '▲',
      totalIssues: totalIssues > 0 ? totalIssues : 1,
      badgeBg: '#ea580c',
      badgeText: '#ffffff',
      isPulsing: false,
    };
  } else if (priority === 'maintenance') {
    unifiedBadge = {
      stallCode: stall.code || '',
      priority: 'maintenance',
      priorityLabel: '🔧 Bảo trì',
      priorityIcon: '🔧',
      totalIssues: 1,
      badgeBg: '#ca8a04',
      badgeText: '#ffffff',
      isPulsing: false,
    };
  }

  const isDimmed = interaction.operationalFilter ? shouldDimStall(priority, interaction.operationalFilter) : false;

  let accessibleStatus = 'Hoạt động bình thường';
  if (priority === 'urgent') {
    accessibleStatus = `Khẩn cấp: ${totalIssues} vấn đề cần xử lý ngay`;
  } else if (priority === 'attention') {
    accessibleStatus = `Cần chú ý: ${totalIssues} vấn đề (hạn hợp đồng hoặc nhắc nhở)`;
  } else if (priority === 'maintenance') {
    accessibleStatus = 'Đang bảo trì kỹ thuật';
  } else if (tokens.theme === 'empty') {
    accessibleStatus = 'Sạp trống sẵn sàng thuê';
  }

  if (tokens.isSelected) {
    accessibleStatus += ' (Đang được chọn)';
  }

  return {
    primaryTheme: tokens.theme,
    visualWeight: tokens.visualWeight,
    primaryBadge: tokens.primaryBadge,
    secondaryBadge: tokens.secondaryBadge,
    hasHatchPattern: tokens.hasHatchPattern,
    isDashed: tokens.isDashed,
    isSelected: tokens.isSelected,
    selectionColor: SMART_MARKET_BRAND_GREEN,
    accessibleStatus,
    priority,
    unifiedBadge,
    isDimmed,
  };
}
