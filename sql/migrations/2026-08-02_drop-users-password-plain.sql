-- Migration: xóa cột users.password_plain
-- Ngày áp dụng: 2026-08-02
-- Mục đích: gỡ bỏ việc lưu mật khẩu dạng plaintext (rủi ro bảo mật).
--           Đăng nhập vẫn verify bằng password_hash — không ảnh hưởng.
--           Đảo ngược migration 2026-07-11_add-users-password-plain.sql
--
-- ⚠️ Dữ liệu trong cột này sẽ mất vĩnh viễn (đúng như mong muốn).
--
-- Idempotent — an toàn chạy lại nhiều lần:
ALTER TABLE "users" DROP COLUMN IF EXISTS "password_plain";

-- Rollback (KHÔNG khuyến nghị — chỉ tạo lại cột rỗng, không khôi phục dữ liệu):
-- ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_plain" VARCHAR(255);
