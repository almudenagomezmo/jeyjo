/**
 * Seed legal/FAQ site pages in Payload (idempotent by slug).
 *
 * Usage: pnpm seed:site-pages
 */
import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const cmsRoot = path.resolve(scriptDir, '..')

loadEnv({ path: path.join(cmsRoot, '.env') })

function applyDirectDatabaseUrlIfSet(): void {
  const direct = process.env.DATABASE_URL_DIRECT?.trim()
  if (direct) {
    process.env.DATABASE_URL = direct
    console.log('[seed:site-pages] Using DATABASE_URL_DIRECT.')
  }
  process.env.PAYLOAD_DB_POOL_MAX = process.env.PAYLOAD_DB_POOL_MAX ?? '2'
}

async function main(): Promise<void> {
  applyDirectDatabaseUrlIfSet()

  if (!process.env.DATABASE_URL?.trim()) {
    console.error('[seed:site-pages] DATABASE_URL missing in apps/cms/.env')
    process.exit(1)
  }

  if (!process.env.PAYLOAD_SECRET?.trim()) {
    console.error('[seed:site-pages] PAYLOAD_SECRET missing in apps/cms/.env')
    process.exit(1)
  }

  const { createLocalReq, getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const { seedSitePagesDatabase } = await import('../src/endpoints/seed/seed-site-pages-database')

  const payload = await getPayload({ config })
  const req = await createLocalReq({}, payload)

  await seedSitePagesDatabase({ payload, req })

  const count = await payload.count({ collection: 'site-pages', req })
  console.log(`[seed:site-pages] Done — ${count.totalDocs} site pages.`)
  process.exit(0)
}

main().catch((err: unknown) => {
  console.error('[seed:site-pages] Error:', err)
  process.exit(1)
})
