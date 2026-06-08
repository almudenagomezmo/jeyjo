import type { StockIndicatorLevel } from '@jeyjo/stock-ports'

export type CmsProductSnapshot = {
  skuErp?: string | null
  p1Price?: number | null
  p2Price?: number | null
  vatRate?: number | null
  isWildcard?: boolean | null
  _status?: string | null
  stockIndicator?: StockIndicatorLevel | null
  erpStock?: number | null
  distrisantiagoStock?: number | null
  arnoiaStock?: number | null
  allowOrderWithoutStock?: boolean | null
  syncDistrisantiagoAt?: string | null
  syncArnoiaAt?: string | null
}

/** RF-006: exclude wildcard and non-published products from public catalog reads. */
export function isPublicCatalogProduct(doc: CmsProductSnapshot): boolean {
  if (doc.isWildcard === true) return false
  if (doc._status !== 'published') return false
  return true
}
