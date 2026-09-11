const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';

/** Mã đơn dạng SM250711-X7K2P — không lộ số lượng đơn trong hệ thống. */
export function genOrderCode(now = new Date()): string {
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  let suffix = '';
  for (let i = 0; i < 5; i++) suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `SM${y}${m}${d}-${suffix}`;
}
