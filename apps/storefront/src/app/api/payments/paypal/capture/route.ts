import { NextResponse } from 'next/server'

import { capturePayPalOrder } from '@/lib/payments/paypal/client'
import {
  findPayloadOrderByNumber,
  updateOrderPaymentStatus,
} from '@/lib/payments/payload-orders'

export async function POST(request: Request) {
  let body: { paypalOrderId?: string; orderNumber?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const paypalOrderId = body.paypalOrderId?.trim()
  const orderNumber = body.orderNumber?.trim()
  if (!paypalOrderId || !orderNumber) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const order = await findPayloadOrderByNumber(orderNumber)
  if (!order?.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const capture = await capturePayPalOrder(paypalOrderId)
  if (!capture) {
    return NextResponse.json({ error: 'Capture failed' }, { status: 502 })
  }

  const amountEuros = order.amount ?? order.total ?? 0
  await updateOrderPaymentStatus({
    orderId: order.id,
    jeyjoStatus: 'confirmed',
    paymentStatus: 'authorized',
    gateway: 'paypal',
    gatewayTransactionId: capture.captureId,
    paidAmount: amountEuros,
    paidAt: new Date().toISOString(),
    paymentFailureReason: null,
  })

  return NextResponse.json({ ok: true, captureId: capture.captureId })
}
