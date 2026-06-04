import { resolveCatalogImage } from '@jeyjo/catalog-images'

import { absoluteMediaUrlOrNull, cmsBaseUrl } from '@/lib/catalog/absolute-media-url'
import type { PublicProductDoc } from '@/lib/catalog/fetch-public-products-by-skus'
import {
  isPublicCatalogProduct,
  type CmsProductSnapshot,
} from '@/lib/catalog/public-product-filter'

export type ReferenceMatchField = 'sku' | 'oem' | 'ean'

export type ResolvedProductByReference = {
  doc: PublicProductDoc
  matchedField: ReferenceMatchField
  sku: string
}

type CmsLookupField = 'skuErp' | 'oemRef' | 'ean'

async function fetchProductByField(
  field: CmsLookupField,
  value: string,
): Promise<PublicProductDoc | null> {
  const base = cmsBaseUrl()
  const trimmed = value.trim()
  if (!base || !trimmed) return null

  const params = new URLSearchParams({
    [`where[${field}][equals]`]: trimmed,
    limit: '1',
    depth: '1',
    'where[_status][equals]': 'published',
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/products?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })
  if (!res.ok) return null

  const body = (await res.json()) as { docs?: PublicProductDoc[] }
  const doc = body.docs?.[0]
  if (!doc || !isPublicCatalogProduct(doc)) return null

  const catalogRaw = resolveCatalogImage({
    ownImage: doc.ownImage,
    providerImageUrl: doc.providerImageUrl,
  })
  const thumbnailUrl = absoluteMediaUrlOrNull(catalogRaw) ?? doc.thumbnailUrl ?? null

  return { ...doc, thumbnailUrl }
}

function toResolved(
  doc: PublicProductDoc,
  matchedField: ReferenceMatchField,
): ResolvedProductByReference | null {
  const sku = doc.skuErp?.trim()
  if (!sku) return null
  return { doc, matchedField, sku }
}

/**
 * Resolves a published, non-wildcard product by wholesaler SKU, OEM ref, or EAN (RF-013).
 */
export async function resolveProductByReference(
  ref: string,
): Promise<ResolvedProductByReference | null> {
  const trimmed = ref.trim()
  if (!trimmed) return null

  const bySku = await fetchProductByField('skuErp', trimmed)
  if (bySku) return toResolved(bySku, 'sku')

  const byOem = await fetchProductByField('oemRef', trimmed)
  if (byOem) return toResolved(byOem, 'oem')

  const byEan = await fetchProductByField('ean', trimmed)
  if (byEan) return toResolved(byEan, 'ean')

  return null
}

export function isResolvableCatalogDoc(doc: CmsProductSnapshot): boolean {
  return isPublicCatalogProduct(doc)
}
