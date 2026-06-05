import 'server-only'

import {
  fetchPublicProductsBySkus,
} from '@/lib/catalog/fetch-public-products-by-skus'
import {
  listCachedPublicProductRows,
  mapDocToRow,
  type CmsProductListDoc,
} from '@/lib/catalog/fetch-product-list'
import type { PlpProductRow } from '@/lib/plp/types'
import { isPredictiveSearchEnabled } from '@/lib/search/search-flags'

function matchesSearchQuery(row: PlpProductRow, q: string): boolean {
  const needle = q.toLowerCase()
  return (
    row.title.toLowerCase().includes(needle) ||
    row.sku.toLowerCase().includes(needle) ||
    row.brand.toLowerCase().includes(needle)
  )
}

async function searchPublicProductsText(q: string): Promise<PlpProductRow[]> {
  const trimmed = q.trim()
  if (!trimmed) return []

  const cmsRows = await listCachedPublicProductRows()
  return cmsRows.filter((r) => matchesSearchQuery(r, trimmed))
}

async function searchPublicProductsVector(q: string): Promise<PlpProductRow[]> {
  const trimmed = q.trim()
  if (!trimmed) return []

  try {
    const { vectorSearchProductSkuList } = await import('@/lib/search/vector-search')
    const skus = await vectorSearchProductSkuList(trimmed, { limit: 200 })
    if (skus.length === 0) return []

    const docs = await fetchPublicProductsBySkus(skus)
    const rows: PlpProductRow[] = []
    for (const doc of docs) {
      const row = mapDocToRow(doc as CmsProductListDoc)
      if (row) rows.push(row)
    }
    return rows
  } catch {
    return []
  }
}

export async function searchPublicProducts(q: string): Promise<PlpProductRow[]> {
  if (await isPredictiveSearchEnabled()) {
    return searchPublicProductsVector(q)
  }
  return searchPublicProductsText(q)
}
