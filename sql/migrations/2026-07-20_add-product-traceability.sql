CREATE TABLE IF NOT EXISTS "product_traceability" (
  "id" UUID NOT NULL PRIMARY KEY,
  "product_id" UUID NOT NULL UNIQUE,
  "producer_name" VARCHAR(255) NOT NULL,
  "production_address" TEXT,
  "batch_code" VARCHAR(100),
  "production_date" DATE,
  "harvest_date" DATE,
  "expiry_date" DATE,
  "certificate_name" VARCHAR(255),
  "certificate_number" VARCHAR(100),
  "documents" JSONB[] NOT NULL DEFAULT ARRAY[]::JSONB[],
  "external_url" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_product_traceability_product_id__products_id"
    FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE
);

-- Rollback: DROP TABLE IF EXISTS "product_traceability";
