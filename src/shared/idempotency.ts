import { conflict } from './errors';

/**
 * Khử request trùng theo idempotency key — lưu TRONG RAM của process (không Redis, không DB).
 *
 * Value của mỗi key chính là Promise đang chạy:
 *  - Request trùng tới lúc request đầu CHƯA xong → await chung promise đó → cùng một kết quả,
 *    không chạy lại transaction, không trừ kho hai lần.
 *  - Request đầu xong rồi → promise đã settle nên đọc lại map là đọc cache; giữ thêm TTL_MS
 *    để cứu cả trường hợp client bị timeout/rớt mạng sau khi server đã commit rồi bấm lại.
 *  - Request đầu LỖI → xóa key ngay, để người dùng sửa giỏ và thử lại được.
 *
 * ở DB (vd cột orders.idempotency_key) — bộ nhớ mỗi process không chia sẻ cho nhau.
 */

const TTL_MS = 5 * 60_000;
const MAX_ENTRIES = 1_000;

type Entry = {
  /** Vân tay payload — cùng key nhưng khác nội dung là dùng sai key. */
  fingerprint: string;
  promise: Promise<unknown>;
  timer: NodeJS.Timeout;
  /** Request đã chạy xong chưa — entry ĐANG chạy tuyệt đối không được evict. */
  settled: boolean;
};

const store = new Map<string, Entry>();

function drop(key: string): void {
  const entry = store.get(key);
  if (!entry) return;
  clearTimeout(entry.timer);
  store.delete(key);
}

/**
 * Map giữ thứ tự chèn → key cũ nhất nằm đầu.
 *
 * CHỈ evict entry đã settle. Đẩy một checkout ĐANG chạy ra khỏi store sẽ khiến request
 * trùng không tìm thấy key → chạy lại transaction → tạo đơn thứ hai. Nếu tất cả entry đều
 * đang chạy thì thà để store phình tạm còn hơn tạo đơn trùng — chúng sẽ tự settle rồi bị
 * timer TTL dọn.
 */
function evictIfFull(): void {
  if (store.size < MAX_ENTRIES) return;
  for (const [key, entry] of store) {
    if (store.size < MAX_ENTRIES) return;
    if (entry.settled) drop(key);
  }
}

/**
 * Chạy `fn` đúng một lần cho mỗi `key`; các lần gọi trùng nhận lại kết quả của lần đầu.
 * `fingerprint` để phát hiện client tái sử dụng key cho payload khác.
 */
export function runIdempotent<T>(
  key: string,
  fingerprint: string,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key);
  if (hit) {
    if (hit.fingerprint !== fingerprint)
      throw conflict(
        'IDEMPOTENCY_KEY_REUSED',
        'Khóa chống trùng đã được dùng cho một yêu cầu khác, vui lòng thử lại',
      );
    return hit.promise as Promise<T>;
  }

  evictIfFull();
  const promise = fn();
  const timer = setTimeout(() => store.delete(key), TTL_MS);
  timer.unref?.(); // không giữ event loop sống khi tắt server
  const entry: Entry = { fingerprint, promise, timer, settled: false };
  store.set(key, entry);
  // Cả hai nhánh tự bắt lỗi, caller vẫn nhận promise gốc.
  promise.then(
    () => {
      entry.settled = true;
    },
    () => {
      entry.settled = true;
      drop(key); // lỗi → xóa ngay để người dùng sửa giỏ và thử lại được
    },
  );
  return promise;
}

/** Dùng cho test/dev: dọn sạch store. */
export function clearIdempotencyStore(): void {
  for (const key of [...store.keys()]) drop(key);
}
