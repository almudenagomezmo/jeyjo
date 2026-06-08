/**
 * Recalcula stockIndicator para todos los productos según erpStock (RF-005).
 *
 * Uso: pnpm --filter @jeyjo/cms exec tsx scripts/recalculate-stock-indicators.ts
 */
import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
loadEnv({ path: path.join(cmsRoot, '.env') })

const { createLocalReq, getPayload } = await import('payload')
const { default: config } = await import('@payload-config')
const { recalculateStockIndicatorsForAllProducts } = await import(
  '../src/stock/recalculateIndicators'
)

const payload = await getPayload({ config })
const req = await createLocalReq({}, payload)
const result = await recalculateStockIndicatorsForAllProducts({ payload, req })

console.log(
  `[recalculate-stock] ${result.productsUpdated} productos actualizados, ${result.errors.length} errores`,
)
if (result.errors.length) console.error(result.errors)
process.exit(0)
