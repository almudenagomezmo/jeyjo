import {
  fetchPublicProductPdpBySlug,
  mapPdpDocToView,
  type CmsPdpProductDoc,
} from '@/lib/catalog/fetch-product-pdp'
import { isPublicCatalogProduct } from '@/lib/catalog/public-product-filter'
import type { CartProductSnapshot } from '@/lib/cart/types'

export function mapDocToCartSnapshot(doc: CmsPdpProductDoc): CartProductSnapshot | null {
  if (!isPublicCatalogProduct(doc)) return null
  const view = mapPdpDocToView(doc)
  if (!view) return null

  const ref = doc.mainWholesaleRef?.trim() || doc.oemRef?.trim() || view.sku

  return {
    slug: view.slug,
    skuErp: view.sku,
    name: view.title,
    ref,
    packUnit: view.packUnit,
    imageUrl: view.imageUrl,
    vatRate: view.vatRate,
    brand: view.brand ?? '',
    glyph: view.glyph,
    eco: view.ecoLabel,
  }
}

export async function fetchCartProductsByIds(ids: string[]): Promise<CartProductSnapshot[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
  if (unique.length === 0) return []

  const snapshots: CartProductSnapshot[] = []
  const seen = new Set<string>()

  await Promise.all(
    unique.map(async (id) => {
      const result = await fetchPublicProductPdpBySlug(id)
      if (!result) return
      const snapshot = mapDocToCartSnapshot(result.doc)
      if (!snapshot || seen.has(snapshot.slug)) return
      seen.add(snapshot.slug)
      snapshots.push(snapshot)
    }),
  )

  return snapshots
}
