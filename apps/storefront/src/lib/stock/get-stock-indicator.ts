import { unstable_cache } from 'next/cache'

import {
  STOCK_INDICATOR_LABELS,
  parseStockLowThreshold,
  resolveStockIndicator,
} from '@jeyjo/stock-ports'

import { fetchProductBySkuFromCms } from '@/lib/catalog/fetch-product-by-sku'
import {
  isPublicCatalogProduct,
  type CmsProductSnapshot,
} from '@/lib/catalog/public-product-filter'

import type { PublicStockIndicator } from '@/lib/stock/types'

type StockProductSnapshot = CmsProductSnapshot & {
  erpStock?: number | null
  distrisantiagoStock?: number | null
  arnoiaStock?: number | null
}

const STALE_MS = 24 * 60 * 60 * 1000

function isSourceStale(syncAt: string | null | undefined): boolean {
  if (!syncAt) return true
  const ts = Date.parse(syncAt)
  if (Number.isNaN(ts)) return true
  return Date.now() - ts > STALE_MS
}

function toPublicIndicator(doc: StockProductSnapshot): PublicStockIndicator {
  const staleDistrisantiago = isSourceStale(doc.syncDistrisantiagoAt)
  const staleArnoia = isSourceStale(doc.syncArnoiaAt)

  if (doc.stockIndicator && doc.stockIndicator in STOCK_INDICATOR_LABELS) {
    return {
      level: doc.stockIndicator,
      label: STOCK_INDICATOR_LABELS[doc.stockIndicator],
      isStale: staleDistrisantiago || staleArnoia,
      allowOrderWithoutStock: doc.allowOrderWithoutStock === true,
    }
  }

  const resolved = resolveStockIndicator({
    erpStock: doc.erpStock ?? null,
    distrisantiagoStock: doc.distrisantiagoStock ?? null,
    arnoiaStock: doc.arnoiaStock ?? null,
    threshold: parseStockLowThreshold(process.env.STOCK_LOW_THRESHOLD),
    staleDistrisantiago,
    staleArnoia,
  })

  return {
    level: resolved.level,
    label: resolved.label,
    isStale: resolved.isStale,
    allowOrderWithoutStock: doc.allowOrderWithoutStock === true,
  }
}

async function loadPublicStockIndicator(sku: string): Promise<PublicStockIndicator | null> {
  const doc = (await fetchProductBySkuFromCms(sku)) as StockProductSnapshot | null
  if (!doc || !isPublicCatalogProduct(doc)) return null
  return toPublicIndicator(doc)
}

const cachedLoad = unstable_cache(
  async (sku: string) => loadPublicStockIndicator(sku),
  ['stock-indicator-by-sku'],
  { revalidate: 60 },
)

export async function getStockIndicator(sku: string): Promise<PublicStockIndicator | null> {
  const trimmed = sku.trim()
  if (!trimmed) return null
  return cachedLoad(trimmed)
}
