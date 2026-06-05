/**
 * Aplica archivos SQL de migración statement a statement (Supabase Cloud pooler).
 * Uso: node scripts/apply-migration-files.mjs <file1.sql> <file2.sql> ...
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  console.error('DATABASE_URL no encontrada')
  process.exit(1)
}

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('Uso: node scripts/apply-migration-files.mjs <migration.sql> ...')
  process.exit(1)
}

const tmpDir = mkdtempSync(join(tmpdir(), 'jeyjo-mig-'))

try {
  for (const rel of files) {
    const path = join(root, rel)
    const statements = splitSqlStatements(readFileSync(path, 'utf8'))
    console.log(`[migrate] ${rel} (${statements.length} sentencias)`)

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
  }
  console.log('[migrate] Completado.')
} finally {
  rmSync(tmpDir, { recursive: true, force: true })
}
