/**
 * Aplica supabase/migrations/*.sql contra DATABASE_URL usando pg (sin Supabase CLI).
 * Uso: node scripts/apply-migrations-pg.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim()
  const envPath = join(root, 'apps/cms/.env')
  if (!existsSync(envPath)) return null
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^DATABASE_URL=(.+)$/)
    if (match) {
      let value = match[1].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      return value
    }
  }
  return null
}

function migrationVersion(filename) {
  return filename.replace(/\.sql$/, '').split('_')[0]
}

async function main() {
  const resetHistory = process.argv.includes('--reset-history')
  const databaseUrl = loadDatabaseUrl()
  if (!databaseUrl) {
    console.error('DATABASE_URL no encontrada (apps/cms/.env)')
    process.exit(1)
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  })

  await client.connect()
  console.log('Conectado a Postgres')

  await client.query(`
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY,
      statements text[],
      name text
    );
  `)

  if (resetHistory) {
    await client.query('DELETE FROM supabase_migrations.schema_migrations')
    console.log('Historial de migraciones reiniciado (--reset-history)')
  }

  const applied = new Set(
    (await client.query('SELECT version FROM supabase_migrations.schema_migrations')).rows.map(
      (r) => r.version,
    ),
  )

  const dir = join(root, 'supabase/migrations')
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const version = migrationVersion(file)
    if (applied.has(version)) {
      console.log(`[skip] ${file} (ya aplicada)`)
      continue
    }

    const sql = readFileSync(join(dir, file), 'utf8')
    console.log(`[apply] ${file}`)
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query(
        'INSERT INTO supabase_migrations.schema_migrations (version, statements, name) VALUES ($1, $2, $3)',
        [version, [], file],
      )
      await client.query('COMMIT')
      console.log(`[ok] ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(`[fail] ${file}:`, err.message)
      process.exit(1)
    }
  }

  await client.end()
  console.log('Migraciones completadas.')
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
