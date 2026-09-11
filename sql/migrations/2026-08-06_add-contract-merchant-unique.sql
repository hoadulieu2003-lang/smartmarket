-- Migration: mỗi tiểu thương chỉ giữ 1 hợp đồng đang hiệu lực (MVP: 1 người 1 sạp)
-- Ngày áp dụng: 2026-08-06
--
-- Mục đích: quy tắc "1 người 1 sạp" hiện chỉ được kiểm ở tầng ứng dụng bằng read-then-write
--           (đọc xem có hợp đồng nào chưa, rồi mới ghi) — không khóa, nên nhiều request gán
--           sạp cùng lúc cho cùng một người có thể cùng lọt.
--           Index này khóa ở tầng DB, giống cách uq_contracts_active_stall đang khóa theo sạp.
--
-- ⚠️ BẮT BUỘC KIỂM TRA TRƯỚC KHI CHẠY — câu dưới phải trả về 0 dòng:
--
--     SELECT merchant_id, count(*) FROM contracts
--     WHERE ended_at IS NULL GROUP BY merchant_id HAVING count(*) > 1;
--
--   Nếu có dòng trả về, migration sẽ FAIL. Phải đóng bớt hợp đồng thừa (có duyệt của chủ
--   hệ thống) rồi mới chạy lại. KHÔNG tự ý xóa dữ liệu.
--
-- Idempotent — an toàn chạy lại nhiều lần.

CREATE UNIQUE INDEX IF NOT EXISTS "uq_contracts_active_merchant"
  ON "contracts" ("merchant_id") WHERE "ended_at" IS NULL;

-- Rollback:
--   DROP INDEX IF EXISTS "uq_contracts_active_merchant";
