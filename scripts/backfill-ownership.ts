/**
 * Backfill chủ sở hữu cho products và orders.
 *
 * Vì sao cần: hai cột `contract_id` / `owner_merchant_id` (products) và
 * `contract_id` / `merchant_id` (orders) mới được thêm, nên mọi bản ghi có TRƯỚC khi deploy
 * đều đang NULL. Chừng nào chưa backfill thì tiểu thương không thấy sản phẩm/đơn cũ của
 * chính mình (màn hình rỗng).
 *
 * Cách xác định chủ: tìm hợp đồng của ĐÚNG sạp đó có khoảng thời gian bao trùm thời điểm
 * tạo bản ghi:
 *     contract.stall_id  = row.stall_id
 * AND contract.start_date <= row.created_at
 * AND (contract.ended_at IS NULL OR row.created_at <= contract.ended_at)
 *
 * Ba nhóm kết quả:
 *   resolved  — đúng 1 hợp đồng khớp  → gán
 *   ambiguous — nhiều hợp đồng khớp (khoảng thời gian chồng lấn) → KHÔNG gán, ghi manifest
 *   orphan    — không hợp đồng nào khớp (dữ liệu seed / tạo trước khi có hợp đồng) → KHÔNG gán
 *
 * Chạy:
 *   npm run backfill:ownership              # dry-run, chỉ đọc + xuất manifest
 *   npm run backfill:ownership -- --apply   # ghi thật
 *
 * ⚠️ LUÔN chạy dry-run trước, gửi manifest cho chủ hệ thống duyệt, rồi mới --apply.
 * ⚠️ Trước khi --apply trên production phải có backup mới nhất.
 */
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/shared/prisma';

const APPLY = process.argv.includes('--apply');
const OUT_DIR = path.resolve(__dirname, '..', 'backfill-manifest');

type Status = 'resolved' | 'ambiguous' | 'orphan';

type Row = {
  table: 'products' | 'orders';
  id: string;
  created_at: Date;
  stall_id: string;
  contract_id: string | null;
  merchant_id: string | null;
  status: Status;
};

type Contract = {
  id: string;
  stall_id: string;
  merchant_id: string;
  start_date: Date;
  end_date: Date | null;
  ended_at: Date | null;
};

/** Cuối ngày của một cột DATE (Prisma trả nửa đêm UTC) — để `created_at` trong ngày đó vẫn khớp. */
function endOfDateColumn(d: Date): number {
  return d.getTime() + 24 * 60 * 60 * 1000 - 1;
}

/**
 * Mốc kết thúc của hợp đồng: SỚM NHẤT giữa `ended_at` (đóng thủ công) và `end_date` (hết hạn).
 * Không có mốc nào = còn mở vô thời hạn.
 *
 * Nếu chỉ xét `ended_at` thì một hợp đồng quá hạn nhưng chưa ai đóng sẽ khớp với MỌI bản ghi
 * sau ngày bắt đầu — kể cả bản ghi của người thuê sau nó.
 */
function upperBound(c: Contract): number {
  const bounds = [
    c.ended_at ? c.ended_at.getTime() : null,
    c.end_date ? endOfDateColumn(c.end_date) : null,
  ].filter((v): v is number => v !== null);
  return bounds.length === 0 ? Number.POSITIVE_INFINITY : Math.min(...bounds);
}

/** Hợp đồng có khoảng thời gian bao trùm thời điểm `at`. */
function matchContracts(contracts: Contract[], at: Date): Contract[] {
  const t = at.getTime();
  return contracts.filter((c) => c.start_date.getTime() <= t && t <= upperBound(c));
}

function classify(contracts: Contract[], at: Date) {
  const matched = matchContracts(contracts, at);
  if (matched.length === 0) return { status: 'orphan' as Status, contract: null };
  if (matched.length === 1) return { status: 'resolved' as Status, contract: matched[0] };

  /**
   * Nhiều hợp đồng cùng khớp. Trên một sạp, hợp đồng vốn NỐI TIẾP nhau (đã có unique index
   * uq_contracts_active_stall bảo đảm không chồng lấn khi đang mở), nên hợp đồng thật sự
   * đang hiệu lực tại `at` là cái ôm sát nhất — tức có MỐC KẾT THÚC SỚM NHẤT trong số các
   * cái còn khớp. Các cái khác kết thúc muộn hơn chỉ khớp vì `at` rơi vào khoảng đầu của chúng.
   *
   * Thực tế gặp: cùng một người được gán đi gán lại cùng một sạp qua nhiều lần chạy thử,
   * sinh ra một chồng hợp đồng trùng ngày. Không narrow thì cả cụm bị bỏ là "ambiguous"
   * và tiểu thương mất sạch dữ liệu.
   */
  const min = Math.min(...matched.map(upperBound));
  const narrowed = matched.filter((c) => upperBound(c) === min);
  if (narrowed.length === 1) return { status: 'resolved' as Status, contract: narrowed[0] };

  // Vẫn nhiều cái ngang nhau: chấp nhận nếu tất cả cùng MỘT chủ (chủ sở hữu là thứ quyết định
  // quyền xem, contract_id chỉ là snapshot đối soát). Khác chủ thì không đoán — để người quyết.
  const owners = new Set(narrowed.map((c) => c.merchant_id));
  if (owners.size === 1) return { status: 'resolved' as Status, contract: narrowed[0] };
  return { status: 'ambiguous' as Status, contract: null };
}

async function loadContractsByStall(stallIds: string[]) {
  const contracts = await prisma.contracts.findMany({
    where: { stall_id: { in: stallIds } },
    select: {
      id: true,
      stall_id: true,
      merchant_id: true,
      start_date: true,
      end_date: true,
      ended_at: true,
    },
    orderBy: { start_date: 'asc' },
  });
  const map = new Map<string, Contract[]>();
  for (const c of contracts) {
    const list = map.get(c.stall_id) ?? [];
    list.push(c);
    map.set(c.stall_id, list);
  }
  return map;
}

async function run() {
  console.info(APPLY ? '=== BACKFILL: CHẾ ĐỘ GHI THẬT (--apply) ===' : '=== BACKFILL: DRY-RUN ===');

  const [products, orders] = await Promise.all([
    prisma.products.findMany({
      where: { contract_id: null },
      select: { id: true, stall_id: true, created_at: true },
      orderBy: { created_at: 'asc' },
    }),
    prisma.orders.findMany({
      where: { contract_id: null },
      select: { id: true, stall_id: true, created_at: true },
      orderBy: { created_at: 'asc' },
    }),
  ]);

  const stallIds = [...new Set([...products, ...orders].map((r) => r.stall_id))];
  const byStall = await loadContractsByStall(stallIds);

  const rows: Row[] = [];
  for (const p of products) {
    const { status, contract } = classify(byStall.get(p.stall_id) ?? [], p.created_at);
    rows.push({
      table: 'products',
      id: p.id,
      created_at: p.created_at,
      stall_id: p.stall_id,
      contract_id: contract?.id ?? null,
      merchant_id: contract?.merchant_id ?? null,
      status,
    });
  }
  for (const o of orders) {
    const { status, contract } = classify(byStall.get(o.stall_id) ?? [], o.created_at);
    rows.push({
      table: 'orders',
      id: o.id,
      created_at: o.created_at,
      stall_id: o.stall_id,
      contract_id: contract?.id ?? null,
      merchant_id: contract?.merchant_id ?? null,
      status,
    });
  }

  // ===== Manifest =====
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = rows.length ? new Date().toISOString().replace(/[:.]/g, '-') : 'empty';
  const file = path.join(OUT_DIR, `backfill-${stamp}.csv`);
  const csv = [
    'table,id,created_at,stall_id,resolved_contract_id,resolved_merchant_id,status',
    ...rows.map((r) =>
      [
        r.table,
        r.id,
        r.created_at.toISOString(),
        r.stall_id,
        r.contract_id ?? '',
        r.merchant_id ?? '',
        r.status,
      ].join(','),
    ),
  ].join('\n');
  fs.writeFileSync(file, csv, 'utf8');

  // ===== Tổng kết =====
  const summary = (table: Row['table']) => {
    const sub = rows.filter((r) => r.table === table);
    const count = (s: Status) => sub.filter((r) => r.status === s).length;
    return `${table}: tổng ${sub.length} | resolved ${count('resolved')} | ambiguous ${count('ambiguous')} | orphan ${count('orphan')}`;
  };
  console.info(summary('products'));
  console.info(summary('orders'));
  console.info(`Manifest: ${file}`);

  const resolved = rows.filter((r) => r.status === 'resolved');
  const skipped = rows.length - resolved.length;
  if (skipped > 0) {
    console.warn(
      `⚠️  ${skipped} bản ghi KHÔNG được gán (ambiguous/orphan) — giữ NULL, tiểu thương sẽ không thấy chúng.\n` +
        '   Xem manifest và xin quyết định của chủ hệ thống trước khi xử lý tay.',
    );
  }

  if (!APPLY) {
    console.info('\nDry-run — chưa ghi gì vào database. Thêm --apply để ghi thật.');
    return;
  }

  // ===== Ghi thật =====
  let done = 0;
  for (let i = 0; i < resolved.length; i += 200) {
    const chunk = resolved.slice(i, i + 200);
    await prisma.$transaction(
      chunk.map((r) =>
        r.table === 'products'
          ? prisma.products.updateMany({
              // Điều kiện contract_id: null → chạy lại lần hai không ghi đè dữ liệu đã đúng.
              where: { id: r.id, contract_id: null },
              data: { contract_id: r.contract_id, owner_merchant_id: r.merchant_id },
            })
          : prisma.orders.updateMany({
              where: { id: r.id, contract_id: null },
              data: { contract_id: r.contract_id, merchant_id: r.merchant_id },
            }),
      ),
    );
    done += chunk.length;
    console.info(`  đã ghi ${done}/${resolved.length}`);
  }
  console.info(`✅ Hoàn tất: gán chủ cho ${done} bản ghi.`);
}

run()
  .catch((e) => {
    console.error('Backfill thất bại:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
