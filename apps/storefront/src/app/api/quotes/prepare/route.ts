import { NextResponse } from 'next/server'

import { formatShippingLine } from '@/lib/checkout/shipping-copy'
import { resolveServerCheckoutCart } from '@/lib/checkout/server-cart'
import type { DeliveryMethod } from '@/lib/checkout/totals'
import { isQuotesEnabled } from '@/lib/quotes/enabled'
import { signQuotePrepare } from '@/lib/quotes/prepare-token'
import type { CartLine } from '@/lib/types'

const PREPARE_TTL_MS = 30 * 60 * 1000

export async function POST(request: Request) {
  if (!isQuotesEnabled()) {
    return NextResponse.json({ error: 'Quotes disabled' }, { status: 503 })
  }

  let body: {
    lines?: CartLine[]
    couponCode?: string | null
    deliveryMethod?: DeliveryMethod
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const lines = Array.isArray(body.lines) ? body.lines : []
  if (lines.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  try {
    const { segment, totals, lineSnapshots } = await resolveServerCheckoutCart(
      lines,
      body.couponCode ?? null,
      body.deliveryMethod,
    )

    const payload = {
      exp: Date.now() + PREPARE_TTL_MS,
      lines,
      totals,
      lineSnapshots,
      segment,
    }
    const prepareToken = signQuotePrepare(payload)
    if (!prepareToken) {
      return NextResponse.json({ error: 'Quote signing not configured' }, { status: 503 })
    }

    return NextResponse.json({
      prepareToken,
      segment,
      totals,
      shippingLine: formatShippingLine(segment, totals.shippingCost),
      expiresAt: payload.exp,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prepare failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
