/**
 * Persiste el catálogo Jeyjo en Supabase Postgres (tablas Payload: products, categories, suppliers).
 *
 * Uso:
 *   pnpm seed:catalog
 *
 * Requisitos:
 *   - DATABASE_URL en apps/cms/.env (Supabase Cloud pooler o local)
 *   - PAYLOAD_SECRET en apps/cms/.env
 */
import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const cmsRoot = path.resolve(scriptDir, '..')

loadEnv({ path: path.join(cmsRoot, '.env') })

/** Prefer direct Postgres for one-off CLI (avoids Supabase session pooler EMAXCONNSESSION). */
function applyDirectDatabaseUrlIfSet(): void {
  const direct = process.env.DATABASE_URL_DIRECT?.trim()
  if (direct) {
    process.env.DATABASE_URL = direct
    console.log('[seed:catalog] Using DATABASE_URL_DIRECT (bypasses session pooler).')
  } else if (/pooler\.supabase\.com/i.test(process.env.DATABASE_URL ?? '')) {
    console.warn(
      '[seed:catalog] DATABASE_URL apunta al session pooler de Supabase (~15 conexiones compartidas).',
    )
    console.warn(
      '[seed:catalog] Si se queda colgado, para el dev server (pnpm dev) o define DATABASE_URL_DIRECT en .env',
    )
    console.warn(
      '[seed:catalog] Usa DATABASE_URL_DIRECT con transaction pooler (:6543) o conexión directa (ver .env.example).',
    )
  }

  // Mínimo viable para init Payload + un create; evita competir con Next.js dev/HMR.
  process.env.PAYLOAD_DB_POOL_MAX = process.env.PAYLOAD_DB_POOL_MAX ?? '2'
}

async function main(): Promise<void> {
  applyDirectDatabaseUrlIfSet()

  if (!process.env.DATABASE_URL?.trim()) {
    console.error('[seed:catalog] DATABASE_URL no está definida en apps/cms/.env')
    process.exit(1)
  }

  if (!process.env.PAYLOAD_SECRET?.trim()) {
    console.error('[seed:catalog] PAYLOAD_SECRET no está definida en apps/cms/.env')
    process.exit(1)
  }

  const { createLocalReq, getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const { seedCatalogDatabase } = await import('../src/endpoints/seed/seed-catalog-database')

  console.log('[seed:catalog] Conectando a Postgres y aplicando schema Payload si hace falta...')

  const payload = await getPayload({ config })
  const req = await createLocalReq({}, payload)

  await seedCatalogDatabase({ payload, req, options: { reset: true } })

  const [categories, suppliers, products] = await Promise.all([
    payload.count({ collection: 'categories', req }),
    payload.count({ collection: 'suppliers', req }),
    payload.count({ collection: 'products', req }),
  ])

  console.log(
    `[seed:catalog] Listo — ${categories.totalDocs} categorías, ${suppliers.totalDocs} proveedores, ${products.totalDocs} productos en Supabase.`,
  )

  process.exit(0)
}

main().catch((err: unknown) => {
  console.error('[seed:catalog] Error:', err)
  process.exit(1)
})
