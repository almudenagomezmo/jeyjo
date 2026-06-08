import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
loadEnv({ path: path.join(cmsRoot, '.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('@payload-config')

const payload = await getPayload({ config })

for (const draft of [true, false] as const) {
  try {
    const result = await payload.update({
      collection: 'products',
      id: 211,
      data: { relatedProducts: [207] },
      overrideAccess: true,
      draft,
    })
    console.log(`OK draft=${draft}`, result.id, result.relatedProducts)
  } catch (error) {
    const err = error as { message?: string; data?: unknown }
    console.error(`ERR draft=${draft}:`, err.message)
    console.error(JSON.stringify(err.data, null, 2))
  }
}
