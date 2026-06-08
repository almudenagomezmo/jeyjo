import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * site-pages collection + locked-documents rel column missing after dev push drift.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_site_pages_page_type" AS ENUM('legal', 'faq', 'help');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "site_pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar NOT NULL,
      "page_type" "enum_site_pages_page_type" DEFAULT 'legal' NOT NULL,
      "content" jsonb NOT NULL,
      "meta_description" varchar,
      "published" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "site_pages_id" integer;

    CREATE UNIQUE INDEX IF NOT EXISTS "site_pages_slug_idx"
      ON "site_pages" ("slug");
    CREATE INDEX IF NOT EXISTS "site_pages_updated_at_idx"
      ON "site_pages" ("updated_at");
    CREATE INDEX IF NOT EXISTS "site_pages_created_at_idx"
      ON "site_pages" ("created_at");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_site_pages_fk"
        FOREIGN KEY ("site_pages_id") REFERENCES "public"."site_pages"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_site_pages_id_idx"
      ON "payload_locked_documents_rels" ("site_pages_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_site_pages_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_site_pages_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "site_pages_id";
    DROP TABLE IF EXISTS "site_pages" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_site_pages_page_type";
  `)
}
