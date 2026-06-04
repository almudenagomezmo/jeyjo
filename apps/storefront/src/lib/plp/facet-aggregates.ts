import type { PriceQuote } from '@jeyjo/pricing'

import { getQuoteNetForFilter, productMatchesFilters } from '@/lib/plp/apply-filters'
import type { PlpActiveFilters, PlpFacetAggregates, PlpProductRow } from '@/lib/plp/types'

function countByValue(
  rows: PlpProductRow[],
  filters: PlpActiveFilters,
  quotesBySku: Record<string, PriceQuote>,
  omit: 'brands' | 'colors' | 'materials',
  getValue: (row: PlpProductRow) => string | null,
): { value: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (!productMatchesFilters(row, filters, quotesBySku, omit)) continue
    const value = getValue(row)
    if (!value) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .filter((o) => o.count > 0)
    .sort((a, b) => a.value.localeCompare(b.value, 'es'))
}

export function buildFacetAggregates(
  rows: PlpProductRow[],
  filters: PlpActiveFilters,
  quotesBySku: Record<string, PriceQuote>,
): PlpFacetAggregates {
  const matchingForPrice = rows.filter((row) =>
    productMatchesFilters(row, filters, quotesBySku, 'price'),
  )
  let priceMax = 0
  for (const row of matchingForPrice) {
    const net = getQuoteNetForFilter(quotesBySku[row.sku], row)
    if (net > priceMax) priceMax = net
  }

  return {
    brands: countByValue(rows, filters, quotesBySku, 'brands', (r) => r.brand),
    colors: countByValue(rows, filters, quotesBySku, 'colors', (r) => r.facetColor),
    materials: countByValue(rows, filters, quotesBySku, 'materials', (r) => r.facetMaterial),
    priceMax: Math.ceil(priceMax) || 10,
  }
}
