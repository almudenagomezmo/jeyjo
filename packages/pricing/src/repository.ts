import type { CustomerPricingContext, ProductPriceBase } from './types.js'

export type PricingRepository = {
  getProductBase(sku: string): Promise<ProductPriceBase | null>
  getCustomerContext(customerId: string | null | undefined): Promise<CustomerPricingContext | null>
  getSpecialPrice(customerId: string, sku: string): Promise<number | null>
  getGroupOffer(sku: string, customerGroup: number): Promise<number | null>
}
