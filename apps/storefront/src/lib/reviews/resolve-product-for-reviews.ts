import { fetchPublicProductPdpBySlug } from '@/lib/catalog/fetch-product-pdp'

export type ProductReviewTarget = {
  productId: number
  sku: string
  slug: string
}

export async function resolveProductForReviews(
  slug: string,
): Promise<ProductReviewTarget | null> {
  const fetched = await fetchPublicProductPdpBySlug(slug.trim())
  if (!fetched?.doc) return null

  const id = fetched.doc.id
  const sku = fetched.doc.skuErp?.trim()
  const canonicalSlug = fetched.doc.slug?.trim()
  if (id == null || !sku || !canonicalSlug) return null

  const productId = typeof id === 'number' ? id : Number.parseInt(String(id), 10)
  if (!Number.isFinite(productId)) return null

  return { productId, sku, slug: canonicalSlug }
}
