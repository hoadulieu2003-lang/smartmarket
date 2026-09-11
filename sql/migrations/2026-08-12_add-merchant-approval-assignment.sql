-- Migration: make merchant approval + stall assignment traceable and race-safe.
-- Additive and idempotent. Run only after the read-only preflight queries in
-- PRD/PLAN_TRIEN_KHAI_DANG_KY_DUYET_GAN_SAP_TIEU_THUONG.md pass.
--
-- psql "$DATABASE_URL" -f backend/sql/migrations/2026-08-12_add-merchant-approval-assignment.sql

ALTER TABLE "contracts"
  ADD COLUMN IF NOT EXISTS "source_application_id" UUID;

ALTER TABLE "merchant_applications"
  ADD COLUMN IF NOT EXISTS "approval_idempotency_key" VARCHAR(100);

DO $$
BEGIN
  ALTER TABLE "contracts"
    ADD CONSTRAINT "fk_contracts_source_application__merchant_applications_id"
    FOREIGN KEY ("source_application_id") REFERENCES "merchant_applications"("id")
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_contracts_source_application"
  ON "contracts" ("source_application_id")
  WHERE "source_application_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_merchant_applications_approval_idempotency"
  ON "merchant_applications" ("approval_idempotency_key")
  WHERE "approval_idempotency_key" IS NOT NULL;

-- Do not apply this index until duplicate open applications have been resolved
-- by the reviewed preflight query.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_merchant_applications_open_user"
  ON "merchant_applications" ("user_id")
  WHERE "status" IN ('pending', 'reviewing', 'need_more_info');

CREATE INDEX IF NOT EXISTS "idx_contracts_source_application"
  ON "contracts" ("source_application_id")
  WHERE "source_application_id" IS NOT NULL;
