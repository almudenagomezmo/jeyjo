import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Removes unused Payload ecommerce variant toggles and USD list prices.
 * Jeyjo uses ERP pricing and single-SKU products (variants: false).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "enable_variants";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "price_in_u_s_d_enabled";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "price_in_u_s_d";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_enable_variants";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_price_in_u_s_d_enabled";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_price_in_u_s_d";
    ALTER TABLE "products_gallery" DROP COLUMN IF EXISTS "variant_option_id";
    ALTER TABLE "_products_v_version_gallery" DROP COLUMN IF EXISTS "variant_option_id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "enable_variants" boolean;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "price_in_u_s_d_enabled" boolean;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "price_in_u_s_d" numeric;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_enable_variants" boolean;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_price_in_u_s_d_enabled" boolean;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_price_in_u_s_d" numeric;
    ALTER TABLE "products_gallery" ADD COLUMN IF NOT EXISTS "variant_option_id" integer;
    ALTER TABLE "_products_v_version_gallery" ADD COLUMN IF NOT EXISTS "variant_option_id" integer;
  `)
}
