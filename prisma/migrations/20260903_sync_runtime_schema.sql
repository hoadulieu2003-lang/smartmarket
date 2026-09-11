-- Align the production database with the Prisma schema captured from the
-- currently deployed server source. This migration is additive/idempotent;
-- password_plain remains deliberately absent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "username" VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key"
  ON "users" ("username");

ALTER TABLE "users"
  DROP COLUMN IF EXISTS "password_plain";

CREATE TABLE IF NOT EXISTS "market_map_positions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "market_id" UUID NOT NULL,
  "stall_id" UUID NOT NULL,
  "x_percent" NUMERIC(6, 3) NOT NULL,
  "y_percent" NUMERIC(6, 3) NOT NULL,
  "width_percent" NUMERIC(6, 3) NOT NULL,
  "height_percent" NUMERIC(6, 3) NOT NULL,
  "rotation" NUMERIC(6, 2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "market_map_positions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_market_map_positions_market_id__markets_id"
    FOREIGN KEY ("market_id") REFERENCES "markets" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_market_map_positions_stall_id__stalls_id"
    FOREIGN KEY ("stall_id") REFERENCES "stalls" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_market_map_positions_market_stall"
  ON "market_map_positions" ("market_id", "stall_id");

CREATE INDEX IF NOT EXISTS "idx_market_map_positions_market_id"
  ON "market_map_positions" ("market_id");

CREATE INDEX IF NOT EXISTS "idx_market_map_positions_stall_id"
  ON "market_map_positions" ("stall_id");

CREATE TABLE IF NOT EXISTS "market_map_drawings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "market_id" UUID NOT NULL,
  "kind" VARCHAR(20) NOT NULL,
  "points" JSONB NOT NULL,
  "label" VARCHAR(255),
  "stroke_color" VARCHAR(20) NOT NULL,
  "fill_color" VARCHAR(20) NOT NULL,
  "stroke_width" NUMERIC(5, 2) NOT NULL DEFAULT 0.8,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "market_map_drawings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_market_map_drawings_market_id__markets_id"
    FOREIGN KEY ("market_id") REFERENCES "markets" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_market_map_drawings_market_id"
  ON "market_map_drawings" ("market_id");
