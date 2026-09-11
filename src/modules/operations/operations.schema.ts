import { prisma } from '../../shared/prisma';

let ready: Promise<void> | undefined;

/** Additive bootstrap for the independent QL database. Safe to run repeatedly. */
export function ensureOperationsSchema() {
  if (ready) return ready;
  ready = (async () => {
    const statements = [
      `CREATE EXTENSION IF NOT EXISTS pgcrypto`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS citizen_id VARCHAR(30)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_code VARCHAR(30)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_issued_at DATE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_expires_at DATE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(24) NOT NULL DEFAULT 'unverified'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_note TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_documents JSONB NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS merchant_mode VARCHAR(20) NOT NULL DEFAULT 'simple'`,
      `CREATE INDEX IF NOT EXISTS idx_users_merchant_mode ON users(merchant_mode) WHERE merchant_status IS NOT NULL`,
      `ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_to UUID`,
      `ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority VARCHAR(16) NOT NULL DEFAULT 'normal'`,
      `ALTER TABLE complaints ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ`,
      `ALTER TABLE complaints ADD COLUMN IF NOT EXISTS public_result BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE complaints ALTER COLUMN user_id DROP NOT NULL`,
      `ALTER TABLE complaints ADD COLUMN IF NOT EXISTS public_token VARCHAR(120)`,
      `ALTER TABLE complaints ADD COLUMN IF NOT EXISTS reporter_contact VARCHAR(120)`,
      `ALTER TABLE complaints ADD COLUMN IF NOT EXISTS order_id UUID`,
      `ALTER TABLE complaints ADD COLUMN IF NOT EXISTS payment_transaction_id UUID`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_complaints_public_token ON complaints(public_token) WHERE public_token IS NOT NULL`,
      `CREATE INDEX IF NOT EXISTS idx_complaints_order ON complaints(order_id)`,
      `CREATE TABLE IF NOT EXISTS complaint_timelines (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE, actor_id UUID REFERENCES users(id) ON DELETE SET NULL, action VARCHAR(60) NOT NULL, note TEXT, is_public BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
      `CREATE INDEX IF NOT EXISTS idx_complaint_timelines_complaint ON complaint_timelines(complaint_id, created_at DESC)`,
      `CREATE TABLE IF NOT EXISTS fee_cycles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE, code VARCHAR(60) NOT NULL, name VARCHAR(255) NOT NULL, period_start DATE NOT NULL, period_end DATE NOT NULL, due_date DATE NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'draft', created_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(market_id, code))`,
      `CREATE INDEX IF NOT EXISTS idx_fee_cycles_market_period ON fee_cycles(market_id, period_start DESC)`,
      `CREATE TABLE IF NOT EXISTS fee_invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cycle_id UUID REFERENCES fee_cycles(id) ON DELETE SET NULL, market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE, stall_id UUID NOT NULL REFERENCES stalls(id) ON DELETE RESTRICT, contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL, code VARCHAR(60) UNIQUE NOT NULL, description TEXT, amount NUMERIC(14,0) NOT NULL, paid_amount NUMERIC(14,0) NOT NULL DEFAULT 0, due_date DATE NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'unpaid', created_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
      `CREATE INDEX IF NOT EXISTS idx_fee_invoices_market_status_due ON fee_invoices(market_id, status, due_date)`,
      `CREATE TABLE IF NOT EXISTS fee_payments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id UUID NOT NULL REFERENCES fee_invoices(id) ON DELETE CASCADE, amount NUMERIC(14,0) NOT NULL, method VARCHAR(24) NOT NULL DEFAULT 'cash', reference_code VARCHAR(120), proof_url TEXT, note TEXT, received_by UUID REFERENCES users(id) ON DELETE SET NULL, received_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
      `CREATE TABLE IF NOT EXISTS payment_transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE, stall_id UUID REFERENCES stalls(id) ON DELETE SET NULL, order_id UUID REFERENCES orders(id) ON DELETE SET NULL, code VARCHAR(60) UNIQUE NOT NULL, amount NUMERIC(14,0) NOT NULL, method VARCHAR(24) NOT NULL DEFAULT 'qr_manual', status VARCHAR(24) NOT NULL DEFAULT 'pending', proof_url TEXT, reference_code VARCHAR(120), note TEXT, confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL, confirmed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
      `ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS provider VARCHAR(32) NOT NULL DEFAULT 'manual'`,
      `ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS qr_payload TEXT`,
      `ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`,
      `ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS failure_reason TEXT`,
      `ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`,
      `CREATE INDEX IF NOT EXISTS idx_payment_transactions_market_status ON payment_transactions(market_id, status, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id, created_at DESC)`,
      `CREATE TABLE IF NOT EXISTS market_tables (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE, stall_id UUID NOT NULL REFERENCES stalls(id) ON DELETE CASCADE, code VARCHAR(40) NOT NULL, name VARCHAR(120), qr_token VARCHAR(100) UNIQUE NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'active', created_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(market_id, code))`,
      `CREATE INDEX IF NOT EXISTS idx_market_tables_market_stall ON market_tables(market_id, stall_id, status)`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id UUID`,
      `ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL`,
      `CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id, created_at DESC)`,
      `CREATE TABLE IF NOT EXISTS checkout_idempotency (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, idempotency_key VARCHAR(120) NOT NULL, request_hash VARCHAR(64) NOT NULL, response_json JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id, idempotency_key))`,
      `CREATE TABLE IF NOT EXISTS product_qr_codes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID REFERENCES products(id) ON DELETE CASCADE, stall_id UUID REFERENCES stalls(id) ON DELETE CASCADE, public_token VARCHAR(80) UNIQUE NOT NULL, label VARCHAR(255), is_active BOOLEAN NOT NULL DEFAULT true, scan_count INT NOT NULL DEFAULT 0, last_scanned_at TIMESTAMPTZ, created_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
      `CREATE INDEX IF NOT EXISTS idx_product_qr_codes_product ON product_qr_codes(product_id)`,
      `CREATE TABLE IF NOT EXISTS traceability_scan_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), qr_id UUID NOT NULL REFERENCES product_qr_codes(id) ON DELETE CASCADE, user_id UUID REFERENCES users(id) ON DELETE SET NULL, user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
      `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'visible'`,
      `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_note TEXT`,
      `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_by UUID`,
      `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ`,
      `CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON reviews(moderation_status, created_at DESC)`,
    ];
    for (const sql of statements) await prisma.$executeRawUnsafe(sql);
  })().catch((error) => { ready = undefined; throw error; });
  return ready;
}
