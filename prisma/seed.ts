/**
 * Seed dữ liệu MVP — idempotent (chạy lại không nhân đôi).
 * Mật khẩu CMS demo: SA lấy từ env; PA/MM = "Manager@123".
 * User app đăng nhập qua mock Zalo: token "mock:<zalo_id>:<Tên>".
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

// ⚠️ Seed chỉ để tạo DATA ẢO cho môi trường local. Chặn chạy nhầm lên DB dùng chung/
// production (vừa bơm data rác, vừa mở thêm một pool kết nối). Muốn cố tình chạy trên
// DB remote thì đặt SEED_ALLOW_REMOTE=true.
const seedDbUrl = process.env.DATABASE_URL ?? '';
const isLocalDb = /@(localhost|127\.0\.0\.1)([:/]|$)/.test(seedDbUrl);
if (!isLocalDb && process.env.SEED_ALLOW_REMOTE !== 'true') {
  console.error(
    '⛔ Seed đã bị vô hiệu hoá: DATABASE_URL không trỏ localhost.\n' +
      '   Đây là script tạo data ảo, không chạy lên DB dùng chung/production.\n' +
      '   Nếu thực sự cần, chạy lại với SEED_ALLOW_REMOTE=true.',
  );
  process.exit(1);
}

const prisma = new PrismaClient();

// ===== Fixed IDs =====
export const IDS = {
  provinceHcm: '20000000-0000-4000-8000-000000000001',
  provinceHn: '20000000-0000-4000-8000-000000000002',
  sa: '10000000-0000-4000-8000-000000000001',
  paHcm: '10000000-0000-4000-8000-000000000002',
  mm1: '10000000-0000-4000-8000-000000000003',
  mm2: '10000000-0000-4000-8000-000000000004',
  merchant1: '10000000-0000-4000-8000-000000000011',
  merchant2: '10000000-0000-4000-8000-000000000012',
  applicant: '10000000-0000-4000-8000-000000000013',
  buyer1: '10000000-0000-4000-8000-000000000021',
  buyer2: '10000000-0000-4000-8000-000000000022',
  market1: '30000000-0000-4000-8000-000000000001',
  market2: '30000000-0000-4000-8000-000000000002',
  contract1: '70000000-0000-4000-8000-000000000001',
  contract2: '70000000-0000-4000-8000-000000000002',
  contractEnded: '70000000-0000-4000-8000-000000000003',
  orderCompleted: '80000000-0000-4000-8000-000000000001',
  orderPending: '80000000-0000-4000-8000-000000000002',
  orderCancelled: '80000000-0000-4000-8000-000000000003',
  complaintNew: '90000000-0000-4000-8000-000000000001',
  complaintResolved: '90000000-0000-4000-8000-000000000002',
  notiBroadcast: 'a0000000-0000-4000-8000-000000000001',
  notiDraft: 'a0000000-0000-4000-8000-000000000002',
  application1: 'b0000000-0000-4000-8000-000000000001',
  audit1: 'c0000000-0000-4000-8000-000000000001',
};

const productId = (n: number) => `60000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const orderItemId = (n: number) => `81000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const categoryId = (n: number) => `50000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const subCategoryId = (n: number) => `50000000-0000-4000-8001-${String(n).padStart(12, '0')}`;

// 34 tỉnh/thành sau sắp xếp 2025
const PROVINCES: [string, string][] = [
  ['01', 'Hà Nội'], ['02', 'Cao Bằng'], ['04', 'Tuyên Quang'], ['08', 'Lào Cai'],
  ['11', 'Điện Biên'], ['12', 'Lai Châu'], ['14', 'Sơn La'], ['15', 'Thái Nguyên'],
  ['19', 'Phú Thọ'], ['20', 'Bắc Ninh'], ['22', 'Quảng Ninh'], ['24', 'Hưng Yên'],
  ['26', 'Hải Phòng'], ['31', 'Ninh Bình'], ['33', 'Thanh Hóa'], ['38', 'Nghệ An'],
  ['40', 'Hà Tĩnh'], ['42', 'Quảng Trị'], ['44', 'Huế'], ['46', 'Đà Nẵng'],
  ['48', 'Quảng Ngãi'], ['51', 'Gia Lai'], ['52', 'Đắk Lắk'], ['56', 'Khánh Hòa'],
  ['58', 'Lâm Đồng'], ['60', 'Đồng Nai'], ['66', 'Tây Ninh'], ['68', 'TP. Hồ Chí Minh'],
  ['70', 'Đồng Tháp'], ['72', 'An Giang'], ['74', 'Vĩnh Long'], ['75', 'Cần Thơ'],
  ['80', 'Cà Mau'], ['86', 'Bạc Liêu'],
];

const CATEGORIES = [
  'Rau củ quả', 'Thịt', 'Hải sản', 'Đồ khô', 'Gia vị',
  'Ẩm thực', 'Quần áo', 'Gia dụng', 'Hoa tươi', 'Khác',
];

// Loại mặt hàng (subcategory) theo ngành hàng cha (key = số thứ tự ngành hàng, 1-based).
const SUBCATEGORIES: Record<number, string[]> = {
  1: ['Rau ăn lá', 'Củ quả', 'Trứng & khác'], // Rau củ quả
  2: ['Thịt heo', 'Thịt bò', 'Thịt gà'], // Thịt
  3: ['Tôm', 'Cua', 'Cá', 'Mực'], // Hải sản
};

const SETTINGS: [string, unknown, string][] = [
  ['contract_expiry_warning_days', 30, 'Số ngày trước hạn để cảnh báo hợp đồng sắp hết hạn (rule R10)'],
  ['contract_default_duration_months', 24, 'Thời hạn thuê sạp mặc định (tháng)'],
  ['rejection_reasons', ['Giấy tờ không hợp lệ', 'Thiếu thông tin cá nhân', 'Ngành hàng không phù hợp', 'Chợ không còn sạp trống', 'Không đạt điều kiện kinh doanh', 'Lý do khác'], 'Danh sách lý do từ chối hồ sơ tiểu thương'],
  ['product_units', ['cái', 'chiếc', 'quả', 'kg', 'lạng', 'bó', 'túi', 'hộp', 'chai', 'gói', 'con', 'mớ', 'thùng'], 'Danh mục đơn vị bán'],
  ['review_require_purchase', true, 'Bắt buộc đã mua (đơn completed) mới được đánh giá sản phẩm'],
  ['notification_templates', { application_approved: 'Hồ sơ của bạn đã được duyệt', order_new: 'Bạn có đơn hàng mới {orderCode}' }, 'Mẫu nội dung thông báo hệ thống'],
];

/** Reset trạng thái bị test làm thay đổi — để chu trình seed → test chạy lại ổn định. */
async function resetDynamicState() {
  // Kết thúc các hợp đồng test tạo thêm (ngoài 3 hợp đồng seed)
  await prisma.contracts.updateMany({
    where: { id: { notIn: [IDS.contract1, IDS.contract2, IDS.contractEnded] }, ended_at: null },
    data: { ended_at: new Date(), end_reason: 'Reset seed' },
  });
  // Khôi phục 2 hợp đồng active của seed
  await prisma.contracts.updateMany({
    where: { id: { in: [IDS.contract1, IDS.contract2] } },
    data: { ended_at: null, end_reason: null },
  });
  // Applicant quay về trạng thái chưa là tiểu thương
  await prisma.users.updateMany({
    where: { id: IDS.applicant },
    data: { merchant_status: null, merchant_market_id: null, merchant_category_id: null, merchant_joined_at: null },
  });
  await prisma.users.updateMany({
    where: { id: { in: [IDS.merchant1, IDS.merchant2] } },
    data: { merchant_status: 'active' },
  });
  // Hồ sơ seed quay về pending; các hồ sơ test khác chuyển cancelled
  await prisma.merchant_applications.updateMany({
    where: { id: IDS.application1 },
    data: { status: 'pending', admin_note: null, reviewed_by: null, reviewed_at: null },
  });
  await prisma.merchant_applications.updateMany({
    where: { user_id: { in: [IDS.applicant, IDS.buyer2] }, id: { not: IDS.application1 }, status: { in: ['pending', 'reviewing', 'need_more_info'] } },
    data: { status: 'cancelled' },
  });
  // Phản ánh seed quay về trạng thái ban đầu
  await prisma.complaints.updateMany({
    where: { id: IDS.complaintNew },
    data: { status: 'new', resolution_note: null, resolved_at: null },
  });
  // Xóa thông báo cảnh báo hợp đồng của lần test trước (để job idempotent test được cả 2 nhánh)
  const contractNotis = await prisma.notifications.findMany({
    where: { ref_type: 'contract', type: 'fee' },
    select: { id: true },
  });
  if (contractNotis.length) {
    const ids = contractNotis.map((n) => n.id);
    await prisma.notification_recipients.deleteMany({ where: { notification_id: { in: ids } } });
    await prisma.notifications.deleteMany({ where: { id: { in: ids } } });
  }
}

async function main() {
  await resetDynamicState().catch(() => {}); // lần đầu bảng trống — bỏ qua lỗi
  console.log('— Seed provinces (34)...');
  for (const [i, [code, name]] of PROVINCES.entries()) {
    const fixed =
      code === '68' ? IDS.provinceHcm : code === '01' ? IDS.provinceHn : undefined;
    await prisma.provinces.upsert({
      where: { code },
      create: { ...(fixed ? { id: fixed } : {}), code, name },
      update: { name },
    });
  }

  console.log('— Seed categories (10)...');
  for (const [i, name] of CATEGORIES.entries()) {
    await prisma.categories.upsert({
      where: { id: categoryId(i + 1) },
      create: { id: categoryId(i + 1), name, display_order: i + 1, description: `Ngành hàng ${name}` },
      update: { name, display_order: i + 1 },
    });
  }

  console.log('— Seed subcategories (loại mặt hàng)...');
  const subCatIdByName = new Map<string, string>();
  let subCatN = 0;
  for (const [parentIdx, names] of Object.entries(SUBCATEGORIES)) {
    for (const name of names) {
      subCatN += 1;
      const id = subCategoryId(subCatN);
      subCatIdByName.set(name, id);
      await prisma.categories.upsert({
        where: { id },
        create: { id, name, parent_id: categoryId(Number(parentIdx)), display_order: subCatN, description: `Loại mặt hàng ${name}` },
        update: { name, parent_id: categoryId(Number(parentIdx)), display_order: subCatN },
      });
    }
  }

  console.log('— Seed app_settings (6)...');
  for (const [key, value, description] of SETTINGS) {
    await prisma.app_settings.upsert({
      where: { key },
      create: { key, value: value as any, description, updated_at: new Date() },
      update: {},
    });
  }

  console.log('— Seed users...');
  const saPassPlain = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'Admin@12345';
  const mgrPassPlain = 'Manager@123';
  const saPass = await bcrypt.hash(saPassPlain, 10);
  const mgrPass = await bcrypt.hash(mgrPassPlain, 10);
  const users: any[] = [
    { id: IDS.sa, username: 'admin', email: (process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@smartmarket.vn').toLowerCase(), password_hash: saPass, full_name: 'Super Admin', role: 'super_admin', status: 'active' },
    { id: IDS.paHcm, email: 'pa.hcm@smartmarket.vn', password_hash: mgrPass, full_name: 'Quản trị TP.HCM', role: 'province_admin', status: 'active', province_id: IDS.provinceHcm },
    { id: IDS.mm1, email: 'mm.trungtam@smartmarket.vn', phone: '0900000003', password_hash: mgrPass, full_name: 'Quản lý Chợ Trung Tâm', role: 'market_manager', status: 'active' },
    { id: IDS.mm2, email: 'mm.dongxuan@smartmarket.vn', phone: '0900000004', password_hash: mgrPass, full_name: 'Quản lý Chợ Đồng Xuân', role: 'market_manager', status: 'active' },
    { id: IDS.merchant1, zalo_id: 'zalo-merchant-1', phone: '0911000001', full_name: 'Tiểu thương Rau Sạch', role: 'user', status: 'active', merchant_status: 'active', merchant_market_id: null, merchant_category_id: categoryId(1), merchant_joined_at: dayjs().subtract(60, 'day').toDate(), bank_name: 'Vietcombank', bank_code: 'VCB', bank_account_number: '0123456789', bank_account_holder: 'TRAN THI RAU' },
    { id: IDS.merchant2, zalo_id: 'zalo-merchant-2', phone: '0911000002', full_name: 'Tiểu thương Hải Sản HN', role: 'user', status: 'active', merchant_status: 'active', merchant_category_id: categoryId(3), merchant_joined_at: dayjs().subtract(30, 'day').toDate() },
    { id: IDS.applicant, zalo_id: 'zalo-applicant-1', phone: '0911000003', full_name: 'Người Xin Làm Tiểu Thương', role: 'user', status: 'active' },
    { id: IDS.buyer1, zalo_id: 'zalo-buyer-1', phone: '0922000001', full_name: 'Người Mua Số Một', role: 'user', status: 'active' },
    { id: IDS.buyer2, zalo_id: 'zalo-buyer-2', phone: '0922000002', full_name: 'Người Mua Số Hai', role: 'user', status: 'active' },
  ];
  for (const u of users) {
    await prisma.users.upsert({ where: { id: u.id }, create: u, update: { full_name: u.full_name } });
  }

  console.log('— Seed markets + managers...');
  await prisma.markets.upsert({
    where: { id: IDS.market1 },
    create: {
      id: IDS.market1,
      province_id: IDS.provinceHcm,
      code: 'CHO-TT-HCM',
      name: 'Chợ Trung Tâm (Demo)',
      address: '01 Nguyễn Huệ, Quận 1, TP.HCM',
      latitude: 10.7743,
      longitude: 106.7038,
      phone: '02838221234',
      email: 'chotrungtam@smartmarket.vn',
      description: 'Chợ demo phục vụ MVP',
      images: [{ url: 'https://placehold.co/800x400?text=Cho+Trung+Tam' }],
      open_hours: '05:00 - 18:00',
      map_link: 'https://placehold.co/1200x800?text=So+Do+Cho+Trung+Tam',
      status: 'active',
    },
    update: {},
  });
  await prisma.markets.upsert({
    where: { id: IDS.market2 },
    create: {
      id: IDS.market2,
      province_id: IDS.provinceHn,
      code: 'CHO-DX-HN',
      name: 'Chợ Đồng Xuân (Demo)',
      address: 'Đồng Xuân, Hoàn Kiếm, Hà Nội',
      latitude: 21.0378,
      longitude: 105.8492,
      images: [],
      open_hours: '06:00 - 18:00',
      status: 'active',
    },
    update: {},
  });
  for (const [userId, marketId] of [
    [IDS.mm1, IDS.market1],
    [IDS.mm2, IDS.market2],
  ] as const) {
    await prisma.market_managers.upsert({
      where: { user_id_market_id: { user_id: userId, market_id: marketId } },
      create: { user_id: userId, market_id: marketId },
      update: {},
    });
  }
  await prisma.users.update({ where: { id: IDS.merchant1 }, data: { merchant_market_id: IDS.market1, selected_market_id: IDS.market1 } });
  await prisma.users.update({ where: { id: IDS.merchant2 }, data: { merchant_market_id: IDS.market2 } });
  await prisma.users.update({ where: { id: IDS.buyer1 }, data: { selected_market_id: IDS.market1 } });

  console.log('— Seed zones + stalls...');
  const zoneSpec = [
    { market: IDS.market1, code: 'A', name: 'Khu A - Rau củ quả', cat: 1, cols: 6 },
    { market: IDS.market1, code: 'B', name: 'Khu B - Thịt & Hải sản', cat: 2, cols: 4 },
    { market: IDS.market1, code: 'C', name: 'Khu C - Ẩm thực', cat: 6, cols: 2 },
    { market: IDS.market2, code: 'A', name: 'Khu A - Hải sản', cat: 3, cols: 4 },
  ];
  const zoneIds = new Map<string, string>();
  for (const [i, zs] of zoneSpec.entries()) {
    const zone = await prisma.zones.upsert({
      where: { market_id_code: { market_id: zs.market, code: zs.code } },
      create: {
        market_id: zs.market,
        code: zs.code,
        name: zs.name,
        category_id: categoryId(zs.cat),
        display_order: i + 1,
        grid_columns: zs.cols,
        is_active: true,
      },
      update: { name: zs.name },
    });
    zoneIds.set(`${zs.market}:${zs.code}`, zone.id);
  }

  const stallSpec: { market: string; zone: string; code: string; status: string; cat: number }[] = [];
  for (let i = 1; i <= 6; i++)
    stallSpec.push({ market: IDS.market1, zone: 'A', code: `A-${String(i).padStart(2, '0')}`, status: i === 1 ? 'occupied' : i === 5 ? 'reserved' : i === 6 ? 'maintenance' : 'vacant', cat: 1 });
  for (let i = 1; i <= 4; i++)
    stallSpec.push({ market: IDS.market1, zone: 'B', code: `B-${String(i).padStart(2, '0')}`, status: 'vacant', cat: 2 });
  for (let i = 1; i <= 2; i++)
    stallSpec.push({ market: IDS.market1, zone: 'C', code: `C-${String(i).padStart(2, '0')}`, status: 'vacant', cat: 6 });
  for (let i = 1; i <= 4; i++)
    stallSpec.push({ market: IDS.market2, zone: 'A', code: `A-${String(i).padStart(2, '0')}`, status: i === 1 ? 'occupied' : 'vacant', cat: 3 });

  const stallIds = new Map<string, string>();
  for (const [i, ss] of stallSpec.entries()) {
    const stall = await prisma.stalls.upsert({
      where: { market_id_code: { market_id: ss.market, code: ss.code } },
      create: {
        market_id: ss.market,
        zone_id: zoneIds.get(`${ss.market}:${ss.zone}`)!,
        code: ss.code,
        name: ss.code === 'A-01' && ss.market === IDS.market1 ? 'Sạp Rau Sạch Cô Ba' : null,
        images: [],
        acreage: 6,
        status: ss.status as any,
        category_id: categoryId(ss.cat),
        display_order: i + 1,
        phone: ss.code === 'A-01' ? '0911000001' : null,
        open_hours: '05:30 - 17:00',
      },
      update: { status: ss.status as any },
    });
    stallIds.set(`${ss.market}:${ss.code}`, stall.id);
  }
  const stallA01M1 = stallIds.get(`${IDS.market1}:A-01`)!;
  const stallA02M1 = stallIds.get(`${IDS.market1}:A-02`)!;
  const stallA01M2 = stallIds.get(`${IDS.market2}:A-01`)!;

  console.log('— Seed contracts (active + expiring + ended)...');
  await prisma.contracts.upsert({
    where: { id: IDS.contract1 },
    create: {
      id: IDS.contract1,
      stall_id: stallA01M1,
      merchant_id: IDS.merchant1,
      start_date: dayjs().subtract(23, 'month').toDate(),
      end_date: dayjs().add(20, 'day').toDate(), // sắp hết hạn → test expiring_soon + cron
      fee: 2_000_000,
      content: 'Hợp đồng thuê sạp demo',
      created_by: IDS.mm1,
    },
    update: {},
  });
  await prisma.contracts.upsert({
    where: { id: IDS.contract2 },
    create: {
      id: IDS.contract2,
      stall_id: stallA01M2,
      merchant_id: IDS.merchant2,
      start_date: dayjs().subtract(1, 'month').toDate(),
      end_date: dayjs().add(23, 'month').toDate(),
      fee: 1_500_000,
      created_by: IDS.mm2,
    },
    update: {},
  });
  await prisma.contracts.upsert({
    where: { id: IDS.contractEnded },
    create: {
      id: IDS.contractEnded,
      stall_id: stallA02M1,
      merchant_id: IDS.merchant1,
      start_date: dayjs().subtract(3, 'year').toDate(),
      end_date: dayjs().subtract(1, 'year').toDate(),
      fee: 1_800_000,
      ended_at: dayjs().subtract(1, 'year').toDate(),
      end_reason: 'Hết hạn hợp đồng cũ (dữ liệu lịch sử)',
      created_by: IDS.mm1,
    },
    update: {},
  });

  console.log('— Seed products...');
  const img = (t: string) => [{ url: `https://placehold.co/600x400?text=${encodeURIComponent(t)}` }];
  const products = [
    { n: 1, stall: stallA01M1, sub: 'Củ quả', name: 'Cà chua Đà Lạt', price: 25000, unit: 'kg', qty: 50, discount: { type: 'percent', value: 10 } },
    { n: 2, stall: stallA01M1, sub: 'Rau ăn lá', name: 'Rau cải ngọt', price: 10000, unit: 'bó', qty: 100 },
    { n: 3, stall: stallA01M1, sub: 'Củ quả', name: 'Cam sành', price: 8000, unit: 'quả', qty: 200, discount: { type: 'fixed_price', value: 6000 } },
    { n: 4, stall: stallA01M1, sub: 'Trứng & khác', name: 'Trứng gà ta', price: 3000, unit: 'quả', qty: 300 },
    { n: 5, stall: stallA01M1, sub: 'Củ quả', name: 'Khoai tây', price: 18000, unit: 'kg', qty: 0 }, // hết hàng
    { n: 6, stall: stallA01M1, sub: 'Trứng & khác', name: 'Hàng đang ẩn', price: 5000, unit: 'gói', qty: 10, hidden: true },
    { n: 7, stall: stallA01M2, sub: 'Tôm', name: 'Tôm sú tươi', price: 250000, unit: 'kg', qty: 20 },
    { n: 8, stall: stallA01M2, sub: 'Cá', name: 'Cá thu', price: 180000, unit: 'kg', qty: 15 },
  ];
  for (const p of products) {
    await prisma.products.upsert({
      where: { id: productId(p.n) },
      create: {
        id: productId(p.n),
        stall_id: p.stall,
        category_id: subCatIdByName.get(p.sub)!,
        name: p.name,
        description: `${p.name} tươi mỗi ngày`,
        images: img(p.name),
        price: p.price,
        unit: p.unit,
        quantity: p.qty,
        origin: 'Việt Nam',
        is_hidden: !!(p as any).hidden,
        ...(p.discount
          ? {
              discount_type: p.discount.type as any,
              discount_value: p.discount.value,
              discount_start_at: dayjs().subtract(1, 'day').toDate(),
              discount_end_at: dayjs().add(7, 'day').toDate(),
            }
          : {}),
      },
      update: {
        quantity: p.qty,
        is_hidden: !!(p as any).hidden,
        ...(p.discount
          ? {
              discount_type: p.discount.type as any,
              discount_value: p.discount.value,
              discount_start_at: dayjs().subtract(1, 'day').toDate(),
              discount_end_at: dayjs().add(7, 'day').toDate(),
            }
          : { discount_type: null, discount_value: null, discount_start_at: null, discount_end_at: null }),
      },
    });
  }

  console.log('— Seed orders (completed/pending/cancelled)...');
  const orderRows = [
    {
      id: IDS.orderCompleted,
      code: 'SEED-ORD-COMPLETED',
      status: 'completed',
      items: [
        { n: 1, product: 1, name: 'Cà chua Đà Lạt', unit: 'kg', orig: 25000, price: 22500, qty: 2 },
        { n: 2, product: 2, name: 'Rau cải ngọt', unit: 'bó', orig: 10000, price: 10000, qty: 3 },
      ],
      timestamps: {
        confirmed_at: dayjs().subtract(2, 'day').add(10, 'minute').toDate(),
        preparing_at: dayjs().subtract(2, 'day').add(30, 'minute').toDate(),
        ready_at: dayjs().subtract(2, 'day').add(1, 'hour').toDate(),
        completed_at: dayjs().subtract(2, 'day').add(2, 'hour').toDate(),
      },
      created: dayjs().subtract(2, 'day').toDate(),
    },
    {
      id: IDS.orderPending,
      code: 'SEED-ORD-PENDING',
      status: 'pending',
      items: [{ n: 3, product: 4, name: 'Trứng gà ta', unit: 'quả', orig: 3000, price: 3000, qty: 10 }],
      timestamps: {},
      created: dayjs().subtract(2, 'hour').toDate(),
    },
    {
      id: IDS.orderCancelled,
      code: 'SEED-ORD-CANCELLED',
      status: 'cancelled',
      items: [{ n: 4, product: 3, name: 'Cam sành', unit: 'quả', orig: 8000, price: 6000, qty: 5 }],
      timestamps: { cancelled_at: dayjs().subtract(1, 'day').toDate() },
      extra: { cancelled_by: 'buyer', cancel_reason: 'Đặt nhầm số lượng' },
      created: dayjs().subtract(1, 'day').toDate(),
    },
  ];
  for (const o of orderRows) {
    const total = o.items.reduce((s, it) => s + it.price * it.qty, 0);
    await prisma.orders.upsert({
      where: { id: o.id },
      create: {
        id: o.id,
        code: o.code,
        customer_id: IDS.buyer1,
        market_id: IDS.market1,
        stall_id: stallA01M1,
        checkout_group_id: o.id,
        status: o.status as any,
        receive_type: 'pickup',
        receiver_name: 'Người Mua Số Một',
        receiver_phone: '0922000001',
        total_amount: total,
        created_at: o.created,
        ...(o.timestamps as any),
        ...((o as any).extra ?? {}),
      },
      update: {},
    });
    for (const it of o.items) {
      await prisma.order_items.upsert({
        where: { id: orderItemId(it.n) },
        create: {
          id: orderItemId(it.n),
          order_id: o.id,
          product_id: productId(it.product),
          product_name: it.name,
          product_image: img(it.name)[0].url,
          unit: it.unit,
          original_price: it.orig,
          unit_price: it.price,
          quantity: it.qty,
          line_total: it.price * it.qty,
        },
        update: {},
      });
    }
  }

  console.log('— Seed review (buyer1 → Cà chua, đã mua đơn completed)...');
  await prisma.reviews.upsert({
    where: { user_id_product_id: { user_id: IDS.buyer1, product_id: productId(1) } },
    create: {
      user_id: IDS.buyer1,
      product_id: productId(1),
      rating: 5,
      content: 'Cà chua tươi, giá tốt!',
      images: [],
    },
    update: {},
  });
  const agg = await prisma.reviews.aggregate({
    where: { product_id: productId(1) },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.products.update({
    where: { id: productId(1) },
    data: { rating_avg: agg._avg.rating ?? 0, review_count: agg._count._all },
  });

  console.log('— Seed complaints...');
  await prisma.complaints.upsert({
    where: { id: IDS.complaintNew },
    create: {
      id: IDS.complaintNew,
      user_id: IDS.buyer1,
      market_id: IDS.market1,
      stall_id: stallA01M1,
      product_id: productId(1),
      type: 'price_issue',
      content: 'Giá niêm yết và giá bán khác nhau',
      images: [],
      status: 'new',
      resolution_images: [],
    },
    update: {},
  });
  await prisma.complaints.upsert({
    where: { id: IDS.complaintResolved },
    create: {
      id: IDS.complaintResolved,
      user_id: IDS.buyer2,
      market_id: IDS.market1,
      type: 'infrastructure',
      content: 'Lối đi khu B bị đọng nước',
      images: [],
      status: 'resolved',
      resolution_note: 'Đã cho sửa hệ thống thoát nước ngày hôm qua',
      resolution_images: [],
      resolved_at: dayjs().subtract(1, 'day').toDate(),
    },
    update: {},
  });

  console.log('— Seed notifications...');
  await prisma.notifications.upsert({
    where: { id: IDS.notiBroadcast },
    create: {
      id: IDS.notiBroadcast,
      market_id: IDS.market1,
      created_by: IDS.mm1,
      title: 'Thông báo phun khử khuẩn định kỳ',
      content: 'Chợ sẽ phun khử khuẩn toàn bộ khu vực vào Chủ nhật tuần này từ 19h.',
      type: 'maintenance',
      priority: 'important',
      target_type: 'market',
      sent_at: dayjs().subtract(1, 'day').toDate(),
    },
    update: {},
  });
  await prisma.notification_recipients.upsert({
    where: { notification_id_user_id: { notification_id: IDS.notiBroadcast, user_id: IDS.merchant1 } },
    create: { notification_id: IDS.notiBroadcast, user_id: IDS.merchant1 },
    update: {},
  });
  await prisma.notifications.upsert({
    where: { id: IDS.notiDraft },
    create: {
      id: IDS.notiDraft,
      market_id: IDS.market1,
      created_by: IDS.mm1,
      title: 'Nháp: thông báo thu phí quý III',
      content: 'Nội dung nháp — chưa gửi.',
      type: 'fee',
      priority: 'normal',
      target_type: 'market',
      sent_at: null,
    },
    update: {},
  });

  console.log('— Seed merchant application (pending)...');
  await prisma.merchant_applications.upsert({
    where: { id: IDS.application1 },
    create: {
      id: IDS.application1,
      user_id: IDS.applicant,
      market_id: IDS.market1,
      category_id: categoryId(6),
      full_name: 'Người Xin Làm Tiểu Thương',
      phone: '0911000003',
      id_number: '079123456789',
      business_description: 'Bán bún bò gánh gia truyền',
      desired_stall_note: 'Muốn thuê khu C gần lối vào',
      documents: [{ url: 'https://placehold.co/600x400?text=CCCD' }],
      status: 'pending',
    },
    update: {},
  });

  console.log('— Seed system_audits...');
  await prisma.system_audits.upsert({
    where: { id: IDS.audit1 },
    create: {
      id: IDS.audit1,
      user_id: IDS.sa,
      action: 'seed.run',
      table_name: 'system',
      description: 'Khởi tạo dữ liệu demo MVP',
      ip_address: '127.0.0.1',
    },
    update: {},
  });

  // Đếm tổng kết
  const counts: Record<string, number> = {};
  for (const t of [
    'provinces', 'categories', 'app_settings', 'users', 'markets', 'market_managers',
    'zones', 'stalls', 'contracts', 'products', 'orders', 'order_items', 'reviews',
    'complaints', 'notifications', 'notification_recipients', 'merchant_applications', 'system_audits',
  ] as const) {
    counts[t] = await (prisma as any)[t].count();
  }
  console.table(counts);
  console.log('Seed hoàn tất.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
