-- Smart Market independent cluster: operational modules.
-- This migration only creates additive tables/columns in the NEW QL database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users ADD COLUMN IF NOT EXISTS citizen_id VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_code VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_issued_at DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_expires_at DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(24) NOT NULL DEFAULT 'unverified';
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_note TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_documents JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_updated_by UUID;

ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority VARCHAR(16) NOT NULL DEFAULT 'normal';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS public_result BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS complaint_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL, action VARCHAR(60) NOT NULL, note TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_complaint_timelines_complaint ON complaint_timelines(complaint_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fee_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  code VARCHAR(60) NOT NULL, name VARCHAR(255) NOT NULL, period_start DATE NOT NULL, period_end DATE NOT NULL,
  due_date DATE NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'draft', created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(market_id, code)
);
CREATE INDEX IF NOT EXISTS idx_fee_cycles_market_period ON fee_cycles(market_id, period_start DESC);

CREATE TABLE IF NOT EXISTS fee_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cycle_id UUID REFERENCES fee_cycles(id) ON DELETE SET NULL,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE, stall_id UUID NOT NULL REFERENCES stalls(id) ON DELETE RESTRICT,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL, code VARCHAR(60) UNIQUE NOT NULL,
  description TEXT, amount NUMERIC(14,0) NOT NULL, paid_amount NUMERIC(14,0) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'unpaid', created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_market_status_due ON fee_invoices(market_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_stall ON fee_invoices(stall_id);

CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id UUID NOT NULL REFERENCES fee_invoices(id) ON DELETE CASCADE,
  amount NUMERIC(14,0) NOT NULL, method VARCHAR(24) NOT NULL DEFAULT 'cash', reference_code VARCHAR(120), proof_url TEXT,
  note TEXT, received_by UUID REFERENCES users(id) ON DELETE SET NULL, received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fee_payments_invoice ON fee_payments(invoice_id, received_at DESC);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  stall_id UUID REFERENCES stalls(id) ON DELETE SET NULL, order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  code VARCHAR(60) UNIQUE NOT NULL, amount NUMERIC(14,0) NOT NULL, method VARCHAR(24) NOT NULL DEFAULT 'qr_manual',
  status VARCHAR(24) NOT NULL DEFAULT 'pending', proof_url TEXT, reference_code VARCHAR(120), note TEXT,
  confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL, confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_market_status ON payment_transactions(market_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS product_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE, public_token VARCHAR(80) UNIQUE NOT NULL,
  label VARCHAR(255), is_active BOOLEAN NOT NULL DEFAULT true, scan_count INT NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ, created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK ((product_id IS NOT NULL)::int + (stall_id IS NOT NULL)::int = 1)
);
CREATE INDEX IF NOT EXISTS idx_product_qr_codes_product ON product_qr_codes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_qr_codes_stall ON product_qr_codes(stall_id);

CREATE TABLE IF NOT EXISTS traceability_scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), qr_id UUID NOT NULL REFERENCES product_qr_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_traceability_scan_events_qr_created ON traceability_scan_events(qr_id, created_at DESC);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'visible';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_note TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_by UUID;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON reviews(moderation_status, created_at DESC);
