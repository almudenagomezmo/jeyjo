/**
 * Aplica supabase/seed.sql contra la BD indicada en DATABASE_URL (apps/cms/.env).
 * Pensado para Supabase Cloud — no requiere `supabase start` ni Docker local.
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim()
  }

  const envPath = join(root, 'apps/cms/.env')
  if (!existsSync(envPath)) {
    return null
  }

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

function splitSqlStatements(sql) {
  return sql
    .split(';')
    .map((chunk) =>
      chunk
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter((statement) => statement.length > 0)
}

const databaseUrl = loadDatabaseUrl()
if (!databaseUrl) {
  console.error('[db:seed] DATABASE_URL no está definida en apps/cms/.env')
  process.exit(1)
}

if (databaseUrl.includes('127.0.0.1:54322') || databaseUrl.includes('localhost:54322')) {
  console.warn('[db:seed] DATABASE_URL apunta a Supabase local (54322). ¿Es intencionado?')
}

const seedFile = join(root, 'supabase/seed.sql')
const statements = splitSqlStatements(readFileSync(seedFile, 'utf8'))

if (statements.length === 0) {
  console.error('[db:seed] No hay sentencias SQL en supabase/seed.sql')
  process.exit(1)
}

const tmpDir = mkdtempSync(join(tmpdir(), 'jeyjo-seed-'))

try {
  console.log(`[db:seed] Aplicando ${statements.length} sentencias de seed.sql contra Supabase…`)

  for (let i = 0; i < statements.length; i++) {
    const file = join(tmpDir, `stmt-${i}.sql`)
    writeFileSync(file, `${statements[i]};`, 'utf8')

    execSync(`npx supabase db query --file "${file}" --db-url "${databaseUrl}"`, {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    })
  }

  console.log('[db:seed] seed.sql aplicado correctamente.')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('does not exist')) {
    console.error(
      '\n[db:seed] Faltan tablas en Supabase Cloud. Aplica migraciones primero:\n' +
        '  npx supabase login\n' +
        '  npx supabase link --project-ref <tu-project-ref>\n' +
        '  pnpm db:push\n',
    )
  }
  throw error
} finally {
  rmSync(tmpDir, { recursive: true, force: true })
}
