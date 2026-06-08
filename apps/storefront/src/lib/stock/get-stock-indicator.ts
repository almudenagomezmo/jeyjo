import { unstable_cache } from 'next/cache'

import {
  STOCK_INDICATOR_LABELS,
  resolveStockIndicator,
} from '@jeyjo/stock-ports'

import { fetchProductBySkuFromCms } from '@/lib/catalog/fetch-product-by-sku'
import {
  isPublicCatalogProduct,
  type CmsProductSnapshot,
} from '@/lib/catalog/public-product-filter'
import {
  getCatalogStalenessMs,
  getStockLowThreshold,
  isWebNativeModeEnabled,
} from '@/lib/system-config/fetch'

import type { PublicStockIndicator } from '@/lib/stock/types'

type StockProductSnapshot = CmsProductSnapshot & {
  erpStock?: number | null
  distrisantiagoStock?: number | null
  arnoiaStock?: number | null
}

function isSourceStale(syncAt: string | null | undefined, staleMs: number): boolean {
  if (!syncAt) return true
  const ts = Date.parse(syncAt)
  if (Number.isNaN(ts)) return true
  return Date.now() - ts > staleMs
}

function toPublicIndicator(
  doc: StockProductSnapshot,
  threshold: number,
  staleMs: number,
): PublicStockIndicator {
  const staleDistrisantiago = isSourceStale(doc.syncDistrisantiagoAt, staleMs)
  const staleArnoia = isSourceStale(doc.syncArnoiaAt, staleMs)

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
    threshold,
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
  const [doc, threshold, staleMs, webNative] = await Promise.all([
    fetchProductBySkuFromCms(sku) as Promise<StockProductSnapshot | null>,
    getStockLowThreshold(),
    getCatalogStalenessMs(),
    isWebNativeModeEnabled(),
  ])
  if (!doc || !isPublicCatalogProduct(doc)) return null
  if (webNative) {
    const indicator = toPublicIndicator(doc, threshold, Number.MAX_SAFE_INTEGER)
    return { ...indicator, isStale: false }
  }
  return toPublicIndicator(doc, threshold, staleMs)
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
