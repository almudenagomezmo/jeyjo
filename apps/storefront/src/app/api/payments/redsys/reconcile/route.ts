import { NextResponse } from 'next/server'

import { findPayloadOrderByNumber } from '@/lib/payments/payload-orders'

const STALE_HOURS = 24

function payloadBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

/** Cron-friendly: list stale pending_payment Redsys orders for manual review. */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const base = payloadBaseUrl()
  const apiKey = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!base || !apiKey) {
    return NextResponse.json({ error: 'CMS unavailable' }, { status: 503 })
  }

  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString()
  const params = new URLSearchParams({
    'where[jeyjoStatus][equals]': 'pending_payment',
    'where[createdAt][less_than]': cutoff,
    limit: '50',
    depth: '0',
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/orders?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to list orders' }, { status: 503 })
  }

  const data = (await res.json()) as {
    docs?: { orderNumber?: string; paymentMethodCode?: string; createdAt?: string }[]
  }

  const stale = (data.docs ?? []).filter((o) => {
    const code = o.paymentMethodCode ?? ''
    return code === 'card' || code === 'bizum'
  })

  const enriched = await Promise.all(
    stale.map(async (o) => {
      const full = o.orderNumber ? await findPayloadOrderByNumber(o.orderNumber) : null
      return {
        orderNumber: o.orderNumber,
        paymentMethodCode: o.paymentMethodCode,
        createdAt: o.createdAt,
        paymentStatus: full?.paymentStatus,
      }
    }),
  )

  return NextResponse.json({ staleOrders: enriched, thresholdHours: STALE_HOURS })
}
