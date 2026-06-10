import type { PriceQuote } from '@jeyjo/pricing'

import { listPublicProducts } from '@/lib/catalog/fetch-product-list'
import { searchPublicProducts } from '@/lib/catalog/search-public-products'
import { filterProducts } from '@/lib/plp/apply-filters'
import { buildFacetAggregates } from '@/lib/plp/facet-aggregates'
import { parsePlpSearchParams } from '@/lib/plp/plp-search-params'
import type { PlpPagePayload, PlpProductRow, PlpSortKey } from '@/lib/plp/types'
import { PLP_PAGE_SIZE } from '@/lib/plp/types'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import { getSessionPricingCustomerId } from '@/lib/pricing/session-customer-id'
import { stockIndicatorsFromRows } from '@/lib/stock/get-stock-indicators-batch'

function sortRows(
  rows: PlpProductRow[],
  sort: PlpSortKey,
  quotesBySku: Record<string, PriceQuote>,
): PlpProductRow[] {
  const list = [...rows]
  switch (sort) {
    case 'price-asc':
      list.sort(
        (a, b) =>
          (quotesBySku[a.sku]?.netUnit ?? 0) - (quotesBySku[b.sku]?.netUnit ?? 0),
      )
      break
    case 'price-desc':
      list.sort(
        (a, b) =>
          (quotesBySku[b.sku]?.netUnit ?? 0) - (quotesBySku[a.sku]?.netUnit ?? 0),
      )
      break
    case 'rating':
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      break
    case 'name':
      list.sort((a, b) => a.title.localeCompare(b.title, 'es'))
      break
    default:
      break
  }
  return list
}

export async function loadPlpPageFromCategory(
  categorySlugs: string[],
  searchParams: Record<string, string | string[] | undefined>,
): Promise<PlpPagePayload> {
  const { filters, sort, page } = parsePlpSearchParams(searchParams)
  const [candidates, pricingCustomerId] = await Promise.all([
    listPublicProducts({ categorySlugs }),
    getSessionPricingCustomerId(),
  ])
  const quotesBySku = await resolvePriceQuotesBatch(
    candidates.map((r) => r.sku),
    pricingCustomerId,
  )
  const facets = buildFacetAggregates(candidates, filters, quotesBySku)
  const filtered = sortRows(filterProducts(candidates, filters, quotesBySku), sort, quotesBySku)
  const totalFiltered = filtered.length
  const start = (page - 1) * PLP_PAGE_SIZE
  const pageRows = filtered.slice(start, start + PLP_PAGE_SIZE)
  const stockBySku = stockIndicatorsFromRows(pageRows)

  return {
    rows: pageRows,
    facets,
    activeFilters: filters,
    sort,
    page,
    pageSize: PLP_PAGE_SIZE,
    totalFiltered,
    quotesBySku,
    stockBySku,
  }
}

export async function loadPlpPageFromSearch(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<PlpPagePayload | null> {
  const { filters, sort, page, q } = parsePlpSearchParams(searchParams)
  if (!q) return null

  const [candidates, pricingCustomerId] = await Promise.all([
    searchPublicProducts(q),
    getSessionPricingCustomerId(),
  ])
  const quotesBySku = await resolvePriceQuotesBatch(
    candidates.map((r) => r.sku),
    pricingCustomerId,
  )
  const facets = buildFacetAggregates(candidates, filters, quotesBySku)
  const filtered = sortRows(filterProducts(candidates, filters, quotesBySku), sort, quotesBySku)
  const totalFiltered = filtered.length
  const start = (page - 1) * PLP_PAGE_SIZE
  const pageRows = filtered.slice(start, start + PLP_PAGE_SIZE)
  const stockBySku = stockIndicatorsFromRows(pageRows)

  return {
    rows: pageRows,
    facets,
    activeFilters: filters,
    sort,
    page,
    pageSize: PLP_PAGE_SIZE,
    totalFiltered,
    quotesBySku,
    stockBySku,
  }
}
