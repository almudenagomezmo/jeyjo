import type { ProductPriceBase } from '@jeyjo/pricing'

import { fetchPublicProductBySkuFromCms } from '@/lib/catalog/fetch-product-by-sku'

export async function getProductPriceBase(sku: string): Promise<ProductPriceBase | null> {
  const doc = await fetchPublicProductBySkuFromCms(sku)
  if (!doc || doc.p1Price == null || doc.p2Price == null || doc.vatRate == null) {
    return null
  }

  return {
    sku,
    p1Price: doc.p1Price,
    p2Price: doc.p2Price,
    vatRate: doc.vatRate,
  }
}
