import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
loadEnv({ path: path.join(cmsRoot, '.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('@payload-config')
const { sql } = await import('@payloadcms/db-postgres')

const payload = await getPayload({ config })
const db = payload.db.drizzle

const ids = await db.execute(sql`SELECT id, sku_erp, title FROM products WHERE id IN (0, 207, 211, 160, 161)`)
console.log('products:', ids.rows)
