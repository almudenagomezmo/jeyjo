import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Payload rel columns follow collection dbName (cms_special_prices, cms_group_offers).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        RENAME COLUMN "special_prices_id" TO "cms_special_prices_id";
    EXCEPTION
      WHEN undefined_column THEN NULL;
      WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        RENAME COLUMN "group_offers_id" TO "cms_group_offers_id";
    EXCEPTION
      WHEN undefined_column THEN NULL;
      WHEN duplicate_column THEN NULL;
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "cms_special_prices_id" integer,
      ADD COLUMN IF NOT EXISTS "cms_group_offers_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        RENAME CONSTRAINT "payload_locked_documents_rels_special_prices_fk"
        TO "payload_locked_documents_rels_cms_special_prices_fk";
    EXCEPTION WHEN undefined_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        RENAME CONSTRAINT "payload_locked_documents_rels_group_offers_fk"
        TO "payload_locked_documents_rels_cms_group_offers_fk";
    EXCEPTION WHEN undefined_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER INDEX "payload_locked_documents_rels_special_prices_id_idx"
        RENAME TO "payload_locked_documents_rels_cms_special_prices_id_idx";
    EXCEPTION WHEN undefined_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER INDEX "payload_locked_documents_rels_group_offers_id_idx"
        RENAME TO "payload_locked_documents_rels_cms_group_offers_id_idx";
    EXCEPTION WHEN undefined_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_cms_special_prices_id_idx"
      ON "payload_locked_documents_rels" USING btree ("cms_special_prices_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_cms_group_offers_id_idx"
      ON "payload_locked_documents_rels" USING btree ("cms_group_offers_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        RENAME COLUMN "cms_special_prices_id" TO "special_prices_id";
    EXCEPTION
      WHEN undefined_column THEN NULL;
      WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        RENAME COLUMN "cms_group_offers_id" TO "group_offers_id";
    EXCEPTION
      WHEN undefined_column THEN NULL;
      WHEN duplicate_column THEN NULL;
    END $$;
  `)
}
