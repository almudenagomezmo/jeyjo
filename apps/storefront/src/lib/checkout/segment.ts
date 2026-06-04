import type { CustomerContext } from '@/lib/auth/customer-context'
import { pricingCustomerGroup } from '@/lib/auth/customer-context'
import type { PriceMode } from '@/lib/types'

export type CheckoutSegment = PriceMode

export function resolveCheckoutSegment(ctx: CustomerContext | null): CheckoutSegment {
  const group = pricingCustomerGroup(ctx)
  if (group >= 2 && group <= 4) return 'b2b'
  return 'b2c'
}
