/**
 * Comprueba tablas/columnas esperadas en Supabase (REST + opcional Postgres).
 * Uso: node scripts/check-supabase-schema.mjs
 *      node scripts/check-supabase-schema.mjs --apply   # aplica migraciones pendientes
 */
import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const apply = process.argv.includes('--apply')

const EXPECTED_TABLES = [
  'customers',
  'web_profiles',
  'customer_addresses',
  'search_events',
  'audit_log',
  'special_prices',
  'group_offers',
  'erp_sync_runs',
  'stock_sync_runs',
  'payment_notifications',
  'notifications',
  'notification_preferences',
  'erp_invoice_sync_state',
  'abandoned_cart_snapshots',
  'storefront_sessions',
  'storefront_cart_activity',
  'stock_watches',
  'newsletter_subscribers',
  'newsletter_rate_limits',
]

const EXPECTED_COLUMNS = {
  customers: [
    'id',
    'commercial_name',
    'email',
    'phone',
    'tax_id',
    'is_company',
    'validated_at',
    'billing_address_line1',
    'billing_city',
    'billing_postal_code',
    'billing_country',
  ],
  web_profiles: ['id', 'customer_id', 'email', 'role', 'display_name', 'is_active', 'permissions'],
  customer_addresses: [
    'id',
    'customer_id',
    'label',
    'address_line1',
    'city',
    'postal_code',
    'country',
    'is_default',
  ],
}

function loadEnvFile(path) {
  const out = {}
  if (!existsSync(path)) return out
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function loadConfig() {
  const cms = loadEnvFile(join(root, 'apps/cms/.env'))
  const storefront = loadEnvFile(join(root, 'apps/storefront/.env'))
  const url =
    storefront.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    storefront.SUPABASE_URL?.trim() ||
    cms.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    cms.SUPABASE_URL?.trim()
  const serviceKey =
    storefront.SUPABASE_SERVICE_ROLE_KEY?.trim() || cms.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const databaseUrl = process.env.DATABASE_URL?.trim() || cms.DATABASE_URL?.trim()

  if (url?.includes('supabase.com/dashboard')) {
    throw new Error(
      'SUPABASE_URL apunta al dashboard, no a la API. Usa https://<ref>.supabase.co en apps/cms/.env y apps/storefront/.env',
    )
  }

  return { url, serviceKey, databaseUrl }
}

async function checkTableViaRest(baseUrl, serviceKey, table) {
  const res = await fetch(`${baseUrl}/rest/v1/${table}?select=*&limit=0`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  })
  if (res.ok) return { ok: true }
  const body = await res.json().catch(() => ({}))
  return { ok: false, message: body.message ?? res.statusText, hint: body.hint }
}

async function checkColumnsViaRest(baseUrl, serviceKey, table, columns) {
  const select = columns.join(',')
  const res = await fetch(`${baseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=0`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  })
  if (res.ok) return { ok: true }
  const body = await res.json().catch(() => ({}))
  return { ok: false, message: body.message ?? res.statusText }
}

function listMigrationFiles() {
  const dir = join(root, 'supabase/migrations')
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => join('supabase/migrations', f))
}

async function main() {
  const { url, serviceKey, databaseUrl } = loadConfig()
  if (!url || !serviceKey) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  console.log(`Proyecto: ${url}`)
  console.log('\n=== Tablas esperadas (REST) ===')

  const missingTables = []
  for (const table of EXPECTED_TABLES) {
    const result = await checkTableViaRest(url, serviceKey, table)
    if (result.ok) {
      console.log(`  OK   ${table}`)
    } else {
      console.log(`  MISS ${table} — ${result.message}`)
      missingTables.push(table)
    }
  }

  console.log('\n=== Columnas clave ===')
  const missingColumns = []
  for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
    const tableExists = !missingTables.includes(table)
    if (!tableExists) {
      console.log(`  SKIP ${table} (tabla ausente)`)
      continue
    }
    const result = await checkColumnsViaRest(url, serviceKey, table, columns)
    if (result.ok) {
      console.log(`  OK   ${table} (${columns.join(', ')})`)
    } else {
      console.log(`  MISS ${table} — ${result.message}`)
      missingColumns.push(table)
    }
  }

  if (missingTables.length === 0 && missingColumns.length === 0) {
    console.log('\nEsquema núcleo OK.')
    return
  }

  console.log(`\nFaltan ${missingTables.length} tabla(s).`)
  const migrations = listMigrationFiles()
  console.log(`Migraciones en repo: ${migrations.length} archivos`)

  if (!apply) {
    console.log('\nPara aplicar migraciones:')
    console.log('  pnpm db:apply-migrations')
    console.log('  # o: node scripts/apply-migrations-pg.mjs')
    console.log('  # verificar de nuevo: pnpm db:check-schema')
    process.exit(1)
  }

  if (!databaseUrl) {
    console.error('DATABASE_URL no encontrada en apps/cms/.env')
    process.exit(1)
  }

  console.log('\n=== Aplicando migraciones (pg) ===')
  if (missingTables.includes('customers')) {
    console.log('Tablas núcleo ausentes — si db:push las marcó sin ejecutar SQL, usa:')
    console.log('  node scripts/apply-migrations-pg.mjs --reset-history')
  }
  execSync('node scripts/apply-migrations-pg.mjs', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
    shell: true,
  })

  console.log('\n=== Re-verificación (REST) ===')
  const missingAfter = []
  for (const table of EXPECTED_TABLES) {
    const result = await checkTableViaRest(url, serviceKey, table)
    if (!result.ok) missingAfter.push(table)
  }
  if (missingAfter.length > 0) {
    console.error(`Siguen faltando: ${missingAfter.join(', ')}`)
    process.exit(1)
  }
  console.log('Esquema núcleo OK tras aplicar migraciones.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
