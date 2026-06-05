import { NextResponse } from 'next/server'

import { listEnrichedStockWatches } from '@/lib/wishlist/list-enriched-stock-watches'
import { requireWishlistSession } from '@/lib/wishlist/sync'

export async function GET() {
  const session = await requireWishlistSession()
  if ('error' in session) {
    const status = session.error === 'disabled' ? 403 : 401
    return NextResponse.json({ error: 'Unauthorized' }, { status })
  }

  const result = await listEnrichedStockWatches(session.ctx.userId)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ items: result.items })
}
