import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Incremental schema for web-native-operations Payload collections.
 * Uses cms_* table names for pricing collections to avoid Supabase table collisions.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_customer_documents_document_type" AS ENUM(
        'invoice', 'delivery_note', 'due_payment', 'form_347', 'erp_quote'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_group_offers_customer_group" AS ENUM('', '1', '2', '3', '4');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "customer_documents" (
      "id" serial PRIMARY KEY NOT NULL,
      "customer_id" varchar NOT NULL,
      "document_type" "enum_customer_documents_document_type" NOT NULL,
      "document_number" varchar NOT NULL,
      "issued_at" timestamp(3) with time zone NOT NULL,
      "net_amount" numeric,
      "gross_amount" numeric,
      "due_date" timestamp(3) with time zone,
      "outstanding_amount" numeric,
      "status" varchar,
      "pdf_file_id" integer NOT NULL,
      "storage_path" varchar,
      "fiscal_year" numeric,
      "valid_until" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "cms_special_prices" (
      "id" serial PRIMARY KEY NOT NULL,
      "customer_id" varchar NOT NULL,
      "product_sku" varchar NOT NULL,
      "net_price" numeric NOT NULL,
      "discount1_pct" numeric,
      "discount2_pct" numeric,
      "min_qty" numeric,
      "valid_from" timestamp(3) with time zone NOT NULL,
      "valid_to" timestamp(3) with time zone,
      "supabase_id" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "cms_group_offers" (
      "id" serial PRIMARY KEY NOT NULL,
      "product_sku" varchar NOT NULL,
      "offer_net_price" numeric NOT NULL,
      "customer_group" "enum_group_offers_customer_group",
      "valid_from" timestamp(3) with time zone NOT NULL,
      "valid_to" timestamp(3) with time zone,
      "active" boolean DEFAULT true,
      "supabase_id" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "system_settings"
      ADD COLUMN IF NOT EXISTS "web_native_mode" boolean DEFAULT true;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "customer_documents_id" integer,
      ADD COLUMN IF NOT EXISTS "cms_special_prices_id" integer,
      ADD COLUMN IF NOT EXISTS "cms_group_offers_id" integer;

    DO $$ BEGIN
      ALTER TABLE "customer_documents"
        ADD CONSTRAINT "customer_documents_pdf_file_id_media_id_fk"
        FOREIGN KEY ("pdf_file_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_customer_documents_fk"
        FOREIGN KEY ("customer_documents_id") REFERENCES "public"."customer_documents"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_cms_special_prices_fk"
        FOREIGN KEY ("cms_special_prices_id") REFERENCES "public"."cms_special_prices"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_cms_group_offers_fk"
        FOREIGN KEY ("cms_group_offers_id") REFERENCES "public"."cms_group_offers"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "customer_documents_customer_id_idx"
      ON "customer_documents" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "customer_documents_document_type_idx"
      ON "customer_documents" USING btree ("document_type");
    CREATE INDEX IF NOT EXISTS "customer_documents_pdf_file_idx"
      ON "customer_documents" USING btree ("pdf_file_id");
    CREATE INDEX IF NOT EXISTS "customer_documents_updated_at_idx"
      ON "customer_documents" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "customer_documents_created_at_idx"
      ON "customer_documents" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "cms_special_prices_customer_id_idx"
      ON "cms_special_prices" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "cms_special_prices_updated_at_idx"
      ON "cms_special_prices" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "cms_special_prices_created_at_idx"
      ON "cms_special_prices" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "cms_group_offers_updated_at_idx"
      ON "cms_group_offers" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "cms_group_offers_created_at_idx"
      ON "cms_group_offers" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_customer_documents_id_idx"
      ON "payload_locked_documents_rels" USING btree ("customer_documents_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_cms_special_prices_id_idx"
      ON "payload_locked_documents_rels" USING btree ("cms_special_prices_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_cms_group_offers_id_idx"
      ON "payload_locked_documents_rels" USING btree ("cms_group_offers_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_cms_group_offers_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_cms_special_prices_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_customer_documents_fk";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "cms_group_offers_id",
      DROP COLUMN IF EXISTS "cms_special_prices_id",
      DROP COLUMN IF EXISTS "customer_documents_id";

    ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "web_native_mode";

    DROP TABLE IF EXISTS "cms_group_offers" CASCADE;
    DROP TABLE IF EXISTS "cms_special_prices" CASCADE;
    DROP TABLE IF EXISTS "customer_documents" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_group_offers_customer_group";
    DROP TYPE IF EXISTS "public"."enum_customer_documents_document_type";
  `)
}
