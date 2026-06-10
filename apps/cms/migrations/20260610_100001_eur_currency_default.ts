import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Default new ecommerce records to EUR after enum values exist. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'EUR';
    ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'EUR';
    ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'EUR';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'USD';
    ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'USD';
    ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'USD';
  `)
}
