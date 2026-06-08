import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Removes unused Payload ecommerce `inventory` columns.
 * Stock is tracked via erpStock + stockIndicator (RF-005).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "inventory";
    ALTER TABLE "variants" DROP COLUMN IF EXISTS "inventory";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_inventory";
    ALTER TABLE "_variants_v" DROP COLUMN IF EXISTS "version_inventory";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "inventory" numeric;
    ALTER TABLE "variants" ADD COLUMN IF NOT EXISTS "inventory" numeric;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_inventory" numeric;
    ALTER TABLE "_variants_v" ADD COLUMN IF NOT EXISTS "version_inventory" numeric;
  `)
}
