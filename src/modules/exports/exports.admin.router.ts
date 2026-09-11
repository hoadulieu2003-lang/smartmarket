import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { validate } from '../../middlewares/validate.middleware';
import { assertMarketInScope, marketFilter, marketIdsForScope } from '../../shared/scope';
import { forbidden } from '../../shared/errors';
import { sendExcel, type ExcelSheet } from '../../shared/excel';
import { writeAudit } from '../../shared/audit.helper';
import { enrichStalls } from '../stalls/stalls.service';
import { marketStats } from '../markets/markets.service';

export const exportsAdminRouter = Router();

const resources = [
  'markets', 'stalls', 'traders', 'merchant-approvals', 'products',
  'orders', 'complaints', 'contracts', 'audits', 'users', 'reports',
] as const;

const querySchema = z.object({
  marketId: z.string().uuid().optional(),
  provinceId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  stallId: z.string().uuid().optional(),
  merchantId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.string().max(50).optional(),
  displayStatus: z.string().max(50).optional(),
  type: z.string().max(50).optional(),
  search: z.string().trim().max(255).optional(),
  includeHidden: z.coerce.boolean().optional(),
  activeOnly: z.coerce.boolean().optional(),
  expiringInDays: z.coerce.number().int().min(1).max(365).optional(),
  tableName: z.string().max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  groupBy: z.enum(['day', 'month']).default('day'),
});

const STATUS: Record<string, string> = {
  active: 'Hoạt động', inactive: 'Ngừng hoạt động', suspended: 'Tạm ngưng',
  vacant: 'Chưa thuê', occupied: 'Đang hoạt động', maintenance: 'Bảo trì', reserved: 'Giữ chỗ',
  expiring_soon: 'Sắp hết hạn', has_complaint: 'Có phản ánh', hidden: 'Đang ẩn',
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', preparing: 'Đang chuẩn bị', ready: 'Sẵn sàng lấy hàng', completed: 'Hoàn tất', cancelled: 'Đã hủy',
  reviewing: 'Đang xem xét', need_more_info: 'Yêu cầu bổ sung', approved: 'Đã duyệt', rejected: 'Từ chối',
  new: 'Mới', processing: 'Đang xử lý', resolved: 'Đã giải quyết', escalated: 'Chuyển cấp',
};

const COMPLAINT_TYPE: Record<string, string> = {
  product_quality: 'Chất lượng sản phẩm', price_issue: 'Giá bán', food_safety: 'An toàn thực phẩm',
  service_attitude: 'Thái độ phục vụ', weighing_fraud: 'Gian lận cân đo', infrastructure: 'Cơ sở vật chất',
  order_issue: 'Đơn hàng', other: 'Khác',
};

const date = (value: Date | null | undefined) => value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '';
const day = (value: Date | null | undefined) => value ? dayjs(value).format('DD/MM/YYYY') : '';
const label = (value: string | null | undefined) => value ? (STATUS[value] ?? value) : '';
const endDate = (value: Date | undefined) => value ? dayjs(value).endOf('day').toDate() : undefined;

async function scopeIds(req: any, marketId?: string) {
  if (marketId) {
    await assertMarketInScope(req.scope, marketId);
    return [marketId];
  }
  return marketIdsForScope(req.scope);
}

async function marketSheets(req: any, q: any): Promise<ExcelSheet[]> {
  const ids = await scopeIds(req, q.marketId);
  const where: Prisma.marketsWhereInput = {
    ...(ids ? { id: { in: ids } } : {}),
    province_id: q.provinceId,
    status: q.status,
    ...(q.search ? { OR: [
      { name: { contains: q.search, mode: 'insensitive' } },
      { code: { contains: q.search, mode: 'insensitive' } },
    ] } : {}),
  };
  const rows = await prisma.markets.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      provinces: { select: { name: true } },
      market_managers: { include: { users: { select: { full_name: true } } } },
    },
  });
  const stats = await marketStats(rows.map((row) => row.id));
  return [{
    name: 'Chợ',
    columns: [
      { header: 'Mã chợ', key: 'code' }, { header: 'Tên chợ', key: 'name', width: 28 },
      { header: 'Tỉnh/thành', key: 'province', width: 22 }, { header: 'Địa chỉ', key: 'address', width: 38 },
      { header: 'Google Maps', key: 'googleMapsUrl', width: 45 },
      { header: 'Vĩ độ', key: 'latitude' }, { header: 'Kinh độ', key: 'longitude' },
      { header: 'Trạng thái', key: 'status' }, { header: 'Số sạp', key: 'stallCount' },
      { header: 'Tiểu thương', key: 'traderCount' }, { header: 'Người quản lý', key: 'managers', width: 30 },
      { header: 'Ngày tạo', key: 'createdAt', width: 20 },
    ],
    rows: rows.map((row) => ({
      code: row.code, name: row.name, province: row.provinces.name, address: row.address,
      googleMapsUrl: row.google_maps_url ?? '', latitude: row.latitude?.toNumber() ?? '', longitude: row.longitude?.toNumber() ?? '',
      status: label(row.status), stallCount: stats.get(row.id)?.stall_count ?? 0,
      traderCount: stats.get(row.id)?.trader_count ?? 0,
      managers: row.market_managers.map((manager) => manager.users.full_name).join(', '), createdAt: date(row.created_at),
    })),
  }];
}

async function stallSheets(req: any, q: any): Promise<ExcelSheet[]> {
  const scopeWhere = await marketFilter(req.scope, q.marketId);
  const where: Prisma.stallsWhereInput = {
    ...scopeWhere, zone_id: q.zoneId, status: q.status,
    ...(q.search ? { OR: [
      { code: { contains: q.search, mode: 'insensitive' } },
      { name: { contains: q.search, mode: 'insensitive' } },
    ] } : {}),
  };
  const rows = await prisma.stalls.findMany({
    where, orderBy: [{ market_id: 'asc' }, { display_order: 'asc' }],
    include: { markets: true, zones: true, categories: true },
  });
  let enriched = await enrichStalls(rows);
  if (q.displayStatus) enriched = enriched.filter((row) => row.display_status === q.displayStatus);
  return [{
    name: 'Sạp',
    columns: [
      { header: 'Mã sạp', key: 'code' }, { header: 'Tên sạp', key: 'name', width: 25 },
      { header: 'Chợ', key: 'market', width: 25 }, { header: 'Khu vực', key: 'zone', width: 22 },
      { header: 'Diện tích (m²)', key: 'acreage' }, { header: 'Ngành hàng', key: 'category', width: 22 },
      { header: 'Trạng thái', key: 'status' }, { header: 'Tiểu thương', key: 'merchant', width: 25 },
      { header: 'Bắt đầu', key: 'startDate' }, { header: 'Hết hạn', key: 'endDate' },
    ],
    rows: enriched.map((row: any) => ({
      code: row.code, name: row.name ?? '', market: row.markets.name, zone: row.zones.name,
      acreage: row.acreage?.toNumber?.() ?? row.acreage ?? '', category: row.categories?.name ?? '',
      status: label(row.display_status), merchant: row.merchant?.full_name ?? '',
      startDate: day(row.contract?.start_date), endDate: day(row.contract?.end_date),
    })),
  }];
}

async function traderSheets(req: any, q: any): Promise<ExcelSheet[]> {
  const ids = await scopeIds(req, q.marketId);
  const where: Prisma.usersWhereInput = {
    role: 'user', merchant_status: q.status ?? { not: null }, merchant_category_id: q.categoryId,
    ...(ids ? { merchant_market_id: { in: ids } } : { merchant_market_id: { not: null } }),
    ...(q.search ? { OR: [
      { full_name: { contains: q.search, mode: 'insensitive' } }, { phone: { contains: q.search } },
      { email: { contains: q.search, mode: 'insensitive' } },
    ] } : {}),
  };
  const rows = await prisma.users.findMany({
    where, orderBy: { merchant_joined_at: 'desc' },
    include: { markets_users_merchant_market_idTomarkets: true, categories: true,
      contracts_contracts_merchant_idTousers: { where: { ended_at: null }, take: 1, include: { stalls: true } } },
  });
  return [{
    name: 'Tiểu thương',
    columns: [
      { header: 'Họ tên', key: 'name', width: 28 }, { header: 'Số điện thoại', key: 'phone' },
      { header: 'Email', key: 'email', width: 28 }, { header: 'Chợ', key: 'market', width: 25 },
      { header: 'Ngành hàng', key: 'category', width: 22 }, { header: 'Sạp', key: 'stall' },
      { header: 'Trạng thái', key: 'status' }, { header: 'Ngày tham gia', key: 'joinedAt' },
    ],
    rows: rows.map((row) => ({ name: row.full_name, phone: row.phone ?? '', email: row.email ?? '',
      market: row.markets_users_merchant_market_idTomarkets?.name ?? '', category: row.categories?.name ?? '',
      stall: row.contracts_contracts_merchant_idTousers[0]?.stalls.code ?? '', status: label(row.merchant_status),
      joinedAt: day(row.merchant_joined_at) })),
  }];
}

async function applicationSheets(req: any, q: any): Promise<ExcelSheet[]> {
  const where: Prisma.merchant_applicationsWhereInput = {
    ...(await marketFilter(req.scope, q.marketId)), status: q.status,
    ...(q.search ? { OR: [
      { full_name: { contains: q.search, mode: 'insensitive' } }, { phone: { contains: q.search } },
      { id_number: { contains: q.search } },
    ] } : {}),
  };
  const rows = await prisma.merchant_applications.findMany({
    where, orderBy: { created_at: 'desc' },
    include: { markets: true, categories: true,
      users_merchant_applications_reviewed_byTousers: { select: { full_name: true } } },
  });
  return [{
    name: 'Hồ sơ đăng ký',
    columns: [
      { header: 'Mã hồ sơ', key: 'id', width: 38 }, { header: 'Người đăng ký', key: 'name', width: 28 },
      { header: 'Số điện thoại', key: 'phone' }, { header: 'CCCD', key: 'idNumber' },
      { header: 'Chợ', key: 'market', width: 25 }, { header: 'Ngành hàng', key: 'category', width: 22 },
      { header: 'Trạng thái', key: 'status' }, { header: 'Lý do/Ghi chú', key: 'note', width: 40 },
      { header: 'Người duyệt', key: 'reviewer', width: 25 }, { header: 'Ngày gửi', key: 'createdAt' },
      { header: 'Ngày xử lý', key: 'reviewedAt' },
    ],
    rows: rows.map((row) => ({ id: row.id, name: row.full_name, phone: row.phone, idNumber: row.id_number,
      market: row.markets.name, category: row.categories?.name ?? '', status: label(row.status),
      note: row.admin_note ?? '', reviewer: row.users_merchant_applications_reviewed_byTousers?.full_name ?? '',
      createdAt: date(row.created_at), reviewedAt: date(row.reviewed_at) })),
  }];
}

async function productSheets(req: any, q: any): Promise<ExcelSheet[]> {
  const scopeWhere = await marketFilter(req.scope, q.marketId);
  const where: Prisma.productsWhereInput = {
    deleted_at: null, stall_id: q.stallId, stalls: scopeWhere,
    ...(q.includeHidden === false ? { is_hidden: false } : {}),
    ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
  };
  const rows = await prisma.products.findMany({ where, orderBy: { created_at: 'desc' },
    include: { stalls: { include: { markets: true, contracts: { where: { ended_at: null }, take: 1,
      include: { users_contracts_merchant_idTousers: { select: { full_name: true } } } } } }, categories: true,
      traceability: { select: { id: true } } } });
  return [{
    name: 'Sản phẩm',
    columns: [
      { header: 'Tên sản phẩm', key: 'name', width: 28 }, { header: 'Tiểu thương', key: 'merchant', width: 25 },
      { header: 'Sạp', key: 'stall' }, { header: 'Chợ', key: 'market', width: 25 },
      { header: 'Danh mục', key: 'category', width: 22 }, { header: 'Đơn vị', key: 'unit' },
      { header: 'Giá', key: 'price', numFmt: '#,##0 [$₫-vi-VN]' }, { header: 'Tồn kho', key: 'quantity' },
      { header: 'Nguồn gốc', key: 'origin', width: 30 }, { header: 'Thông tin truy xuất', key: 'traceability' },
      { header: 'Hiển thị', key: 'visible' },
      { header: 'Ngày tạo', key: 'createdAt' },
    ],
    rows: rows.map((row) => ({ name: row.name,
      merchant: row.stalls.contracts[0]?.users_contracts_merchant_idTousers.full_name ?? '',
      stall: row.stalls.code, market: row.stalls.markets.name, category: row.categories.name, unit: row.unit,
      price: row.price.toNumber(), quantity: row.quantity.toNumber(), origin: row.origin ?? '',
      traceability: row.traceability ? 'Có thông tin' : 'Chưa có',
      visible: row.is_hidden ? 'Đang ẩn' : 'Đang hiển thị', createdAt: date(row.created_at) })),
  }];
}

async function orderSheets(req: any, q: any): Promise<ExcelSheet[]> {
  const where: Prisma.ordersWhereInput = {
    ...(await marketFilter(req.scope, q.marketId)), stall_id: q.stallId, status: q.status,
    ...(q.from || q.to ? { created_at: { gte: q.from, lte: endDate(q.to) } } : {}),
  };
  const rows = await prisma.orders.findMany({ where, orderBy: { created_at: 'desc' },
    include: { markets: true, stalls: true, users: { select: { full_name: true } } } });
  return [{
    name: 'Đơn hàng',
    columns: [
      { header: 'Mã đơn', key: 'code', width: 24 }, { header: 'Chợ', key: 'market', width: 25 },
      { header: 'Sạp', key: 'stall' }, { header: 'Khách hàng', key: 'customer', width: 25 },
      { header: 'Người nhận', key: 'receiver', width: 25 }, { header: 'SĐT nhận', key: 'phone' },
      { header: 'Trạng thái', key: 'status' }, { header: 'Tổng tiền', key: 'total', numFmt: '#,##0 [$₫-vi-VN]' },
      { header: 'Ngày đặt', key: 'createdAt' }, { header: 'Hoàn tất', key: 'completedAt' },
      { header: 'Ngày hủy', key: 'cancelledAt' },
    ],
    rows: rows.map((row) => ({ code: row.code, market: row.markets.name, stall: row.stalls.code,
      customer: row.users?.full_name ?? row.receiver_name, receiver: row.receiver_name, phone: row.receiver_phone,
      status: label(row.status), total: row.total_amount.toNumber(), createdAt: date(row.created_at),
      completedAt: date(row.completed_at), cancelledAt: date(row.cancelled_at) })),
  }];
}

async function complaintSheets(req: any, q: any): Promise<ExcelSheet[]> {
  const where: Prisma.complaintsWhereInput = {
    ...(await marketFilter(req.scope, q.marketId)), status: q.status, type: q.type, stall_id: q.stallId,
    ...(q.from || q.to ? { created_at: { gte: q.from, lte: endDate(q.to) } } : {}),
  };
  const rows = await prisma.complaints.findMany({ where, orderBy: { created_at: 'desc' },
    include: { markets: true, stalls: true, products: true, users: { select: { full_name: true, phone: true } } } });
  return [{
    name: 'Phản ánh',
    columns: [
      { header: 'Mã', key: 'id', width: 38 }, { header: 'Người gửi', key: 'reporter', width: 25 },
      { header: 'Số điện thoại', key: 'phone' }, { header: 'Chợ', key: 'market', width: 25 },
      { header: 'Sạp', key: 'stall' }, { header: 'Sản phẩm', key: 'product', width: 25 },
      { header: 'Loại', key: 'type', width: 22 }, { header: 'Trạng thái', key: 'status' },
      { header: 'Nội dung', key: 'content', width: 45 }, { header: 'Ngày tạo', key: 'createdAt' },
    ],
    rows: rows.map((row) => ({ id: row.id, reporter: row.users?.full_name ?? row.reporter_contact ?? 'Khách vãng lai', phone: row.users?.phone ?? row.reporter_contact ?? '',
      market: row.markets.name, stall: row.stalls?.code ?? '', product: row.products?.name ?? '',
      type: COMPLAINT_TYPE[row.type] ?? row.type, status: label(row.status),
      content: row.content, createdAt: date(row.created_at) })),
  }];
}

async function contractSheets(req: any, q: any): Promise<ExcelSheet[]> {
  const ids = await scopeIds(req, q.marketId);
  const where: Prisma.contractsWhereInput = {
    merchant_id: q.merchantId, ...(q.activeOnly || q.expiringInDays ? { ended_at: null } : {}),
    ...(q.expiringInDays ? { end_date: { gte: dayjs().startOf('day').toDate(), lte: dayjs().add(q.expiringInDays, 'day').endOf('day').toDate() } } : {}),
    ...(ids ? { stalls: { market_id: { in: ids } } } : {}),
  };
  const rows = await prisma.contracts.findMany({ where, orderBy: { created_at: 'desc' },
    include: { stalls: { include: { markets: true } }, users_contracts_merchant_idTousers: true } });
  return [{
    name: 'Hợp đồng',
    columns: [
      { header: 'Chợ', key: 'market', width: 25 }, { header: 'Sạp', key: 'stall' },
      { header: 'Tiểu thương', key: 'merchant', width: 25 }, { header: 'SĐT', key: 'phone' },
      { header: 'Bắt đầu', key: 'startDate' }, { header: 'Hết hạn', key: 'endDate' },
      { header: 'Phí', key: 'fee', numFmt: '#,##0 [$₫-vi-VN]' }, { header: 'Trạng thái', key: 'status' },
      { header: 'Số ngày còn lại', key: 'daysLeft' },
    ],
    rows: rows.map((row) => ({ market: row.stalls.markets.name, stall: row.stalls.code,
      merchant: row.users_contracts_merchant_idTousers.full_name, phone: row.users_contracts_merchant_idTousers.phone ?? '',
      startDate: day(row.start_date), endDate: day(row.end_date), fee: row.fee.toNumber(),
      status: row.ended_at ? 'Đã kết thúc' : 'Đang hiệu lực',
      daysLeft: row.end_date && !row.ended_at ? dayjs(row.end_date).diff(dayjs().startOf('day'), 'day') : '' })),
  }];
}

async function auditSheets(req: any, q: any): Promise<ExcelSheet[]> {
  if (req.user.role !== 'super_admin') throw forbidden('PERM_DENIED', 'Chỉ Super Admin được xuất nhật ký');
  const rows = await prisma.system_audits.findMany({
    where: { table_name: q.tableName, ...(q.from || q.to ? { created_at: { gte: q.from, lte: endDate(q.to) } } : {}) },
    orderBy: { created_at: 'desc' }, include: { users: { select: { full_name: true, role: true } } },
  });
  return [{ name: 'Nhật ký', columns: [
    { header: 'Thời gian', key: 'createdAt' }, { header: 'Người thao tác', key: 'actor', width: 25 },
    { header: 'Vai trò', key: 'role' }, { header: 'Hành động', key: 'action', width: 25 },
    { header: 'Bảng', key: 'table' }, { header: 'Mô tả', key: 'description', width: 45 },
    { header: 'IP', key: 'ip' },
  ], rows: rows.map((row) => ({ createdAt: date(row.created_at), actor: row.users?.full_name ?? 'Hệ thống',
    role: row.users?.role ?? '', action: row.action, table: row.table_name ?? '', description: row.description ?? '', ip: row.ip_address ?? '' })) }];
}

async function userSheets(req: any): Promise<ExcelSheet[]> {
  if (req.user.role !== 'super_admin') throw forbidden('PERM_DENIED', 'Chỉ Super Admin được xuất người dùng CMS');
  const rows = await prisma.users.findMany({ where: { role: { not: 'user' } }, orderBy: { created_at: 'desc' },
    include: { provinces: true, market_managers: { include: { markets: true } } } });
  return [{ name: 'Người dùng CMS', columns: [
    { header: 'Họ tên', key: 'name', width: 28 }, { header: 'Email', key: 'email', width: 28 },
    { header: 'Số điện thoại', key: 'phone' }, { header: 'Vai trò', key: 'role' },
    { header: 'Phạm vi', key: 'scope', width: 35 }, { header: 'Trạng thái', key: 'status' },
    { header: 'Ngày tạo', key: 'createdAt' },
  ], rows: rows.map((row) => ({ name: row.full_name, email: row.email ?? '', phone: row.phone ?? '', role: row.role,
    scope: row.provinces?.name ?? row.market_managers.map((manager) => manager.markets.name).join(', '),
    status: label(row.status), createdAt: date(row.created_at) })) }];
}

async function reportSheets(req: any, q: any): Promise<ExcelSheet[]> {
  const ids = await scopeIds(req, q.marketId);
  const from = q.from ?? dayjs().subtract(30, 'day').startOf('day').toDate();
  const to = endDate(q.to) ?? new Date();
  const marketWhere: Prisma.marketsWhereInput = ids ? { id: { in: ids } } : {};
  const orderWhere: Prisma.ordersWhereInput = { status: 'completed', completed_at: { gte: from, lte: to }, ...(ids ? { market_id: { in: ids } } : {}) };
  const marketCondOrders = ids ? Prisma.sql`AND o.market_id = ANY(${ids}::uuid[])` : Prisma.empty;
  const marketCondComplaints = ids ? Prisma.sql`AND cp.market_id = ANY(${ids}::uuid[])` : Prisma.empty;
  const [orders, markets, complaints, approvals, topRevenue, topComplained] = await Promise.all([
    prisma.orders.findMany({ where: orderWhere, select: { completed_at: true, total_amount: true } }),
    prisma.markets.findMany({ where: marketWhere, include: { stalls: true } }),
    prisma.complaints.findMany({ where: { created_at: { gte: from, lte: to }, ...(ids ? { market_id: { in: ids } } : {}) }, select: { type: true, status: true } }),
    prisma.merchant_applications.findMany({ where: { created_at: { gte: from, lte: to }, ...(ids ? { market_id: { in: ids } } : {}) }, select: { status: true } }),
    prisma.$queryRaw<{ full_name: string; stall_code: string; revenue: number; order_count: bigint }[]>`
      SELECT u.full_name, s.code AS stall_code,
             COALESCE(SUM(o.total_amount), 0)::float AS revenue, COUNT(o.id)::bigint AS order_count
      FROM orders o
      JOIN stalls s ON s.id = o.stall_id
      JOIN contracts c ON c.stall_id = s.id AND c.ended_at IS NULL
      JOIN users u ON u.id = c.merchant_id
      WHERE o.status = 'completed' AND o.completed_at BETWEEN ${from} AND ${to} ${marketCondOrders}
      GROUP BY u.id, u.full_name, s.code
      ORDER BY revenue DESC LIMIT 10`,
    prisma.$queryRaw<{ full_name: string; stall_code: string; complaint_count: bigint }[]>`
      SELECT u.full_name, s.code AS stall_code, COUNT(cp.id)::bigint AS complaint_count
      FROM complaints cp
      JOIN stalls s ON s.id = cp.stall_id
      JOIN contracts c ON c.stall_id = s.id AND c.ended_at IS NULL
      JOIN users u ON u.id = c.merchant_id
      WHERE cp.created_at BETWEEN ${from} AND ${to} ${marketCondComplaints}
      GROUP BY u.id, u.full_name, s.code
      ORDER BY complaint_count DESC LIMIT 10`,
  ]);
  const revenueMap = new Map<string, { revenue: number; count: number }>();
  for (const order of orders) {
    const key = dayjs(order.completed_at).format(q.groupBy === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD');
    const current = revenueMap.get(key) ?? { revenue: 0, count: 0 };
    current.revenue += order.total_amount.toNumber(); current.count += 1; revenueMap.set(key, current);
  }
  const countBy = <T extends string>(values: T[]) => {
    const map = new Map<string, number>(); values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1)); return map;
  };
  const complaintTypes = countBy(complaints.map((row) => row.type));
  const complaintStatuses = countBy(complaints.map((row) => row.status));
  const approvalStatuses = countBy(approvals.map((row) => row.status));
  return [
    { name: 'Doanh thu', columns: [{ header: 'Kỳ', key: 'period' }, { header: 'Doanh thu', key: 'revenue', numFmt: '#,##0 [$₫-vi-VN]' }, { header: 'Số đơn hoàn tất', key: 'count' }],
      rows: [...revenueMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([period, value]) => ({ period, ...value })) },
    { name: 'Tình trạng sạp', columns: [{ header: 'Chợ', key: 'market', width: 28 }, { header: 'Tổng sạp', key: 'total' }, { header: 'Đang thuê', key: 'occupied' }, { header: 'Trống', key: 'vacant' }, { header: 'Bảo trì', key: 'maintenance' }, { header: 'Giữ chỗ', key: 'reserved' }, { header: 'Tỷ lệ lấp đầy (%)', key: 'rate' }],
      rows: markets.map((market) => { const total = market.stalls.length; const occupied = market.stalls.filter((stall) => stall.status === 'occupied').length; return { market: market.name, total, occupied, vacant: market.stalls.filter((stall) => stall.status === 'vacant').length, maintenance: market.stalls.filter((stall) => stall.status === 'maintenance').length, reserved: market.stalls.filter((stall) => stall.status === 'reserved').length, rate: total ? Math.round(occupied / total * 1000) / 10 : 0 }; }) },
    { name: 'Phản ánh', columns: [{ header: 'Nhóm', key: 'group' }, { header: 'Giá trị', key: 'value', width: 28 }, { header: 'Số lượng', key: 'count' }],
      rows: [...complaintTypes.entries()].map(([value, count]) => ({ group: 'Loại', value: COMPLAINT_TYPE[value] ?? value, count })).concat([...complaintStatuses.entries()].map(([value, count]) => ({ group: 'Trạng thái', value: label(value), count }))) },
    { name: 'Hồ sơ duyệt', columns: [{ header: 'Trạng thái', key: 'status', width: 25 }, { header: 'Số lượng', key: 'count' }], rows: [...approvalStatuses.entries()].map(([status, count]) => ({ status: label(status), count })) },
    { name: 'Tiểu thương', columns: [{ header: 'Nhóm', key: 'group', width: 24 }, { header: 'Tiểu thương', key: 'merchant', width: 28 }, { header: 'Sạp', key: 'stall' }, { header: 'Doanh thu', key: 'revenue', numFmt: '#,##0 [$₫-vi-VN]' }, { header: 'Số đơn', key: 'orderCount' }, { header: 'Số phản ánh', key: 'complaintCount' }],
      rows: [
        ...topRevenue.map((row) => ({ group: 'Doanh thu cao', merchant: row.full_name, stall: row.stall_code, revenue: Number(row.revenue), orderCount: Number(row.order_count), complaintCount: '' })),
        ...topComplained.map((row) => ({ group: 'Bị phản ánh nhiều', merchant: row.full_name, stall: row.stall_code, revenue: '', orderCount: '', complaintCount: Number(row.complaint_count) })),
      ] },
    { name: 'Thông tin báo cáo', columns: [{ header: 'Thông tin', key: 'key', width: 25 }, { header: 'Giá trị', key: 'value', width: 45 }], rows: [
      { key: 'Từ ngày', value: day(from) }, { key: 'Đến ngày', value: day(to) },
      { key: 'Phạm vi', value: q.marketId ?? 'Toàn bộ phạm vi được cấp' }, { key: 'Người xuất', value: req.user.full_name },
      { key: 'Thời điểm xuất', value: date(new Date()) },
    ] },
  ];
}

async function buildSheets(resource: typeof resources[number], req: any, q: any) {
  switch (resource) {
    case 'markets': return marketSheets(req, q);
    case 'stalls': return stallSheets(req, q);
    case 'traders': return traderSheets(req, q);
    case 'merchant-approvals': return applicationSheets(req, q);
    case 'products': return productSheets(req, q);
    case 'orders': return orderSheets(req, q);
    case 'complaints': return complaintSheets(req, q);
    case 'contracts': return contractSheets(req, q);
    case 'audits': return auditSheets(req, q);
    case 'users': return userSheets(req);
    case 'reports': return reportSheets(req, q);
  }
}

exportsAdminRouter.get(
  '/:resource.xlsx',
  validate({ params: z.object({ resource: z.enum(resources) }), query: querySchema }),
  async (req, res, next) => {
    try {
      const resource = req.params.resource as typeof resources[number];
      const sheets = await buildSheets(resource, req, req.query);
      const rowCount = sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0);
      writeAudit({
        userId: req.user!.id, action: 'export_excel', tableName: resource,
        description: `Xuất Excel ${resource}: ${rowCount} dòng; bộ lọc ${JSON.stringify(req.query)}`,
        ip: req.ip,
      });
      await sendExcel(res, `smart-market-${resource}-${dayjs().format('YYYYMMDD-HHmm')}.xlsx`, sheets);
    } catch (error) {
      next(error);
    }
  },
);
