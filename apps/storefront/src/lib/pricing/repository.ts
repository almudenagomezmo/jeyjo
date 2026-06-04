import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'
import {
  CA_PRECIOS_FIXTURES,
  createInMemoryPricingRepository,
  type PricingRepository,
} from '@jeyjo/pricing'

import { getProductPriceBase } from './product-catalog'

function isActiveDate(validFrom: string, validTo: string | null): boolean {
  const today = new Date().toISOString().slice(0, 10)
  if (validFrom > today) return false
  if (validTo && validTo < today) return false
  return true
}

function createSupabasePricingRepository(
  supabase: SupabaseClient<Database>,
): PricingRepository {
  const fallback = createInMemoryPricingRepository(CA_PRECIOS_FIXTURES)

  return {
    getProductBase: (sku) => getProductPriceBase(sku),
    async getCustomerContext(customerId) {
      if (!customerId) return null
      const { data } = await supabase
        .from('customers')
        .select('id, customer_group, general_discount, erp_code')
        .eq('id', customerId)
        .maybeSingle()
      if (!data) return fallback.getCustomerContext(customerId)
      return {
        customerId: data.id,
        customerGroup: data.customer_group,
        generalDiscount: Number(data.general_discount),
        erpCode: data.erp_code,
      }
    },
    async getSpecialPrice(customerId, sku) {
      const { data } = await supabase
        .from('special_prices')
        .select('net_price, valid_from, valid_to')
        .eq('customer_id', customerId)
        .eq('product_sku', sku)
        .maybeSingle()
      if (data && isActiveDate(data.valid_from, data.valid_to)) {
        return Number(data.net_price)
      }
      return fallback.getSpecialPrice(customerId, sku)
    },
    async getGroupOffer(sku, customerGroup) {
      const { data } = await supabase
        .from('group_offers')
        .select('offer_net_price, valid_from, valid_to, active')
        .eq('sku_erp', sku)
        .eq('active', true)
        .maybeSingle()
      if (data && isActiveDate(data.valid_from, data.valid_to)) {
        return Number(data.offer_net_price)
      }
      return fallback.getGroupOffer(sku, customerGroup)
    },
  }
}

let cachedRepo: PricingRepository | null = null

export function getStorefrontPricingRepository(): PricingRepository {
  if (cachedRepo) return cachedRepo

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (url && key) {
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    cachedRepo = createSupabasePricingRepository(supabase)
    return cachedRepo
  }

  cachedRepo = createInMemoryPricingRepository(CA_PRECIOS_FIXTURES)
  return cachedRepo
}
