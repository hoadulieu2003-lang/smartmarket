-- Migration: thêm cột chủ sở hữu cho bảng products
-- Ngày áp dụng: 2026-08-06
--
-- Mục đích: khi một sạp được thu lại và giao cho tiểu thương khác, người thuê mới KHÔNG
--           được nhìn thấy / chỉnh sửa sản phẩm của người thuê trước. Hiện products chỉ có
--           stall_id nên hai lần thuê khác nhau của cùng một sạp không phân biệt được.
--
-- Ảnh hưởng: additive + NULLABLE → backend phiên bản cũ vẫn chạy bình thường sau khi chạy
--            migration này. Chỉ khi deploy backend mới thì cột mới bắt đầu được dùng.
--            Dữ liệu cũ có giá trị NULL cho tới khi chạy scripts/backfill-ownership.ts.
--
-- Idempotent — an toàn chạy lại nhiều lần.

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "owner_merchant_id" UUID;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "contract_id" UUID;

DO $$ BEGIN
  ALTER TABLE "products"
    ADD CONSTRAINT "fk_products_owner_merchant_id__users_id"
    FOREIGN KEY ("owner_merchant_id") REFERENCES "users"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "products"
    ADD CONSTRAINT "fk_products_contract_id__contracts_id"
    FOREIGN KEY ("contract_id") REFERENCES "contracts"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "idx_products_contract_id" ON "products" ("contract_id");
CREATE INDEX IF NOT EXISTS "idx_products_owner_merchant_id" ON "products" ("owner_merchant_id");

-- Kiểm tra sau khi chạy (kỳ vọng: 2 dòng):
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'products' AND column_name IN ('owner_merchant_id','contract_id');

-- Rollback:
--   DROP INDEX IF EXISTS "idx_products_owner_merchant_id";
--   DROP INDEX IF EXISTS "idx_products_contract_id";
--   ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "fk_products_contract_id__contracts_id";
--   ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "fk_products_owner_merchant_id__users_id";
--   ALTER TABLE "products" DROP COLUMN IF EXISTS "contract_id";
--   ALTER TABLE "products" DROP COLUMN IF EXISTS "owner_merchant_id";
