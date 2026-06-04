import type { PricingRepository } from './repository.js'
import type { CustomerPricingContext, ProductPriceBase } from './types.js'

export type InMemoryPricingData = {
  products: ProductPriceBase[]
  customers: CustomerPricingContext[]
  specialPrices: Array<{ customerId: string; sku: string; netPrice: number }>
  groupOffers: Array<{ sku: string; offerNetPrice: number; customerGroup?: number | null }>
}

export function createInMemoryPricingRepository(data: InMemoryPricingData): PricingRepository {
  const productBySku = new Map(data.products.map((p) => [p.sku, p]))
  const customerById = new Map(data.customers.map((c) => [c.customerId, c]))

  return {
    async getProductBase(sku) {
      return productBySku.get(sku) ?? null
    },
    async getCustomerContext(customerId) {
      if (!customerId) return null
      return customerById.get(customerId) ?? null
    },
    async getSpecialPrice(customerId, sku) {
      const row = data.specialPrices.find(
        (s) => s.customerId === customerId && s.sku === sku,
      )
      return row?.netPrice ?? null
    },
    async getGroupOffer(sku, _customerGroup) {
      const row = data.groupOffers.find((o) => o.sku === sku)
      return row?.offerNetPrice ?? null
    },
  }
}
