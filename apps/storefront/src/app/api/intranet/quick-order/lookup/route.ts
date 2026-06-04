import { NextResponse } from 'next/server'

import { resolveProductByReference } from '@/lib/catalog/resolve-product-by-reference'
import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { isQuickOrderEnabled } from '@/lib/intranet/quick-order/enabled'
import { mapQuickOrderPreview } from '@/lib/intranet/quick-order/preview'
import { isWildcardPurchaseSku } from '@/lib/intranet/purchase-history/wildcard'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'

export async function GET(request: Request) {
  if (!isQuickOrderEnabled()) {
    return NextResponse.json({ error: 'Quick order disabled' }, { status: 503 })
  }

  const guard = await requireB2bApiSession()
  if ('error' in guard) return guard.error

  const ref = new URL(request.url).searchParams.get('ref')?.trim() ?? ''
  if (!ref) {
    return NextResponse.json({ error: 'ref is required' }, { status: 400 })
  }

  if (isWildcardPurchaseSku(ref)) {
    return NextResponse.json({ error: 'Reference not found' }, { status: 404 })
  }

  const resolved = await resolveProductByReference(ref)
  if (!resolved) {
    return NextResponse.json({ error: 'Reference not found' }, { status: 404 })
  }

  const quotes = await resolvePriceQuotesBatch([resolved.sku], guard.customerId)
  const quote = quotes[resolved.sku]
  if (!quote) {
    return NextResponse.json({ error: 'Price not available' }, { status: 404 })
  }

  const preview = mapQuickOrderPreview(resolved, quote)
  if (!preview) {
    return NextResponse.json({ error: 'Product not available' }, { status: 404 })
  }

  return NextResponse.json({ preview })
}
