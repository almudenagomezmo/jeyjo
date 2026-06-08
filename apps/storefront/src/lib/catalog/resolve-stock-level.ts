import {
  DEFAULT_STOCK_LOW_THRESHOLD,
  resolveStockIndicator,
  type StockIndicatorLevel,
} from '@jeyjo/stock-ports'

import type { CmsProductSnapshot } from '@/lib/catalog/public-product-filter'

export type StockSourceDoc = CmsProductSnapshot & {
  erpStock?: number | null
  distrisantiagoStock?: number | null
  arnoiaStock?: number | null
}

const LEVELS: StockIndicatorLevel[] = ['available', 'low', 'limited']

/** Resolves PLP/search stock level from CMS semáforo or numeric sources (RF-005). */
export function resolvePublicStockLevel(
  doc: StockSourceDoc,
  threshold = DEFAULT_STOCK_LOW_THRESHOLD,
): StockIndicatorLevel {
  if (doc.stockIndicator && LEVELS.includes(doc.stockIndicator)) {
    return doc.stockIndicator
  }

  return resolveStockIndicator({
    erpStock: doc.erpStock ?? null,
    distrisantiagoStock: doc.distrisantiagoStock ?? null,
    arnoiaStock: doc.arnoiaStock ?? null,
    threshold,
    staleDistrisantiago: false,
    staleArnoia: false,
  }).level
}
