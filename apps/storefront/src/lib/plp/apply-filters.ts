import type { PriceQuote } from '@jeyjo/pricing'

import type { PlpActiveFilters, PlpProductRow } from '@/lib/plp/types'

export type FilterOmitDimension = 'brands' | 'colors' | 'materials' | 'price' | 'inStockToday' | 'eco'

export function getQuoteNetForFilter(quote: PriceQuote | undefined, row: PlpProductRow): number {
  if (quote) return quote.netUnit
  return row.vatRate >= 0 ? 0 : 0
}

export function productMatchesFilters(
  row: PlpProductRow,
  filters: PlpActiveFilters,
  quotesBySku: Record<string, PriceQuote>,
  omit?: FilterOmitDimension,
): boolean {
  if (omit !== 'brands' && filters.brands.length > 0 && !filters.brands.includes(row.brand)) {
    return false
  }
  if (
    omit !== 'colors' &&
    filters.colors.length > 0 &&
    (!row.facetColor || !filters.colors.includes(row.facetColor))
  ) {
    return false
  }
  if (
    omit !== 'materials' &&
    filters.materials.length > 0 &&
    (!row.facetMaterial || !filters.materials.includes(row.facetMaterial))
  ) {
    return false
  }
  if (omit !== 'eco' && filters.eco && !row.ecoLabel) return false
  if (omit !== 'inStockToday' && filters.inStockToday && row.stockIndicator !== 'available') {
    return false
  }
  if (omit !== 'price' && filters.priceMax != null) {
    const net = getQuoteNetForFilter(quotesBySku[row.sku], row)
    if (net > filters.priceMax) return false
  }
  return true
}

export function filterProducts(
  rows: PlpProductRow[],
  filters: PlpActiveFilters,
  quotesBySku: Record<string, PriceQuote>,
): PlpProductRow[] {
  return rows.filter((row) => productMatchesFilters(row, filters, quotesBySku))
}
