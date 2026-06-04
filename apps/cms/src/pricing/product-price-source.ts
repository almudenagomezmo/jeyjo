import type { Payload } from 'payload'

import type { ProductPriceBase } from '@jeyjo/pricing'

export type ProductPriceSource = {
  getBySku(sku: string): Promise<ProductPriceBase | null>
}

export function createPayloadProductPriceSource(payload: Payload): ProductPriceSource {
  const cache = new Map<string, ProductPriceBase | null>()

  return {
    async getBySku(sku) {
      if (cache.has(sku)) {
        return cache.get(sku) ?? null
      }

      const result = await payload.find({
        collection: 'products',
        where: { skuErp: { equals: sku } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })

      const doc = result.docs[0]
      if (!doc || doc.p1Price == null || doc.p2Price == null || doc.vatRate == null) {
        cache.set(sku, null)
        return null
      }

      const base: ProductPriceBase = {
        sku,
        p1Price: doc.p1Price,
        p2Price: doc.p2Price,
        vatRate: doc.vatRate,
      }
      cache.set(sku, base)
      return base
    },
  }
}
