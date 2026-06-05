/**
 * Genera supabase/apply-all-migrations-sql-editor.sql para el SQL Editor de Supabase.
 * Uso: node scripts/generate-sql-editor-bundle.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'supabase/migrations')
const out = join(root, 'supabase/apply-all-migrations-sql-editor.sql')

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

const header = `-- =============================================================================
-- Jeyjo: esquema núcleo completo para Supabase SQL Editor
-- Proyecto: tqgrsofvlkyumagrqbqa
-- Generado: ${new Date().toISOString().slice(0, 10)}
--
-- INSTRUCCIONES:
-- 1. Supabase Dashboard → SQL Editor → New query
-- 2. Pega y ejecuta este archivo completo (Run)
--    Si hay timeout, ejecuta sección por sección (busca "-- MIGRATION:")
-- 3. Comprueba:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public' AND table_name IN ('customers','web_profiles');
--
-- Migraciones incluidas (${files.length}):
${files.map((f) => `--   - ${f}`).join('\n')}
-- =============================================================================

`

let body = header

for (const file of files) {
  body += '\n\n-- -----------------------------------------------------------------------------\n'
  body += `-- MIGRATION: ${file}\n`
  body += '-- -----------------------------------------------------------------------------\n\n'
  body += readFileSync(join(dir, file), 'utf8').trim()
  body += '\n'
}

body += `
-- =============================================================================
-- FIN — Registro en historial de migraciones (opcional, para alinear con CLI)
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version text PRIMARY KEY,
  statements text[],
  name text
);

INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
VALUES
${files
  .map((f) => {
    const version = f.replace(/\.sql$/, '').split('_')[0]
    return `  ('${version}', '{}'::text[], '${f.replace(/'/g, "''")}')`
  })
  .join(',\n')}
ON CONFLICT (version) DO NOTHING;
`

writeFileSync(out, body, 'utf8')
console.log(`OK: ${out} (${files.length} migraciones, ${Buffer.byteLength(body)} bytes)`)
