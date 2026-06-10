import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Add EUR to ecommerce currency enums (separate migration from defaults; PG requires this). */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_carts_currency" ADD VALUE IF NOT EXISTS 'EUR';
  `)
  await db.execute(sql`
    ALTER TYPE "public"."enum_orders_currency" ADD VALUE IF NOT EXISTS 'EUR';
  `)
  await db.execute(sql`
    ALTER TYPE "public"."enum_transactions_currency" ADD VALUE IF NOT EXISTS 'EUR';
  `)
}

export async function down(): Promise<void> {
  // PostgreSQL cannot remove enum values safely; defaults are reverted in the follow-up migration.
}
