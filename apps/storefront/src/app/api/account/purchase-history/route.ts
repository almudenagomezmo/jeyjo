import { NextResponse } from 'next/server'

import { requireCustomerApiSession } from '@/lib/auth/customer-api-guard'
import { parsePurchaseHistoryFilters } from '@/lib/intranet/purchase-history/parse-filters'
import { buildPurchaseHistoryPage } from '@/lib/intranet/purchase-history/service'

export async function GET(request: Request) {
  const guard = await requireCustomerApiSession()
  if ('error' in guard) return guard.error

  const result = await buildPurchaseHistoryPage(
    guard.customerId,
    parsePurchaseHistoryFilters(new URL(request.url)),
  )

  return NextResponse.json(result)
}
