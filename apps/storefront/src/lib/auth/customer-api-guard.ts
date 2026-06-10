import { NextResponse } from 'next/server'

import { getCustomerContext, pricingCustomerId } from '@/lib/auth/customer-context'

export async function requireCustomerApiSession() {
  const ctx = await getCustomerContext()
  if (!ctx) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!ctx.isActive) {
    return { error: NextResponse.json({ error: 'Account disabled' }, { status: 403 }) }
  }
  return {
    ctx,
    customerId: pricingCustomerId(ctx) ?? ctx.customerId,
  }
}
