import { resolveCatalogImage } from '@jeyjo/catalog-images'

import { absoluteMediaUrlOrNull, cmsBaseUrl } from '@/lib/catalog/absolute-media-url'
import type { PublicProductDoc } from '@/lib/catalog/fetch-public-products-by-skus'
import { isPublicCatalogProduct } from '@/lib/catalog/public-product-filter'
import { isWildcardPurchaseSku } from '@/lib/intranet/purchase-history/wildcard'

import type { QuickOrderMatchField } from './types'

export type ResolvedProductByReference = {
  doc: PublicProductDoc
  matchedBy: QuickOrderMatchField
  sku: string
  slug: string
}

type ReferenceField = 'skuErp' | 'oemRef' | 'ean'

async function fetchDocsByField(
  field: ReferenceField,
  value: string,
): Promise<PublicProductDoc[]> {
  const base = cmsBaseUrl()
  if (!base || !value) return []

  const params = new URLSearchParams({
    [`where[${field}][equals]`]: value,
    limit: '5',
    depth: '1',
    'where[_status][equals]': 'published',
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/products?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })
  if (!res.ok) return []

  const body = (await res.json()) as { docs?: PublicProductDoc[] }
  return body.docs ?? []
}

function pickBestMatch(docs: PublicProductDoc[]): PublicProductDoc | null {
  const publicDocs = docs.filter(isPublicCatalogProduct)
  if (publicDocs.length === 0) return null
  return publicDocs[0]!
}

function mapDoc(
  doc: PublicProductDoc,
  matchedBy: QuickOrderMatchField,
): ResolvedProductByReference | null {
  const sku = doc.skuErp?.trim()
  const slug = doc.slug?.trim()
  if (!sku || !slug) return null

  const catalogRaw = resolveCatalogImage({
    ownImage: doc.ownImage,
    providerImageUrl: doc.providerImageUrl,
  })
  const imageUrl = absoluteMediaUrlOrNull(catalogRaw) ?? doc.thumbnailUrl ?? null

  return {
    doc: { ...doc, thumbnailUrl: imageUrl },
    matchedBy,
    sku,
    slug,
  }
}

/**
 * Resolves a published, non-wildcard product by skuErp, oemRef, or ean (RF-019).
 */
export async function resolveProductByReference(
  reference: string,
): Promise<ResolvedProductByReference | null> {
  const trimmed = reference.trim()
  if (!trimmed) return null

  const skuDoc = pickBestMatch(await fetchDocsByField('skuErp', trimmed))
  if (skuDoc) {
    const mapped = mapDoc(skuDoc, 'sku')
    if (mapped && !isWildcardPurchaseSku(mapped.sku)) return mapped
    if (mapped && isWildcardPurchaseSku(mapped.sku)) return null
  }

  const oemDoc = pickBestMatch(await fetchDocsByField('oemRef', trimmed))
  if (oemDoc) {
    const mapped = mapDoc(oemDoc, 'oem')
    if (mapped && !isWildcardPurchaseSku(mapped.sku)) return mapped
  }

  const eanDoc = pickBestMatch(await fetchDocsByField('ean', trimmed))
  if (eanDoc) {
    const mapped = mapDoc(eanDoc, 'ean')
    if (mapped && !isWildcardPurchaseSku(mapped.sku)) return mapped
  }

  return null
}

/** Returns wildcard match even when not orderable (for preview status). */
export async function resolveReferenceIncludingWildcard(
  reference: string,
): Promise<{ resolved: ResolvedProductByReference | null; isWildcard: boolean }> {
  const trimmed = reference.trim()
  if (!trimmed) return { resolved: null, isWildcard: false }

  for (const [field, matchedBy] of [
    ['skuErp', 'sku'],
    ['oemRef', 'oem'],
    ['ean', 'ean'],
  ] as const) {
    const doc = pickBestMatch(await fetchDocsByField(field, trimmed))
    if (!doc) continue
    const mapped = mapDoc(doc, matchedBy)
    if (!mapped) continue
    if (isWildcardPurchaseSku(mapped.sku) || doc.isWildcard === true) {
      return { resolved: mapped, isWildcard: true }
    }
    return { resolved: mapped, isWildcard: false }
  }

  return { resolved: null, isWildcard: false }
}
