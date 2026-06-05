import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { buildCustomTariffsPage } from '@/lib/intranet/custom-tariffs/service'

export async function GET(request: Request) {
  const guard = await requireB2bApiSession({ section: 'orders' })
  if ('error' in guard) return guard.error

  const url = new URL(request.url)
  const page = Number.parseInt(url.searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(url.searchParams.get('pageSize') ?? '25', 10)

  const result = await buildCustomTariffsPage(guard.customerId, {
    sku: url.searchParams.get('sku') ?? undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 25,
  })

  return NextResponse.json(result)
}
