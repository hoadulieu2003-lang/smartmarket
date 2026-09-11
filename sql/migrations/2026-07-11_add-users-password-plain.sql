-- Migration: thêm cột users.password_plain
-- Ngày áp dụng: 2026-07-11 (đã chạy trên DB remote qua `prisma db execute`)
-- Mục đích: lưu mật khẩu dạng plaintext song song với password_hash để Super Admin kiểm soát nội bộ.
--           Đăng nhập VẪN verify bằng password_hash (không đổi).
--
-- ⚠️ CẢNH BÁO BẢO MẬT: lưu mật khẩu plaintext là rủi ro nghiêm trọng.
--    Chỉ dùng cho môi trường dev/nội bộ. XÓA cột này trước khi lên production.
--
-- Idempotent — an toàn chạy lại nhiều lần trên DB đang tồn tại:
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_plain" VARCHAR(255);

-- Rollback:
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "password_plain";
