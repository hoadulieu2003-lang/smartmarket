CREATE SCHEMA IF NOT EXISTS "public";
SET search_path TO "public";
DO $$ BEGIN
  CREATE TYPE "application_status" AS ENUM ('pending', 'reviewing', 'need_more_info', 'approved', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "complaint_status" AS ENUM ('new', 'processing', 'resolved', 'rejected', 'escalated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "complaint_type" AS ENUM ('product_quality', 'price_issue', 'food_safety', 'service_attitude', 'weighing_fraud', 'infrastructure', 'order_issue', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "discount_type" AS ENUM ('percent', 'fixed_price');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "market_status" AS ENUM ('active', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "merchant_status" AS ENUM ('active', 'suspended', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "notification_priority" AS ENUM ('normal', 'important', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "notification_target" AS ENUM ('market', 'zone', 'category', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "notification_type" AS ENUM ('general', 'maintenance', 'fee', 'complaint', 'application', 'order', 'promotion', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "order_cancelled_by" AS ENUM ('buyer', 'seller', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "order_status" AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "receive_type" AS ENUM ('pickup', 'delivery');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "stall_status" AS ENUM ('vacant', 'occupied', 'maintenance', 'reserved');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM ('super_admin', 'province_admin', 'market_manager', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "user_status" AS ENUM ('inactive', 'active');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "provinces" (
  "id" UUID NOT NULL PRIMARY KEY,
  "code" VARCHAR(20) NOT NULL UNIQUE,
  "name" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "categories" (
  "id" UUID NOT NULL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "display_order" INTEGER NOT NULL,
  "parent_id" UUID, -- NULL = ngành hàng (gán sạp); != NULL = loại mặt hàng (gán sản phẩm)
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "markets" (
  "id" UUID NOT NULL PRIMARY KEY,
  "province_id" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "name" VARCHAR(255) NOT NULL,
  "address" TEXT NOT NULL,
  "latitude" NUMERIC(9, 6),
  "longitude" NUMERIC(9, 6),
  "phone" VARCHAR(20),
  "email" VARCHAR(255),
  "description" TEXT,
  "images" JSONB[] NOT NULL,
  "open_hours" VARCHAR(100),
  "map_link" TEXT,
  "status" "market_status" NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "users" (
  "id" UUID NOT NULL PRIMARY KEY,
  "zalo_id" VARCHAR(100) UNIQUE,
  "username" VARCHAR(100) UNIQUE,
  "phone" VARCHAR(20) UNIQUE,
  "email" VARCHAR(255) UNIQUE,
  "password_hash" VARCHAR(255),
  "full_name" VARCHAR(255) NOT NULL,
  "avatar" TEXT,
  "gender" SMALLINT,
  "role" "user_role" NOT NULL,
  "status" "user_status" NOT NULL,
  "province_id" UUID,
  "selected_market_id" UUID,
  "merchant_status" "merchant_status",
  "merchant_mode" VARCHAR(20) NOT NULL DEFAULT 'simple',
  "merchant_market_id" UUID,
  "merchant_category_id" UUID,
  "merchant_joined_at" TIMESTAMPTZ,
  "bank_name" VARCHAR(255),
  "bank_code" VARCHAR(50),
  "bank_account_number" VARCHAR(50),
  "bank_account_holder" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "market_managers" (
  "user_id" UUID NOT NULL,
  "market_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  PRIMARY KEY ("user_id", "market_id")
);

CREATE TABLE "zones" (
  "id" UUID NOT NULL PRIMARY KEY,
  "market_id" UUID NOT NULL,
  "category_id" UUID,
  "code" VARCHAR(20) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "display_order" INTEGER NOT NULL,
  "grid_columns" INTEGER,
  "is_active" BOOLEAN NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "uq_zones_market_id_code" UNIQUE ("market_id", "code")
);

CREATE TABLE "stalls" (
  "id" UUID NOT NULL PRIMARY KEY,
  "market_id" UUID NOT NULL,
  "zone_id" UUID NOT NULL,
  "category_id" UUID,
  "code" VARCHAR(20) NOT NULL,
  "name" VARCHAR(255),
  "description" TEXT,
  "images" JSONB[] NOT NULL,
  "acreage" NUMERIC(8, 2),
  "phone" VARCHAR(20),
  "open_hours" VARCHAR(100),
  "status" "stall_status" NOT NULL,
  "display_order" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "uq_stalls_market_id_code" UNIQUE ("market_id", "code")
);

CREATE TABLE "merchant_applications" (
  "id" UUID NOT NULL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "market_id" UUID NOT NULL,
  "category_id" UUID,
  "full_name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "id_number" VARCHAR(20) NOT NULL,
  "business_description" TEXT,
  "desired_stall_note" TEXT,
  "documents" JSONB[] NOT NULL,
  "status" "application_status" NOT NULL,
  "admin_note" TEXT,
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "contracts" (
  "id" UUID NOT NULL PRIMARY KEY,
  "stall_id" UUID NOT NULL,
  "merchant_id" UUID NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "fee" NUMERIC(14, 0) NOT NULL,
  "content" TEXT,
  "end_reason" TEXT,
  "ended_at" TIMESTAMPTZ,
  "created_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "products" (
  "id" UUID NOT NULL PRIMARY KEY,
  "stall_id" UUID NOT NULL,
  "category_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "images" JSONB[] NOT NULL,
  "price" NUMERIC(14, 0) NOT NULL,
  "unit" VARCHAR(20) NOT NULL,
  "quantity" NUMERIC(10, 2) NOT NULL,
  "origin" VARCHAR(255),
  "is_hidden" BOOLEAN NOT NULL,
  "discount_type" "discount_type",
  "discount_value" NUMERIC(14, 2),
  "discount_start_at" TIMESTAMPTZ,
  "discount_end_at" TIMESTAMPTZ,
  "rating_avg" NUMERIC(3, 2) NOT NULL,
  "review_count" INTEGER NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "product_traceability" (
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
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "orders" (
  "id" UUID NOT NULL PRIMARY KEY,
  "code" VARCHAR(30) NOT NULL UNIQUE,
  "customer_id" UUID NOT NULL,
  "market_id" UUID NOT NULL,
  "stall_id" UUID NOT NULL,
  "checkout_group_id" UUID,
  "status" "order_status" NOT NULL,
  "receive_type" "receive_type" NOT NULL,
  "receiver_name" VARCHAR(255) NOT NULL,
  "receiver_phone" VARCHAR(20) NOT NULL,
  "note" TEXT,
  "total_amount" NUMERIC(14, 0) NOT NULL,
  "cancel_reason" TEXT,
  "cancelled_by" "order_cancelled_by",
  "confirmed_at" TIMESTAMPTZ,
  "preparing_at" TIMESTAMPTZ,
  "ready_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "cancelled_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "order_items" (
  "id" UUID NOT NULL PRIMARY KEY,
  "order_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "product_name" VARCHAR(255) NOT NULL,
  "product_image" TEXT,
  "unit" VARCHAR(20) NOT NULL,
  "original_price" NUMERIC(14, 0) NOT NULL,
  "unit_price" NUMERIC(14, 0) NOT NULL,
  "quantity" NUMERIC(10, 2) NOT NULL,
  "line_total" NUMERIC(14, 0) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "reviews" (
  "id" UUID NOT NULL PRIMARY KEY,
  "product_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "rating" SMALLINT NOT NULL,
  "content" TEXT,
  "images" JSONB[] NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "uq_reviews_user_id_product_id" UNIQUE ("user_id", "product_id")
);

CREATE TABLE "complaints" (
  "id" UUID NOT NULL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "market_id" UUID NOT NULL,
  "stall_id" UUID,
  "product_id" UUID,
  "type" "complaint_type" NOT NULL,
  "content" TEXT NOT NULL,
  "images" JSONB[] NOT NULL,
  "status" "complaint_status" NOT NULL,
  "resolution_note" TEXT,
  "resolution_images" JSONB[] NOT NULL,
  "resolved_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL PRIMARY KEY,
  "market_id" UUID,
  "created_by" UUID,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "type" "notification_type" NOT NULL,
  "priority" "notification_priority" NOT NULL,
  "target_type" "notification_target" NOT NULL,
  "target_id" UUID,
  "attachment" TEXT,
  "ref_type" VARCHAR(50),
  "ref_id" UUID,
  "sent_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "notification_recipients" (
  "notification_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "read_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  PRIMARY KEY ("notification_id", "user_id")
);

CREATE TABLE "system_audits" (
  "id" UUID NOT NULL PRIMARY KEY,
  "user_id" UUID,
  "action" VARCHAR(100) NOT NULL,
  "table_name" VARCHAR(100),
  "record_id" UUID,
  "description" TEXT,
  "ip_address" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "app_settings" (
  "id" UUID NOT NULL PRIMARY KEY,
  "key" VARCHAR(100) NOT NULL UNIQUE,
  "value" JSONB NOT NULL,
  "description" TEXT NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL
);

ALTER TABLE "markets" ADD CONSTRAINT "fk_markets_province_id__provinces_id" FOREIGN KEY ("province_id") REFERENCES "provinces" ("id");

ALTER TABLE "users" ADD CONSTRAINT "fk_users_province_id__provinces_id" FOREIGN KEY ("province_id") REFERENCES "provinces" ("id");

ALTER TABLE "users" ADD CONSTRAINT "fk_users_selected_market_id__markets_id" FOREIGN KEY ("selected_market_id") REFERENCES "markets" ("id");

ALTER TABLE "users" ADD CONSTRAINT "fk_users_merchant_market_id__markets_id" FOREIGN KEY ("merchant_market_id") REFERENCES "markets" ("id");

ALTER TABLE "users" ADD CONSTRAINT "fk_users_merchant_category_id__categories_id" FOREIGN KEY ("merchant_category_id") REFERENCES "categories" ("id");

ALTER TABLE "market_managers" ADD CONSTRAINT "fk_market_managers_user_id__users_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "market_managers" ADD CONSTRAINT "fk_market_managers_market_id__markets_id" FOREIGN KEY ("market_id") REFERENCES "markets" ("id");

ALTER TABLE "zones" ADD CONSTRAINT "fk_zones_market_id__markets_id" FOREIGN KEY ("market_id") REFERENCES "markets" ("id");

ALTER TABLE "zones" ADD CONSTRAINT "fk_zones_category_id__categories_id" FOREIGN KEY ("category_id") REFERENCES "categories" ("id");

ALTER TABLE "stalls" ADD CONSTRAINT "fk_stalls_market_id__markets_id" FOREIGN KEY ("market_id") REFERENCES "markets" ("id");

ALTER TABLE "stalls" ADD CONSTRAINT "fk_stalls_zone_id__zones_id" FOREIGN KEY ("zone_id") REFERENCES "zones" ("id");

ALTER TABLE "stalls" ADD CONSTRAINT "fk_stalls_category_id__categories_id" FOREIGN KEY ("category_id") REFERENCES "categories" ("id");

ALTER TABLE "merchant_applications" ADD CONSTRAINT "fk_merchant_applications_user_id__users_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "merchant_applications" ADD CONSTRAINT "fk_merchant_applications_market_id__markets_id" FOREIGN KEY ("market_id") REFERENCES "markets" ("id");

ALTER TABLE "merchant_applications" ADD CONSTRAINT "fk_merchant_applications_category_id__categories_id" FOREIGN KEY ("category_id") REFERENCES "categories" ("id");

ALTER TABLE "merchant_applications" ADD CONSTRAINT "fk_merchant_applications_reviewed_by__users_id" FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id");

ALTER TABLE "contracts" ADD CONSTRAINT "fk_contracts_stall_id__stalls_id" FOREIGN KEY ("stall_id") REFERENCES "stalls" ("id");

ALTER TABLE "contracts" ADD CONSTRAINT "fk_contracts_merchant_id__users_id" FOREIGN KEY ("merchant_id") REFERENCES "users" ("id");

ALTER TABLE "contracts" ADD CONSTRAINT "fk_contracts_created_by__users_id" FOREIGN KEY ("created_by") REFERENCES "users" ("id");

ALTER TABLE "products" ADD CONSTRAINT "fk_products_stall_id__stalls_id" FOREIGN KEY ("stall_id") REFERENCES "stalls" ("id");

ALTER TABLE "products" ADD CONSTRAINT "fk_products_category_id__categories_id" FOREIGN KEY ("category_id") REFERENCES "categories" ("id");

ALTER TABLE "product_traceability" ADD CONSTRAINT "fk_product_traceability_product_id__products_id" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "fk_categories_parent_id__categories_id" FOREIGN KEY ("parent_id") REFERENCES "categories" ("id") ON DELETE SET NULL;

ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_customer_id__users_id" FOREIGN KEY ("customer_id") REFERENCES "users" ("id");

ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_market_id__markets_id" FOREIGN KEY ("market_id") REFERENCES "markets" ("id");

ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_stall_id__stalls_id" FOREIGN KEY ("stall_id") REFERENCES "stalls" ("id");

ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_items_order_id__orders_id" FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_items_product_id__products_id" FOREIGN KEY ("product_id") REFERENCES "products" ("id");

ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_product_id__products_id" FOREIGN KEY ("product_id") REFERENCES "products" ("id");

ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_user_id__users_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "complaints" ADD CONSTRAINT "fk_complaints_user_id__users_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "complaints" ADD CONSTRAINT "fk_complaints_market_id__markets_id" FOREIGN KEY ("market_id") REFERENCES "markets" ("id");

ALTER TABLE "complaints" ADD CONSTRAINT "fk_complaints_stall_id__stalls_id" FOREIGN KEY ("stall_id") REFERENCES "stalls" ("id");

ALTER TABLE "complaints" ADD CONSTRAINT "fk_complaints_product_id__products_id" FOREIGN KEY ("product_id") REFERENCES "products" ("id");

ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_market_id__markets_id" FOREIGN KEY ("market_id") REFERENCES "markets" ("id");

ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_created_by__users_id" FOREIGN KEY ("created_by") REFERENCES "users" ("id");

ALTER TABLE "notification_recipients" ADD CONSTRAINT "fk_notification_recipients_notification_id__notifications_id" FOREIGN KEY ("notification_id") REFERENCES "notifications" ("id");

ALTER TABLE "notification_recipients" ADD CONSTRAINT "fk_notification_recipients_user_id__users_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "system_audits" ADD CONSTRAINT "fk_system_audits_user_id__users_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id");

-- Rule R6: mot sap chi co mot hop dong thue dang hieu luc
CREATE UNIQUE INDEX "uq_contracts_active_stall" ON "contracts" ("stall_id") WHERE "ended_at" IS NULL;

-- Index tra cuu chinh (Postgres khong tu tao index cho FK)
CREATE INDEX "idx_markets_province_id" ON "markets" ("province_id");
CREATE INDEX "idx_users_merchant_market_id" ON "users" ("merchant_market_id");
CREATE INDEX "idx_zones_market_id" ON "zones" ("market_id");
CREATE INDEX "idx_stalls_zone_id" ON "stalls" ("zone_id");
CREATE INDEX "idx_stalls_market_id_status" ON "stalls" ("market_id", "status");
CREATE INDEX "idx_merchant_applications_market_id_status" ON "merchant_applications" ("market_id", "status");
CREATE INDEX "idx_merchant_applications_user_id" ON "merchant_applications" ("user_id");
CREATE INDEX "idx_contracts_stall_id" ON "contracts" ("stall_id");
CREATE INDEX "idx_contracts_merchant_id" ON "contracts" ("merchant_id");
CREATE INDEX "idx_contracts_end_date" ON "contracts" ("end_date") WHERE "ended_at" IS NULL;
CREATE INDEX "idx_products_stall_id" ON "products" ("stall_id");
CREATE INDEX "idx_products_category_id" ON "products" ("category_id");
CREATE INDEX "idx_categories_parent_id" ON "categories" ("parent_id");
CREATE INDEX "idx_orders_customer_id_created_at" ON "orders" ("customer_id", "created_at");
CREATE INDEX "idx_orders_stall_id_status" ON "orders" ("stall_id", "status");
CREATE INDEX "idx_orders_market_id_created_at" ON "orders" ("market_id", "created_at");
CREATE INDEX "idx_orders_checkout_group_id" ON "orders" ("checkout_group_id");
CREATE INDEX "idx_order_items_order_id" ON "order_items" ("order_id");
CREATE INDEX "idx_order_items_product_id" ON "order_items" ("product_id");
CREATE INDEX "idx_reviews_product_id" ON "reviews" ("product_id");
CREATE INDEX "idx_complaints_market_id_status" ON "complaints" ("market_id", "status");
CREATE INDEX "idx_complaints_stall_id" ON "complaints" ("stall_id");
CREATE INDEX "idx_complaints_user_id" ON "complaints" ("user_id");
CREATE INDEX "idx_notifications_market_id" ON "notifications" ("market_id");
CREATE INDEX "idx_notification_recipients_user_id" ON "notification_recipients" ("user_id");
CREATE INDEX "idx_system_audits_table_name_record_id" ON "system_audits" ("table_name", "record_id");
