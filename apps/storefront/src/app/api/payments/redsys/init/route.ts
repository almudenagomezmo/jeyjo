import { NextResponse } from 'next/server'

import { isPaymentsEnabled } from '@/lib/payments/enabled'
import { buildRedsysRedirectForm } from '@/lib/payments/redsys/build-redirect'
import { findPayloadOrderById, findPayloadOrderByNumber } from '@/lib/payments/payload-orders'
import { fetchPaymentSettings, isPaymentMethodEnabled } from '@/lib/payments/settings'

export async function POST(request: Request) {
  if (!isPaymentsEnabled()) {
    return NextResponse.json({ error: 'Payments disabled' }, { status: 503 })
  }

  let body: { orderId?: number; orderNumber?: string; method?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const order =
    body.orderId != null
      ? await findPayloadOrderById(body.orderId)
      : body.orderNumber
        ? await findPayloadOrderByNumber(body.orderNumber.trim())
        : null

  if (!order?.orderNumber || !order.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.paymentStatus === 'authorized' || order.jeyjoStatus === 'confirmed') {
    return NextResponse.json({ error: 'Order already paid' }, { status: 409 })
  }

  const method = (body.method ?? order.paymentMethodCode ?? 'card').trim()
  if (method !== 'card' && method !== 'bizum') {
    return NextResponse.json({ error: 'Invalid Redsys method' }, { status: 400 })
  }

  const settings = await fetchPaymentSettings()
  if (!isPaymentMethodEnabled(settings, method)) {
    return NextResponse.json({ error: 'Payment method disabled' }, { status: 400 })
  }

  const amountEuros = order.amount ?? order.total ?? 0
  const amountCents = Math.round(amountEuros * 100)
  const form = buildRedsysRedirectForm({
    orderNumber: order.orderNumber,
    amountCents,
    method,
  })

  if (!form) {
    return NextResponse.json({ error: 'Redsys not configured' }, { status: 503 })
  }

  return NextResponse.json({
    tpvUrl: form.tpvUrl,
    signatureVersion: form.signatureVersion,
    merchantParameters: form.merchantParameters,
    signature: form.signature,
    orderRef: form.orderRef,
  })
}
