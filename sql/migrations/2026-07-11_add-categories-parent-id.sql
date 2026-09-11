-- Migration: thêm phân cấp cha/con cho bảng categories
-- Ngày: 2026-07-11
-- Mục đích: phân biệt NGÀNH HÀNG và LOẠI MẶT HÀNG bằng cột parent_id (tự tham chiếu).
--   * parent_id IS NULL   → CATEGORY (ngành hàng)  → gán cho SẠP     (vd: "Hải sản")
--   * parent_id NOT NULL  → SUBCATEGORY (loại mặt hàng) → gán cho SẢN PHẨM (vd: "Tôm", "Cua", "Cá" thuộc "Hải sản")
-- Additive + idempotent → an toàn chạy lại. KHÔNG đổi dữ liệu cũ (mọi category hiện có mặc định là ngành hàng cấp 1).

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parent_id" UUID;

-- FK tự tham chiếu; xóa ngành hàng cha → subcategory con thành cấp 1 (parent_id = NULL)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_categories_parent_id__categories_id'
  ) THEN
    ALTER TABLE "categories"
      ADD CONSTRAINT "fk_categories_parent_id__categories_id"
      FOREIGN KEY ("parent_id") REFERENCES "categories" ("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_categories_parent_id" ON "categories" ("parent_id");

-- Rollback:
-- DROP INDEX IF EXISTS "idx_categories_parent_id";
-- ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "fk_categories_parent_id__categories_id";
-- ALTER TABLE "categories" DROP COLUMN IF EXISTS "parent_id";
