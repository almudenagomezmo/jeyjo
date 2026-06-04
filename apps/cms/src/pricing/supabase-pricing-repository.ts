import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'
import type {
  CustomerPricingContext,
  PricingRepository,
  ProductPriceBase,
} from '@jeyjo/pricing'

import type { ProductPriceSource } from './product-price-source'

function isActiveDate(validFrom: string, validTo: string | null): boolean {
  const today = new Date().toISOString().slice(0, 10)
  if (validFrom > today) return false
  if (validTo && validTo < today) return false
  return true
}

export function createSupabasePricingRepository(
  supabase: SupabaseClient<Database>,
  productSource: ProductPriceSource,
): PricingRepository {
  return {
    getProductBase: (sku) => productSource.getBySku(sku),
    async getCustomerContext(customerId) {
      if (!customerId) return null
      const { data, error } = await supabase
        .from('customers')
        .select('id, customer_group, general_discount, erp_code')
        .eq('id', customerId)
        .maybeSingle()
      if (error || !data) return null
      return {
        customerId: data.id,
        customerGroup: data.customer_group,
        generalDiscount: Number(data.general_discount),
        erpCode: data.erp_code,
      } satisfies CustomerPricingContext
    },
    async getSpecialPrice(customerId, sku) {
      const { data, error } = await supabase
        .from('special_prices')
        .select('net_price, valid_from, valid_to')
        .eq('customer_id', customerId)
        .eq('product_sku', sku)
        .maybeSingle()
      if (error || !data) return null
      if (!isActiveDate(data.valid_from, data.valid_to)) return null
      return Number(data.net_price)
    },
    async getGroupOffer(sku, _customerGroup) {
      const { data, error } = await supabase
        .from('group_offers')
        .select('offer_net_price, valid_from, valid_to, active')
        .eq('sku_erp', sku)
        .eq('active', true)
        .maybeSingle()
      if (error || !data) return null
      if (!isActiveDate(data.valid_from, data.valid_to)) return null
      return Number(data.offer_net_price)
    },
  }
}
