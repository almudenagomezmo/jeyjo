/**
 * Seed blog categories and posts in Payload (idempotent by slug).
 *
 * Usage: pnpm seed:blog-posts
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
    console.log('[seed:blog-posts] Using DATABASE_URL_DIRECT.')
  }
  process.env.PAYLOAD_DB_POOL_MAX = process.env.PAYLOAD_DB_POOL_MAX ?? '2'
}

async function main(): Promise<void> {
  applyDirectDatabaseUrlIfSet()

  if (!process.env.DATABASE_URL?.trim()) {
    console.error('[seed:blog-posts] DATABASE_URL missing in apps/cms/.env')
    process.exit(1)
  }

  if (!process.env.PAYLOAD_SECRET?.trim()) {
    console.error('[seed:blog-posts] PAYLOAD_SECRET missing in apps/cms/.env')
    process.exit(1)
  }

  const { createLocalReq, getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const { seedBlogPosts } = await import('../src/endpoints/seed/blog-posts')

  const payload = await getPayload({ config })
  const req = await createLocalReq({}, payload)

  await seedBlogPosts({ payload, req })

  const count = await payload.count({ collection: 'blog-posts', req })
  console.log(`[seed:blog-posts] Done — ${count.totalDocs} blog posts.`)
  process.exit(0)
}

main().catch((err: unknown) => {
  console.error('[seed:blog-posts] Error:', err)
  process.exit(1)
})
