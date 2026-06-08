import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Brands collection and optional product.brand relationship (0..1).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "brands" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "brands"
      ADD COLUMN IF NOT EXISTS "generate_slug" boolean DEFAULT true;

    CREATE UNIQUE INDEX IF NOT EXISTS "brands_slug_idx" ON "brands" ("slug");
    CREATE INDEX IF NOT EXISTS "brands_updated_at_idx" ON "brands" ("updated_at");
    CREATE INDEX IF NOT EXISTS "brands_created_at_idx" ON "brands" ("created_at");

    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "brand_id" integer;

    ALTER TABLE "_products_v"
      ADD COLUMN IF NOT EXISTS "version_brand_id" integer;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "brands_id" integer;

    DO $$ BEGIN
      ALTER TABLE "products"
        ADD CONSTRAINT "products_brand_id_brands_id_fk"
        FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_products_v"
        ADD CONSTRAINT "_products_v_version_brand_id_brands_id_fk"
        FOREIGN KEY ("version_brand_id") REFERENCES "public"."brands"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_brands_fk"
        FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "products_brand_idx" ON "products" ("brand_id");
    CREATE INDEX IF NOT EXISTS "_products_v_version_version_brand_idx" ON "_products_v" ("version_brand_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_brands_id_idx"
      ON "payload_locked_documents_rels" ("brands_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_brands_fk";
    ALTER TABLE "_products_v" DROP CONSTRAINT IF EXISTS "_products_v_version_brand_id_brands_id_fk";
    ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_brand_id_brands_id_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_brands_id_idx";
    DROP INDEX IF EXISTS "_products_v_version_version_brand_idx";
    DROP INDEX IF EXISTS "products_brand_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "brands_id";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_brand_id";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "brand_id";

    DROP TABLE IF EXISTS "brands";
  `)
}
