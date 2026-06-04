import { resolveCatalogImage } from '@jeyjo/catalog-images'
import { unstable_cache } from 'next/cache'

import { absoluteMediaUrlOrNull } from '@/lib/catalog/absolute-media-url'
import {
  isPublicCatalogProduct,
  type CmsProductSnapshot,
} from '@/lib/catalog/public-product-filter'

export type PublicProductDoc = CmsProductSnapshot & {
  title?: string | null
  slug?: string | null
  providerImageUrl?: string | null
  ownImage?: { url?: string | null } | string | number | null
  mainWholesaleRef?: string | null
  oemRef?: string | null
  ean?: string | null
  thumbnailUrl?: string | null
  brand?: string | null
  packUnit?: number | null
  facetColor?: string | null
  facetMaterial?: string | null
  ecoLabel?: boolean | null
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

function supplierName(supplier: PublicProductDoc['supplier']): string | null {
  if (supplier && typeof supplier === 'object' && 'name' in supplier && supplier.name) {
    return String(supplier.name)
  }
  return null
}

async function fetchProductsBySkusRaw(skus: string[]): Promise<PublicProductDoc[]> {
  const base = cmsBaseUrl()
  if (!base || skus.length === 0) return []

  const unique = [...new Set(skus.map((s) => s.trim()).filter(Boolean))]
  const params = new URLSearchParams({
    limit: String(unique.length),
    depth: '1',
  })
  unique.forEach((sku, index) => {
    params.append(`where[skuErp][in][${index}]`, sku)
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/products?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })

  if (!res.ok) return []

  const body = (await res.json()) as { docs?: PublicProductDoc[] }
  return body.docs ?? []
}

/**
 * Resolves published, non-wildcard products by SKU, preserving caller order.
 */
export async function fetchPublicProductsBySkus(skus: string[]): Promise<PublicProductDoc[]> {
  const unique = [...new Set(skus.map((s) => s.trim()).filter(Boolean))]
  if (unique.length === 0) return []

  const docs = await fetchProductsBySkusRaw(unique)
  const bySku = new Map<string, PublicProductDoc>()

  for (const doc of docs) {
    if (!isPublicCatalogProduct(doc)) continue
    const sku = doc.skuErp?.trim()
    if (!sku) continue
    const catalogRaw = resolveCatalogImage({
      ownImage: doc.ownImage,
      providerImageUrl: doc.providerImageUrl,
    })
    bySku.set(sku, {
      ...doc,
      brand: supplierName(doc.supplier),
      thumbnailUrl: absoluteMediaUrlOrNull(catalogRaw) ?? doc.thumbnailUrl ?? null,
    })
  }

  const out: PublicProductDoc[] = []
  for (const sku of skus) {
    const doc = bySku.get(sku.trim())
    if (doc) out.push(doc)
  }
  return out
}

/** Cached variant for PLP vector hydration (batch by SKU list). */
export const cachedFetchPublicProductsBySkus = unstable_cache(
  async (skusKey: string) => {
    const skus = skusKey.split('\u0001').filter(Boolean)
    return fetchPublicProductsBySkus(skus)
  },
  ['public-products-by-skus'],
  { revalidate: 60 },
)
