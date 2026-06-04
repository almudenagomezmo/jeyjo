import { NextResponse } from 'next/server'

import { getCustomerContext } from '@/lib/auth/customer-context'
import { fetchCustomerQuotes } from '@/lib/quotes/payload-quote'
import { isQuotesEnabled } from '@/lib/quotes/enabled'

export async function GET() {
  if (!isQuotesEnabled()) {
    return NextResponse.json({ error: 'Quotes disabled' }, { status: 503 })
  }

  const ctx = await getCustomerContext()
  if (!ctx?.customerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const quotes = await fetchCustomerQuotes(ctx.customerId)
  return NextResponse.json({ quotes })
}
