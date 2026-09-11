/** Kiểu dữ liệu Smart Market API (camelCase, envelope { success, data, meta? }). Dùng chung backend với CMS. */

export type Role = 'super_admin' | 'province_admin' | 'market_manager' | 'user';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type ReceiveType = 'pickup' | 'delivery';
export type ApplicationStatus =
  | 'pending' | 'reviewing' | 'need_more_info' | 'approved' | 'rejected' | 'cancelled';
export type ComplaintStatus = 'new' | 'processing' | 'resolved' | 'rejected' | 'escalated';
export type ComplaintType =
  | 'product_quality' | 'price_issue' | 'food_safety' | 'service_attitude'
  | 'weighing_fraud' | 'infrastructure' | 'order_issue' | 'other';
export type MerchantStatus = 'active' | 'suspended' | 'inactive';
export type DiscountType = 'percent' | 'fixed_price';

/** Chế độ hoạt động của app (PRD 8.3): tài khoản có thể là seller nhưng đang ở mode buyer. */
export type AppMode = 'buyer' | 'seller';

export interface Img { url: string }
export interface Meta { page: number; limit: number; total: number; totalPages: number }
export interface Envelope<T> { success: boolean; data: T; meta?: Meta }
export interface ApiError { code: string; message: string; details?: unknown }

export interface Province { id: string; code: string; name: string }
export interface Category { id: string; name: string; description: string | null; displayOrder: number; parentId: string | null }
export interface PublicSettings { product_units: string[]; contract_default_duration_months: number }

export interface SessionUser {
  id: string; fullName: string; avatar: string | null; phone: string | null; email: string | null;
  gender: number | null; role: Role;
  bankName?: string | null; bankCode?: string | null;
  bankAccountNumber?: string | null; bankAccountHolder?: string | null;
}

export interface SellerContext {
  stallId: string; stallCode: string; stallName: string | null;
  marketId: string; marketName: string;
}

/** /auth/me — payload cho app (role = user). */
export interface MePayload {
  user: SessionUser;
  isMerchant: boolean;
  merchantStatus: MerchantStatus | null;
  merchantApplication: { id: string; status: ApplicationStatus; marketId: string; adminNote: string | null } | null;
  seller: SellerContext | null;
  selectedMarket: { id: string; name: string } | null;
}
export type LoginResponse = MePayload & { accessToken: string; refreshToken: string };

export interface MarketStats {
  stallCount?: number; occupiedStallCount?: number; vacantStallCount?: number;
  traderCount?: number; ratingAvg?: number; zoneCount?: number;
}
export interface Market extends MarketStats {
  id: string; provinceId: string; code: string; name: string; address: string;
  latitude: number | null; longitude: number | null; phone: string | null; email: string | null;
  description: string | null; images: Img[]; openHours: string | null; mapLink: string | null;
  status: 'active' | 'inactive';
  provinces?: { id: string; name: string };
  distanceKm?: number;
}

export interface StallAgg { ratingAvg?: number; reviewCount?: number; productCount?: number; hasPromotion?: boolean }
export interface Stall extends StallAgg {
  id: string; marketId: string; zoneId: string; code: string; name: string | null;
  description: string | null; images: Img[]; acreage: number | null; phone: string | null;
  openHours: string | null; status: string;
  zones?: { id: string; code: string; name: string };
  markets?: { id: string; name: string; status?: string; address?: string };
  categories?: { id: string; name: string } | null;
  merchant?: { id: string; fullName: string; avatar: string | null; merchantJoinedAt?: string | null } | null;
  contract?: { id: string; startDate: string; endDate: string | null; fee: number; daysLeft: number | null };
}

export interface Pricing { finalPrice?: number; isOnSale?: boolean; stockStatus?: 'in_stock' | 'out_of_stock' }
export interface ProductTraceability {
  id: string;
  productId: string;
  producerName: string;
  productionAddress: string | null;
  batchCode: string | null;
  productionDate: string | null;
  harvestDate: string | null;
  expiryDate: string | null;
  certificateName: string | null;
  certificateNumber: string | null;
  documents: Img[];
  externalUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Product extends Pricing {
  id: string; stallId: string; categoryId: string; name: string; description: string | null;
  images: Img[]; price: number; unit: string; quantity: number; origin: string | null;
  isHidden: boolean; discountType: DiscountType | null; discountValue: number | null;
  discountStartAt: string | null; discountEndAt: string | null;
  ratingAvg: number; reviewCount: number; createdAt: string;
  hasTraceability?: boolean;
  traceability?: ProductTraceability | null;
  stalls?: { id: string; code: string; name: string | null; phone?: string | null; marketId?: string; markets?: { id: string; name: string; status?: string }; zones?: { id: string; name: string }; merchant?: { id: string; fullName: string; avatar: string | null } };
  // GET /products/:id trả stall (số ít); list trả stalls. Hỗ trợ cả hai.
  stall?: { id: string; code: string; name: string | null; phone?: string | null; marketId?: string; markets?: { id: string; name: string; status?: string }; zones?: { id: string; name: string }; merchant?: { id: string; fullName: string; avatar: string | null } };
  categories?: { id: string; name: string };
  relatedProducts?: Product[];
}

export interface MarketHome {
  featuredTraders: Stall[];
  featuredProducts: Product[];
  saleProducts: Product[];
}

/** Item trong giỏ (client-side, PRD 12.8). */
export interface CartItem {
  productId: string; stallId: string; marketId: string;
  name: string; image: string | null; unit: string;
  unitPrice: number; originalPrice: number; quantity: number; maxQuantity: number;
  stallCode?: string; stallName?: string | null; marketName?: string;
}

export interface OrderItem {
  id: string; productId: string; productName: string; productImage: string | null;
  unit: string; originalPrice: number; unitPrice: number; quantity: number; lineTotal: number;
}
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
export interface OrderPayment { id: string; orderId: string; code: string; amount: number; provider: 'mock'; method: 'mock_qr'; status: PaymentStatus; qrPayload: string; expiresAt: string | null; referenceCode: string | null; failureReason: string | null; }
export interface Order {
  id: string; code: string; customerId: string; marketId: string; stallId: string;
  checkoutGroupId: string | null; status: OrderStatus; receiveType: ReceiveType;
  receiverName: string; receiverPhone: string; note: string | null; totalAmount: number;
  cancelReason: string | null; cancelledBy: 'buyer' | 'seller' | 'admin' | null;
  confirmedAt: string | null; preparingAt: string | null; readyAt: string | null;
  completedAt: string | null; cancelledAt: string | null; createdAt: string;
  orderItems?: OrderItem[]; itemCount?: number;
  firstItem?: { id: string; productName: string; productImage: string | null; quantity: number };
  stalls?: { id: string; code: string; name: string | null; phone?: string | null };
  markets?: { id: string; name: string; address?: string };
  payment?: OrderPayment | null;
  customer?: { id: string; fullName: string; avatar?: string | null; phone?: string | null };
}
export interface CheckoutResult { checkoutGroupId: string; orders: Order[] }

export interface Review {
  id: string; productId: string; orderId: string | null; userId: string;
  rating: number; content: string | null; images: Img[]; createdAt: string;
  reviewer?: { id: string; fullName: string; avatar: string | null };
  products?: { id: string; name: string; images?: Img[]; unit?: string };
  // /my/reviews trả product (số ít). Hỗ trợ cả hai.
  product?: { id: string; name: string; images?: Img[]; unit?: string };
}

export interface Complaint {
  id: string; userId: string; marketId: string; stallId: string | null; productId: string | null;
  type: ComplaintType; content: string; images: Img[]; status: ComplaintStatus;
  resolutionNote: string | null; resolutionImages: Img[]; resolvedAt: string | null; createdAt: string;
  markets?: { id: string; name: string };
  stalls?: { id: string; code: string; name: string | null } | null;
  products?: { id: string; name: string } | null;
}

export interface Application {
  id: string; userId: string; marketId: string; categoryId: string | null;
  fullName: string; phone: string; idNumber: string;
  businessDescription: string | null; desiredStallNote: string | null;
  documents: Img[]; status: ApplicationStatus; adminNote: string | null;
  reviewedAt: string | null; createdAt: string; updatedAt: string;
  markets?: { id: string; name: string }; categories?: { id: string; name: string } | null;
}

export interface AppNotification {
  id: string; marketId: string | null; title: string; content: string; type: string;
  priority: 'normal' | 'important' | 'urgent';
  targetType?: string; refType: string | null; refId: string | null; attachment: string | null;
  sentAt: string | null; readAt: string | null; isRead: boolean;
}

/** /seller/dashboard (khớp backend). */
export interface SellerDashboard {
  newOrderCount: number; processingOrderCount: number;
  sellingProductCount: number; outOfStockCount: number; onSaleCount: number;
  ratingAvg: number; todayRevenue: number;
  recentOrders: { id: string; code: string; status: OrderStatus; totalAmount: number; receiverName: string; createdAt: string }[];
}
