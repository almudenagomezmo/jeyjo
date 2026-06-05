import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { buildPurchaseHistoryPage } from '@/lib/intranet/purchase-history/service'

export async function GET(request: Request) {
  const guard = await requireB2bApiSession({ section: 'orders' })
  if ('error' in guard) return guard.error

  const url = new URL(request.url)
  const page = Number.parseInt(url.searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(url.searchParams.get('pageSize') ?? '25', 10)

  const result = await buildPurchaseHistoryPage(guard.customerId, {
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    sku: url.searchParams.get('sku') ?? undefined,
    categoryId: url.searchParams.get('categoryId') ?? undefined,
    department: url.searchParams.get('department') ?? undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 25,
  })

  return NextResponse.json(result)
}
