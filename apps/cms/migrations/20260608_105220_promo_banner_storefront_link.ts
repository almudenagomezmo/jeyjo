import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Replace promo banner plain `href` text with structured `destination` link group.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_home_promo_banners_destination_type" AS ENUM('reference', 'custom');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "home_promo_banners"
      ADD COLUMN IF NOT EXISTS "destination_type" "enum_home_promo_banners_destination_type" DEFAULT 'reference',
      ADD COLUMN IF NOT EXISTS "destination_url" varchar;

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'home_promo_banners'
          AND column_name = 'href'
      ) THEN
        UPDATE "home_promo_banners"
        SET
          "destination_type" = 'custom',
          "destination_url" = "href"
        WHERE "href" IS NOT NULL
          AND TRIM("href") <> ''
          AND ("destination_url" IS NULL OR TRIM("destination_url") = '');

        ALTER TABLE "home_promo_banners" DROP COLUMN "href";
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home_promo_banners"
      ADD COLUMN IF NOT EXISTS "href" varchar;

    UPDATE "home_promo_banners"
    SET "href" = "destination_url"
    WHERE "destination_type" = 'custom'
      AND "destination_url" IS NOT NULL
      AND TRIM("destination_url") <> '';

    ALTER TABLE "home_promo_banners"
      DROP COLUMN IF EXISTS "destination_type",
      DROP COLUMN IF EXISTS "destination_url";
  `)
}
