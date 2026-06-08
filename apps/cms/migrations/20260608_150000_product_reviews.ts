import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Product reviews collection and denormalized review aggregates on products.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_product_reviews_status" AS ENUM('pending', 'approved', 'rejected');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_product_reviews_previous_status" AS ENUM('pending', 'approved', 'rejected');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "product_reviews" (
      "id" serial PRIMARY KEY NOT NULL,
      "review_key" varchar,
      "status" "enum_product_reviews_status" DEFAULT 'pending',
      "previous_status" "enum_product_reviews_previous_status",
      "product_id" integer NOT NULL,
      "sku_erp" varchar NOT NULL,
      "customer_id" varchar NOT NULL,
      "web_profile_id" varchar NOT NULL,
      "author_display_name" varchar NOT NULL,
      "rating" numeric NOT NULL,
      "comment" varchar NOT NULL,
      "rejection_note" varchar,
      "moderated_by_id" integer,
      "moderated_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "review_count" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "rating_average" numeric;

    ALTER TABLE "_products_v"
      ADD COLUMN IF NOT EXISTS "version_review_count" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "version_rating_average" numeric;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "product_reviews_id" integer;

    CREATE UNIQUE INDEX IF NOT EXISTS "product_reviews_review_key_idx"
      ON "product_reviews" ("review_key");
    CREATE INDEX IF NOT EXISTS "product_reviews_product_idx"
      ON "product_reviews" ("product_id");
    CREATE INDEX IF NOT EXISTS "product_reviews_sku_erp_idx"
      ON "product_reviews" ("sku_erp");
    CREATE INDEX IF NOT EXISTS "product_reviews_customer_id_idx"
      ON "product_reviews" ("customer_id");
    CREATE INDEX IF NOT EXISTS "product_reviews_web_profile_id_idx"
      ON "product_reviews" ("web_profile_id");
    CREATE INDEX IF NOT EXISTS "product_reviews_updated_at_idx"
      ON "product_reviews" ("updated_at");
    CREATE INDEX IF NOT EXISTS "product_reviews_created_at_idx"
      ON "product_reviews" ("created_at");

    DO $$ BEGIN
      ALTER TABLE "product_reviews"
        ADD CONSTRAINT "product_reviews_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "product_reviews"
        ADD CONSTRAINT "product_reviews_moderated_by_id_users_id_fk"
        FOREIGN KEY ("moderated_by_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_product_reviews_fk"
        FOREIGN KEY ("product_reviews_id") REFERENCES "public"."product_reviews"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_reviews_id_idx"
      ON "payload_locked_documents_rels" ("product_reviews_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_product_reviews_fk";
    ALTER TABLE "product_reviews"
      DROP CONSTRAINT IF EXISTS "product_reviews_moderated_by_id_users_id_fk";
    ALTER TABLE "product_reviews"
      DROP CONSTRAINT IF EXISTS "product_reviews_product_id_products_id_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_reviews_id_idx";
    DROP INDEX IF EXISTS "product_reviews_created_at_idx";
    DROP INDEX IF EXISTS "product_reviews_updated_at_idx";
    DROP INDEX IF EXISTS "product_reviews_web_profile_id_idx";
    DROP INDEX IF EXISTS "product_reviews_customer_id_idx";
    DROP INDEX IF EXISTS "product_reviews_sku_erp_idx";
    DROP INDEX IF EXISTS "product_reviews_product_idx";
    DROP INDEX IF EXISTS "product_reviews_review_key_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_reviews_id";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_rating_average";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_review_count";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "rating_average";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "review_count";

    DROP TABLE IF EXISTS "product_reviews";
    DROP TYPE IF EXISTS "enum_product_reviews_previous_status";
    DROP TYPE IF EXISTS "enum_product_reviews_status";
  `)
}
