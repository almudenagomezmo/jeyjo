import { NextResponse } from 'next/server'

import { getCustomerContext } from '@/lib/auth/customer-context'
import { isCheckoutEnabled } from '@/lib/checkout/enabled'
import { createPayloadCheckoutOrder } from '@/lib/checkout/payload-order'
import { verifyCheckoutPrepare } from '@/lib/checkout/prepare-token'
import { resolveCheckoutSegment } from '@/lib/checkout/segment'
import type { DeliveryMethod } from '@/lib/checkout/totals'

const B2C_PAYMENT_OPTIONS: Record<string, string> = {
  card: 'Tarjeta',
  bizum: 'Bizum',
  paypal: 'PayPal',
  transfer: 'Transferencia bancaria',
}

const PICKUP_LABELS: Record<string, string> = {
  pickup_alfaro: 'Recogida en tienda — Alfaro',
  pickup_rincon: 'Recogida en tienda — Rincón de Soto',
}

export async function POST(request: Request) {
  if (!isCheckoutEnabled()) {
    return NextResponse.json({ error: 'Checkout disabled' }, { status: 503 })
  }

  let body: {
    prepareToken?: string
    deliveryMethod?: DeliveryMethod
    paymentMethodCode?: string
    guestEmail?: string | null
    customerNotes?: string | null
    shippingAddressSnapshot?: Record<string, unknown> | null
    billingAddressSnapshot?: Record<string, unknown> | null
    alternateAddressId?: string | null
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

  const prepare = verifyCheckoutPrepare(prepareToken)
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

  if (!ctx && !body.guestEmail?.trim()) {
    return NextResponse.json({ error: 'Guest email is required' }, { status: 400 })
  }

  const notes = body.customerNotes?.trim() ?? null
  if (notes && notes.length > 500) {
    return NextResponse.json({ error: 'Observations max 500 characters' }, { status: 400 })
  }

  let paymentMethodCode: string
  let paymentMethodLabel: string

  if (segment === 'b2b') {
    paymentMethodLabel = ctx?.defaultPaymentMethod?.trim() || 'Condiciones acordadas'
    paymentMethodCode = 'erp_default'
  } else {
    const code = body.paymentMethodCode?.trim()
    if (!code || !B2C_PAYMENT_OPTIONS[code]) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }
    paymentMethodCode = code
    paymentMethodLabel = B2C_PAYMENT_OPTIONS[code]!
  }

  const pickupStoreLabel =
    deliveryMethod === 'pickup_alfaro' || deliveryMethod === 'pickup_rincon'
      ? (PICKUP_LABELS[deliveryMethod] ?? null)
      : null

  try {
    const order = await createPayloadCheckoutOrder({
      prepare,
      segment,
      deliveryMethod,
      paymentMethodCode,
      paymentMethodLabel,
      customerId: ctx?.customerId ?? null,
      guestEmail: ctx ? null : (body.guestEmail?.trim() ?? null),
      customerNotes: notes,
      couponCode: prepare.totals.couponCode,
      shippingAddressSnapshot: body.shippingAddressSnapshot ?? null,
      billingAddressSnapshot: body.billingAddressSnapshot ?? null,
      pickupStoreLabel,
      alternateAddressId: body.alternateAddressId ?? null,
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order service unavailable. Try again.' },
        { status: 503 },
      )
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      orderId: order.id,
      status: segment === 'b2b' ? 'pending_confirmation' : 'pending_payment',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Place order failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
