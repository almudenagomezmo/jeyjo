import { NextResponse } from 'next/server'

import type { OrderPurchaseSnapshot } from '@/lib/analytics/ga4-purchase'

function measurementConfig(): { measurementId: string; apiSecret: string } | null {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim()
  const apiSecret = process.env.GA4_API_SECRET?.trim()
  if (!measurementId || !apiSecret) return null
  return { measurementId, apiSecret }
}

export async function POST(request: Request) {
  const config = measurementConfig()
  if (!config) {
    return NextResponse.json({ skipped: true, reason: 'GA4 MP not configured' })
  }

  let body: OrderPurchaseSnapshot
  try {
    body = (await request.json()) as OrderPurchaseSnapshot
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.paid || !body.orderNumber || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Invalid purchase payload' }, { status: 400 })
  }

  const eventId = crypto.randomUUID()
  const mpBody = {
    client_id: eventId,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: body.orderNumber,
          currency: 'EUR',
          value: body.total,
          tax: body.tax,
          shipping: body.shipping,
          items: body.items.map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            price: item.price,
            quantity: item.quantity ?? 1,
          })),
        },
      },
    ],
  }

  const url = new URL('https://www.google-analytics.com/mp/collect')
  url.searchParams.set('measurement_id', config.measurementId)
  url.searchParams.set('api_secret', config.apiSecret)

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mpBody),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Measurement Protocol failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, eventId })
}
