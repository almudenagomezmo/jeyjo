import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { listEnrichedStockWatches } from '@/lib/wishlist/list-enriched-stock-watches'

export async function GET() {
  const guard = await requireB2bApiSession()
  if ('error' in guard) return guard.error

  const result = await listEnrichedStockWatches(guard.ctx.userId)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ items: result.items })
}
