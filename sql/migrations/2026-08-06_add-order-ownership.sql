-- Migration: snapshot chủ sạp tại thời điểm đặt đơn
-- Ngày áp dụng: 2026-08-06
--
-- Mục đích: tiểu thương thuê lại một sạp KHÔNG được đọc đơn hàng cũ của người thuê trước —
--           đơn hàng chứa tên và số điện thoại khách, đây là rò rỉ dữ liệu cá nhân.
--           Hiện đơn chỉ có stall_id nên lọc theo sạp là thấy hết lịch sử của mọi đời chủ.
--
-- Vì sao snapshot thay vì join động: hợp đồng có thể bị đóng/sửa sau này, nhưng đơn đã phát
-- sinh thì phải giữ nguyên chủ tại thời điểm đó — báo cáo doanh thu mới ổn định.
--
-- Ảnh hưởng: additive + NULLABLE. Đơn cũ có contract_id = NULL cho tới khi chạy backfill.
-- Idempotent — an toàn chạy lại nhiều lần.

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "merchant_id" UUID;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "contract_id" UUID;

DO $$ BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "fk_orders_merchant_id__users_id"
    FOREIGN KEY ("merchant_id") REFERENCES "users"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "fk_orders_contract_id__contracts_id"
    FOREIGN KEY ("contract_id") REFERENCES "contracts"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "idx_orders_contract_id_created_at"
  ON "orders" ("contract_id", "created_at");

-- Kiểm tra sau khi chạy (kỳ vọng: 2 dòng):
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'orders' AND column_name IN ('merchant_id','contract_id');

-- Rollback:
--   DROP INDEX IF EXISTS "idx_orders_contract_id_created_at";
--   ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "fk_orders_contract_id__contracts_id";
--   ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "fk_orders_merchant_id__users_id";
--   ALTER TABLE "orders" DROP COLUMN IF EXISTS "contract_id";
--   ALTER TABLE "orders" DROP COLUMN IF EXISTS "merchant_id";
