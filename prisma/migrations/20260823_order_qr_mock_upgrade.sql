-- CHO order/table/mock-payment/public-feedback upgrade.
-- Additive and idempotent. Apply to the NEW QL database before deploying the API.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users ADD COLUMN IF NOT EXISTS merchant_mode VARCHAR(20) NOT NULL DEFAULT 'simple';
CREATE INDEX IF NOT EXISTS idx_users_merchant_mode ON users(merchant_mode) WHERE merchant_status IS NOT NULL;

ALTER TABLE complaints ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS public_token VARCHAR(120);
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS reporter_contact VARCHAR(120);
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS payment_transaction_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS idx_complaints_public_token ON complaints(public_token) WHERE public_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_complaints_order ON complaints(order_id);

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS provider VARCHAR(32) NOT NULL DEFAULT 'manual';
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS qr_payload TEXT;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS market_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  stall_id UUID NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(120),
  qr_token VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(market_id, code)
);
CREATE INDEX IF NOT EXISTS idx_market_tables_market_stall ON market_tables(market_id, stall_id, status);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id UUID;
ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id, created_at DESC);

CREATE TABLE IF NOT EXISTS checkout_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key VARCHAR(120) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  response_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, idempotency_key)
);
