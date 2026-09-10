export type Role = 'super_admin' | 'province_admin' | 'market_manager' | 'user';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'reviewing' | 'need_more_info' | 'approved' | 'rejected' | 'cancelled';
export type ComplaintStatus = 'new' | 'processing' | 'resolved' | 'rejected' | 'escalated';
export type ComplaintType =
  | 'product_quality' | 'price_issue' | 'food_safety' | 'service_attitude'
  | 'weighing_fraud' | 'infrastructure' | 'order_issue' | 'other';
export type StallStatus = 'vacant' | 'occupied' | 'maintenance' | 'reserved';
export type DisplayStatus = StallStatus | 'expiring_soon' | 'has_complaint';
export type MerchantStatus = 'active' | 'suspended' | 'inactive';
export type NotificationTarget = 'market' | 'zone' | 'category' | 'user';

export interface Img { url: string }
export interface Meta { page: number; limit: number; total: number; totalPages: number }

export interface SessionUser {
  id: string; username?: string | null; fullName: string; avatar: string | null; phone: string | null;
  email: string | null; role: Role;
}

export interface Province { id: string; code: string; name: string; marketCount?: number }
export interface Category { id: string; name: string; description: string | null; displayOrder: number; parentId: string | null }

export interface Market {
  id: string; provinceId: string; code: string; name: string; address: string;
  latitude: number | null; longitude: number | null; phone: string | null; email: string | null;
  description: string | null; images: Img[]; openHours: string | null; mapLink: string | null; googleMapsUrl: string | null;
  status: 'active' | 'inactive'; createdAt: string;
  stallCount?: number; occupiedStallCount?: number; vacantStallCount?: number;
  traderCount?: number; ratingAvg?: number; zoneCount?: number;
  pendingApplicationCount?: number; openComplaintCount?: number;
  managers?: { id: string; fullName: string; email?: string; phone?: string }[];
}

export interface Zone {
  id: string; marketId: string; code: string; name: string; description: string | null;
  displayOrder: number; gridColumns: number | null; isActive: boolean;
  categories?: { id: string; name: string } | null;
  stallCount?: number; occupiedCount?: number; vacantCount?: number;
}

export interface ContractLite {
  id: string; startDate: string; endDate: string | null; daysLeft: number | null; fee: number;
  merchant: { id: string; fullName: string; phone?: string | null; avatar?: string | null };
}

export interface Stall {
  id: string; marketId: string; zoneId: string; code: string; name: string | null;
  description: string | null; images: Img[]; acreage: number | null; phone: string | null;
  openHours: string | null; status: StallStatus; displayOrder: number;
  displayStatus?: DisplayStatus; openComplaintCount?: number;
  currentContract?: ContractLite | null;
  zones?: { id: string; code: string; name: string };
  markets?: { id: string; name: string };
  categories?: { id: string; name: string } | null;
  revenue30d?: number; productCount?: number;
}

export interface Contract {
  id: string; stallId: string; merchantId: string; startDate: string; endDate: string | null;
  fee: number; content: string | null; endReason: string | null; endedAt: string | null;
  daysLeft?: number | null; createdAt: string;
  merchant?: { id: string; fullName: string; phone: string | null };
  stalls?: {
    id: string; code: string; name: string | null; marketId: string;
    zones?: { id: string; code: string; name: string } | null;
    markets?: { id: string; name: string };
  };
}

export interface Application {
  id: string; userId: string; marketId: string; categoryId: string | null;
  fullName: string; phone: string; idNumber: string;
  businessDescription: string | null; desiredStallNote: string | null;
  documents: Img[]; status: ApplicationStatus; adminNote: string | null;
  createdAt: string;
  markets?: { id: string; name: string }; categories?: { id: string; name: string } | null;
  applicant?: { id: string; fullName: string; avatar: string | null; phone?: string };
}

export interface Trader {
  id: string; fullName: string; avatar: string | null; phone: string | null; email: string | null;
  merchantStatus: MerchantStatus; merchantJoinedAt: string | null; merchantMarketId: string | null;
  sellerType?: 'casual' | 'shop';
  market?: { id: string; name: string } | null; category?: { id: string; name: string } | null;
  stall?: { id: string; code: string; name: string | null } | null;
  contractEndDate?: string | null; ratingAvg?: number; openComplaintCount?: number;
  currentContract?: Contract | null;
  bankName?: string | null; bankAccountNumber?: string | null; bankAccountHolder?: string | null;
}

export interface Product {
  id: string; stallId: string; categoryId: string; name: string; description: string | null;
  images: Img[]; price: number; unit: string; quantity: number; origin: string | null;
  isHidden: boolean; discountType?: 'percent' | 'fixed_price' | null; discountValue?: number | null;
  ratingAvg: number; reviewCount: number; createdAt: string;
  finalPrice?: number; isOnSale?: boolean; stockStatus?: 'in_stock' | 'out_of_stock';
  traceabilityQr?: string;
  stalls?: { id: string; code: string; name: string | null; marketId?: string; markets?: { id: string; name: string } };
  categories?: { id: string; name: string };
}

export interface OrderItem {
  id: string; productId: string; productName: string; productImage: string | null;
  unit: string; originalPrice: number; unitPrice: number; quantity: number; lineTotal: number;
}

export interface Order {
  id: string; code: string; customerId: string; marketId: string; stallId: string;
  status: OrderStatus; receiveType: 'pickup' | 'delivery';
  receiverName: string; receiverPhone: string; note: string | null; totalAmount: number;
  createdAt: string;
  orderItems?: OrderItem[]; itemCount?: number;
  stalls?: { id: string; code: string; name: string | null; phone?: string | null };
  markets?: { id: string; name: string };
}

export interface Complaint {
  id: string; userId: string; marketId: string; stallId: string | null; productId: string | null;
  type: ComplaintType; content: string; images: Img[]; status: ComplaintStatus;
  resolutionNote: string | null; resolvedAt: string | null; createdAt: string;
  markets?: { id: string; name: string };
  stalls?: { id: string; code: string; name: string | null } | null;
  reporter?: { id: string; fullName: string; phone?: string | null; avatar?: string | null };
  code?: string;
  severityLevel?: 'P0' | 'P1' | 'P2';
  coordinator?: { name: string; role: string; phone: string };
  zone?: string;
}

export interface NotificationRow {
  id: string; marketId: string | null; title: string; content: string;
  type: string; priority: 'normal' | 'important' | 'urgent';
  targetType: NotificationTarget; targetId: string | null;
  sentAt: string | null; createdAt: string;
  markets?: { id: string; name: string } | null;
}

export interface Audit {
  id: string; action: string; tableName: string | null; recordId: string | null;
  description: string | null; ipAddress: string | null; createdAt: string;
  actor?: { id: string; fullName: string; role: Role } | null;
}

export interface DashboardOverview {
  marketCount: number; stallCount: number; occupiedStallCount: number; vacantStallCount: number;
  traderCount: number; pendingApplicationCount: number; revenueThisMonth: number;
  orderCountThisMonth: number; newComplaintCount: number; expiringContractCount: number;
  avgRating: number; qrTransactionCount: number;
  traderFixedCount?: number; traderCasualCount?: number; occupiedStallChangePercent?: number;
  complaintTotalCount?: number; complaintResolvedCount?: number; complaintPendingCount?: number;
  feeCollectionByMethod?: { cash: number; bankTransfer: number; qrManual: number };
}
