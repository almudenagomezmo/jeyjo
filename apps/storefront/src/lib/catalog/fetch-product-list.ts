import { unstable_cache } from 'next/cache'

import {
  isPublicCatalogProduct,
  type CmsProductSnapshot,
} from '@/lib/catalog/public-product-filter'
import { PLP_AGGREGATION_LIMIT } from '@/lib/plp/types'
import type { PlpProductRow } from '@/lib/plp/types'
import type { StockIndicatorLevel } from '@jeyjo/stock-ports'

import { demoRowsForCategory, demoRowsForSearch, isPlpDemoFallback } from '@/lib/plp/demo-fallback'

export type CmsProductListDoc = CmsProductSnapshot & {
  title?: string | null
  slug?: string | null
  packUnit?: number | null
  facetColor?: string | null
  facetMaterial?: string | null
  ecoLabel?: boolean | null
  oemRef?: string | null
  ean?: string | null
  mainWholesaleRef?: string | null
  supplier?: { name?: string | null } | string | number | null
  categories?: Array<{ slug?: string | null } | string | number> | null
}

function cmsBaseUrl(): string | null {
  return (
    process.env.CMS_URL ??
    process.env.CMS_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

function supplierName(supplier: CmsProductListDoc['supplier']): string {
  if (supplier && typeof supplier === 'object' && 'name' in supplier && supplier.name) {
    return String(supplier.name)
  }
  return 'Sin marca'
}

function categorySlugs(categories: CmsProductListDoc['categories']): string[] {
  if (!categories?.length) return []
  return categories
    .map((c) => {
      if (c && typeof c === 'object' && 'slug' in c && c.slug) return String(c.slug)
      return null
    })
    .filter((s): s is string => Boolean(s))
}

export function mapDocToRow(doc: CmsProductListDoc): PlpProductRow | null {
  const sku = doc.skuErp?.trim()
  if (!sku) return null

  const level = (doc.stockIndicator ?? 'limited') as StockIndicatorLevel

  return {
    sku,
    slug: doc.slug?.trim() || sku.toLowerCase(),
    title: doc.title?.trim() || sku,
    brand: supplierName(doc.supplier),
    facetColor: doc.facetColor?.trim() || null,
    facetMaterial: doc.facetMaterial?.trim() || null,
    ecoLabel: doc.ecoLabel === true,
    categorySlugs: categorySlugs(doc.categories),
    packUnit: doc.packUnit != null && doc.packUnit > 0 ? doc.packUnit : 1,
    vatRate: doc.vatRate ?? 21,
    stockIndicator: level,
    allowOrderWithoutStock: doc.allowOrderWithoutStock === true,
    rating: 4.5,
    reviews: 0,
    hasOffer: false,
  }
}

async function fetchPublishedProductsRaw(): Promise<CmsProductListDoc[]> {
  const base = cmsBaseUrl()
  if (!base) return []

  const params = new URLSearchParams({
    limit: String(PLP_AGGREGATION_LIMIT),
    depth: '1',
    'where[_status][equals]': 'published',
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/products?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 120 },
  })

  if (!res.ok) return []

  const body = (await res.json()) as { docs?: CmsProductListDoc[] }
  return body.docs ?? []
}

const cachedFetchAll = unstable_cache(
  async () => fetchPublishedProductsRaw(),
  ['cms-products-plp-list'],
  { revalidate: 120 },
)

async function allPublicRows(): Promise<PlpProductRow[]> {
  const docs = await cachedFetchAll()
  const rows: PlpProductRow[] = []
  for (const doc of docs) {
    if (!isPublicCatalogProduct(doc)) continue
    const row = mapDocToRow(doc)
    if (row) rows.push(row)
  }
  return rows
}

function matchesCategorySlugs(row: PlpProductRow, slugs: string[]): boolean {
  if (slugs.length === 0) return true
  return slugs.some((s) => row.categorySlugs.includes(s))
}

function matchesSearchQuery(row: PlpProductRow, q: string): boolean {
  const needle = q.toLowerCase()
  return (
    row.title.toLowerCase().includes(needle) ||
    row.sku.toLowerCase().includes(needle) ||
    row.brand.toLowerCase().includes(needle)
  )
}

export async function listPublicProducts(options: {
  categorySlugs?: string[]
}): Promise<PlpProductRow[]> {
  const slugs = options.categorySlugs ?? []
  const cmsRows = await allPublicRows()
  const filtered = cmsRows.filter((r) => matchesCategorySlugs(r, slugs))

  if (filtered.length > 0 || !isPlpDemoFallback()) return filtered

  return demoRowsForCategory(slugs)
}

export async function searchPublicProducts(q: string): Promise<PlpProductRow[]> {
  const trimmed = q.trim()
  if (!trimmed) return []

  const cmsRows = await allPublicRows()
  const filtered = cmsRows.filter((r) => matchesSearchQuery(r, trimmed))

  if (filtered.length > 0 || !isPlpDemoFallback()) return filtered

  return demoRowsForSearch(trimmed)
}
