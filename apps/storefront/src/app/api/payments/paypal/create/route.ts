import { NextResponse } from 'next/server'

import { isPaymentsEnabled } from '@/lib/payments/enabled'
import { createPayPalCheckoutOrder, isPayPalConfigured } from '@/lib/payments/paypal/client'
import { findPayloadOrderById } from '@/lib/payments/payload-orders'
import { fetchPaymentSettings, isPaymentMethodEnabled } from '@/lib/payments/settings'

export async function GET(request: Request) {
  if (!isPaymentsEnabled()) {
    return NextResponse.json({ error: 'Payments disabled' }, { status: 503 })
  }

  const orderId = Number(new URL(request.url).searchParams.get('orderId'))
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: 'orderId required' }, { status: 400 })
  }

  const settings = await fetchPaymentSettings()
  if (!isPaymentMethodEnabled(settings, 'paypal')) {
    return NextResponse.json({ error: 'PayPal disabled' }, { status: 400 })
  }

  const order = await findPayloadOrderById(orderId)
  if (!order?.orderNumber) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.paymentStatus === 'authorized') {
    return NextResponse.json({ error: 'Order already paid' }, { status: 409 })
  }

  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, '')
  if (!storefrontUrl) {
    return NextResponse.json({ error: 'Storefront URL not configured' }, { status: 503 })
  }

  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: 'PayPal not configured' }, { status: 503 })
  }

  const amountEuros = order.amount ?? order.total ?? 0
  const paypalOrder = await createPayPalCheckoutOrder({
    orderNumber: order.orderNumber,
    amountEuros,
    returnUrl: `${storefrontUrl}/checkout/retorno/paypal?order=${encodeURIComponent(order.orderNumber)}`,
    cancelUrl: `${storefrontUrl}/checkout/retorno/ko?order=${encodeURIComponent(order.orderNumber)}`,
  })

  if (!paypalOrder) {
    return NextResponse.json({ error: 'PayPal create failed' }, { status: 503 })
  }

  return NextResponse.redirect(paypalOrder.approvalUrl)
}
