-- Migration: lưu sơ đồ chợ đa tầng dưới dạng document JSONB trên bảng markets hiện có
-- Ngày áp dụng: 2026-08-11
--
-- Additive, idempotent. Không tạo bảng mới và không thay đổi dữ liệu zones/stalls hiện hữu.
-- Chạy thủ công sau khi backup production:
--   psql "$DATABASE_URL" -f backend/sql/migrations/2026-08-11_add-market-layout-json.sql

ALTER TABLE "markets" ADD COLUMN IF NOT EXISTS "map_layout_draft" JSONB;
ALTER TABLE "markets" ADD COLUMN IF NOT EXISTS "map_layout_draft_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "markets" ADD COLUMN IF NOT EXISTS "map_layout_published" JSONB;
ALTER TABLE "markets" ADD COLUMN IF NOT EXISTS "map_layout_revisions" JSONB NOT NULL DEFAULT '[]'::JSONB;

-- Rollback (chỉ dùng khi chưa có dữ liệu layout cần giữ):
-- ALTER TABLE "markets" DROP COLUMN IF EXISTS "map_layout_revisions";
-- ALTER TABLE "markets" DROP COLUMN IF EXISTS "map_layout_published";
-- ALTER TABLE "markets" DROP COLUMN IF EXISTS "map_layout_draft_version";
-- ALTER TABLE "markets" DROP COLUMN IF EXISTS "map_layout_draft";
