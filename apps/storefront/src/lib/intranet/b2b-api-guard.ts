import { NextResponse } from 'next/server'

import { getCustomerContext, pricingCustomerId } from '@/lib/auth/customer-context'
import { isB2bValidated } from '@/lib/auth/redirect'

export async function requireB2bApiSession() {
  const ctx = await getCustomerContext()
  if (!ctx) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!isB2bValidated(ctx)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return {
    ctx,
    customerId: pricingCustomerId(ctx) ?? ctx.customerId,
  }
}
