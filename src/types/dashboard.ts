/**
 * Dashboard & Operational Command Center Types
 * Chuẩn hoá theo dữ liệu thực tế từ backend Chợ Thông Minh (@smart-market/cms)
 */

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
  sublabel?: string;
}

export interface ShopFinancialMetric {
  stallId: string;
  stallName: string;
  revenue: number;
  cogs?: number;
  profit?: number;
  marginPercent?: number;
}

export interface RevenueAnomaly {
  stallId: string;
  stallName: string;
  posRevenue: number;
  cashlessRevenue: number;
  diffPercent: number;
  severity: 'high' | 'medium' | 'low';
  note?: string;
}

export interface SlaMetricReport {
  totalPending: number;
  dueSoon: number;      // < 15 phút hoặc < 1 giờ
  overdue: number;      // Đã vượt hạn cam kết SLA
  avgResponseMins: number;
}

export interface DashboardOverviewStats {
  marketCount: number;
  stallCount: number;
  occupiedStallCount: number;
  vacantStallCount: number;
  maintenanceStallCount: number;
  occupiedStallChangePercent: number;
  traderCount: number;
  traderFixedCount: number;
  traderCasualCount: number;
  pendingApplicationCount: number;
  newComplaintCount: number;
  complaintPendingCount: number;
  complaintResolvedCount: number;
  complaintTotalCount: number;
  billedAmount: number;
  paidAmount: number;
  debtAmount: number;
  completionRatePercent: number;
}
