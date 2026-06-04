import { unstable_cache } from 'next/cache'

import {
  isPublicCatalogProduct,
  type CmsProductSnapshot,
} from '@/lib/catalog/public-product-filter'

function cmsBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

async function fetchProductDocFromCms(sku: string): Promise<CmsProductSnapshot | null> {
  const base = cmsBaseUrl()
  if (!base) return null

  const params = new URLSearchParams({
    'where[skuErp][equals]': sku,
    limit: '1',
    depth: '0',
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/products?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })

  if (!res.ok) return null

  const body = (await res.json()) as { docs?: CmsProductSnapshot[] }
  return body.docs?.[0] ?? null
}

const cachedFetch = unstable_cache(
  async (sku: string) => fetchProductDocFromCms(sku),
  ['cms-product-by-sku'],
  { revalidate: 60 },
)

export async function fetchProductBySkuFromCms(
  sku: string,
): Promise<CmsProductSnapshot | null> {
  if (!sku.trim()) return null
  return cachedFetch(sku.trim())
}

export async function fetchPublicProductBySkuFromCms(
  sku: string,
): Promise<CmsProductSnapshot | null> {
  const doc = await fetchProductBySkuFromCms(sku)
  if (!doc || !isPublicCatalogProduct(doc)) return null
  return doc
}
