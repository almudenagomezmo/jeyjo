import type { Payload } from 'payload'

import type { PricingRepository } from '@jeyjo/pricing'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { CA_PRECIOS_FIXTURES, createInMemoryPricingRepository } from '@jeyjo/pricing'

import { createPayloadProductPriceSource } from './product-price-source'
import { createSupabasePricingRepository } from './supabase-pricing-repository'

export function createCmsPricingRepository(payload: Payload): PricingRepository {
  const supabase = getSupabaseServerClient()
  const productSource = createPayloadProductPriceSource(payload)

  if (supabase) {
    return createSupabasePricingRepository(supabase, productSource)
  }

  return createInMemoryPricingRepository(CA_PRECIOS_FIXTURES)
}

export { createPayloadProductPriceSource } from './product-price-source'
export { createSupabasePricingRepository } from './supabase-pricing-repository'
