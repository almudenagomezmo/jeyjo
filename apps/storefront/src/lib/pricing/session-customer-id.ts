import { getCustomerContext, pricingCustomerId } from '@/lib/auth/customer-context'

/** Validated B2B customer UUID for RF-007 pricing, or null for anonymous/B2C. */
export async function getSessionPricingCustomerId(): Promise<string | null> {
  const ctx = await getCustomerContext()
  return pricingCustomerId(ctx)
}
