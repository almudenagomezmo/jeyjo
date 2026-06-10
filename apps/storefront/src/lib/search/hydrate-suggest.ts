import type { PriceQuote } from '@jeyjo/pricing'

import {
  fetchPublicProductsBySkus,
  type PublicProductDoc,
} from '@/lib/catalog/fetch-public-products-by-skus'
import { resolvePublicStockLevel } from '@/lib/catalog/resolve-stock-level'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import { getSessionPricingCustomerId } from '@/lib/pricing/session-customer-id'

import type { QdrantProductPayload, SuggestCategory, SuggestProduct } from './types'
import type { VectorSearchHit } from './vector-search'

function canAddSuggestProduct(doc: PublicProductDoc): boolean {
  const level = resolvePublicStockLevel(doc)
  return (
    level === 'available' ||
    level === 'low' ||
    doc.allowOrderWithoutStock === true
  )
}

function productHref(slug: string, sku: string): string {
  const s = slug.trim() || sku.toLowerCase()
  return `/p/${s}`
}

function mapDocToSuggest(
  doc: PublicProductDoc,
  payload: QdrantProductPayload,
  priceQuote?: PriceQuote,
): SuggestProduct {
  const sku = doc.skuErp?.trim() ?? ''
  const slug = doc.slug?.trim() || sku.toLowerCase()

  return {
    sku,
    title: doc.title?.trim() || payload.title?.trim() || sku,
    slug,
    href: productHref(slug, sku),
    imageUrl: doc.thumbnailUrl ?? null,
    wholesaleRef: doc.mainWholesaleRef ?? payload.mainWholesaleRef ?? null,
    oemRef: doc.oemRef ?? payload.oemRef ?? null,
    ean: doc.ean ?? payload.ean ?? null,
    priceQuote,
    brand: doc.brand ?? undefined,
    packUnit: doc.packUnit != null && doc.packUnit > 0 ? doc.packUnit : 1,
    canAddToCart: canAddSuggestProduct(doc),
  }
}

export async function hydrateSuggestProducts(
  hits: VectorSearchHit[],
): Promise<SuggestProduct[]> {
  if (hits.length === 0) return []

  const skus = hits.map((h) => h.sku)
  const docs = await fetchPublicProductsBySkus(skus)
  const docBySku = new Map(docs.map((d) => [d.skuErp?.trim() ?? '', d]))

  const orderedSkus: string[] = []
  for (const hit of hits) {
    if (docBySku.has(hit.sku)) orderedSkus.push(hit.sku)
  }

  const pricingCustomerId = await getSessionPricingCustomerId()
  const quotesBySku = await resolvePriceQuotesBatch(orderedSkus, pricingCustomerId)

  const products: SuggestProduct[] = []
  for (const hit of hits) {
    const doc = docBySku.get(hit.sku)
    if (!doc) continue
    const quote = quotesBySku[hit.sku]
    products.push(mapDocToSuggest(doc, hit.payload, quote))
  }
  return products
}

export function mapCategoryHits(
  categories: Array<{ slug: string; label: string }>,
): SuggestCategory[] {
  return categories.map((c) => ({
    label: c.label,
    slug: c.slug,
    href: `/c/${c.slug}`,
  }))
}
