import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Align group-offers enum name with Payload slug-based expectation. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_group_offers_customer_group" AS ENUM('', '1', '2', '3', '4');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "cms_group_offers"
      ALTER COLUMN "customer_group" TYPE "enum_group_offers_customer_group"
      USING "customer_group"::text::"enum_group_offers_customer_group";

    DROP TYPE IF EXISTS "public"."enum_cms_group_offers_customer_group";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_cms_group_offers_customer_group" AS ENUM('', '1', '2', '3', '4');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "cms_group_offers"
      ALTER COLUMN "customer_group" TYPE "enum_cms_group_offers_customer_group"
      USING "customer_group"::text::"enum_cms_group_offers_customer_group";

    DROP TYPE IF EXISTS "public"."enum_group_offers_customer_group";
  `)
}
