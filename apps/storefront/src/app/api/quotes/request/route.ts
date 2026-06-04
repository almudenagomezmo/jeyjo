import { NextResponse } from 'next/server'

import { getCustomerContext } from '@/lib/auth/customer-context'
import { resolveCheckoutSegment } from '@/lib/checkout/segment'
import type { DeliveryMethod } from '@/lib/checkout/totals'
import { isQuotesEnabled } from '@/lib/quotes/enabled'
import { createPayloadQuote } from '@/lib/quotes/payload-quote'
import { verifyQuotePrepare } from '@/lib/quotes/prepare-token'

const PICKUP_LABELS: Record<string, string> = {
  pickup_alfaro: 'Recogida en tienda — Alfaro',
  pickup_rincon: 'Recogida en tienda — Rincón de Soto',
}

export async function POST(request: Request) {
  if (!isQuotesEnabled()) {
    return NextResponse.json({ error: 'Quotes disabled' }, { status: 503 })
  }

  let body: {
    prepareToken?: string
    deliveryMethod?: DeliveryMethod
    guestEmail?: string | null
    customerNotes?: string | null
    shippingAddressSnapshot?: Record<string, unknown> | null
    billingAddressSnapshot?: Record<string, unknown> | null
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prepareToken = body.prepareToken?.trim()
  if (!prepareToken) {
    return NextResponse.json({ error: 'prepareToken is required' }, { status: 400 })
  }

  const prepare = verifyQuotePrepare(prepareToken)
  if (!prepare) {
    return NextResponse.json({ error: 'Invalid or expired prepare token' }, { status: 400 })
  }

  const deliveryMethod = body.deliveryMethod
  if (
    !deliveryMethod ||
    !['home', 'alternate_address', 'pickup_alfaro', 'pickup_rincon'].includes(deliveryMethod)
  ) {
    return NextResponse.json({ error: 'Invalid delivery method' }, { status: 400 })
  }

  const ctx = await getCustomerContext()
  const segment = resolveCheckoutSegment(ctx)
  if (prepare.segment !== segment) {
    return NextResponse.json({ error: 'Segment mismatch' }, { status: 400 })
  }

  const contactEmail = ctx?.email?.trim() ?? body.guestEmail?.trim() ?? null
  if (!ctx && !contactEmail) {
    return NextResponse.json({ error: 'Guest email is required' }, { status: 400 })
  }

  const notes = body.customerNotes?.trim() ?? null
  if (notes && notes.length > 500) {
    return NextResponse.json({ error: 'Observations max 500 characters' }, { status: 400 })
  }

  const pickupStoreLabel =
    deliveryMethod === 'pickup_alfaro' || deliveryMethod === 'pickup_rincon'
      ? (PICKUP_LABELS[deliveryMethod] ?? null)
      : null

  try {
    const quote = await createPayloadQuote(prepareToken, {
      customerId: ctx?.customerId ?? null,
      guestEmail: ctx ? contactEmail : contactEmail,
      deliveryMethod,
      pickupStoreLabel,
      shippingAddressSnapshot: body.shippingAddressSnapshot ?? null,
      billingAddressSnapshot: body.billingAddressSnapshot ?? null,
      customerNotes: notes,
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote service unavailable' }, { status: 503 })
    }

    return NextResponse.json({
      quoteNumber: quote.quoteNumber,
      quoteId: quote.id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Quote request failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
