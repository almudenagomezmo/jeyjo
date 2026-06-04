import { NextResponse } from 'next/server'

import { isB2BCustomerGroup } from '@jeyjo/pricing'

import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import { getStorefrontPricingRepository } from '@/lib/pricing/repository'

export async function POST(request: Request) {
  if (process.env.PRICING_ENGINE_ENABLED === 'false') {
    return NextResponse.json({ error: 'Pricing engine disabled' }, { status: 503 })
  }

  let body: { skus?: string[]; customerId?: string | null }
  try {
    body = (await request.json()) as { skus?: string[]; customerId?: string | null }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const skus = Array.isArray(body.skus) ? body.skus : []
  if (skus.length === 0) {
    return NextResponse.json({ error: 'skus array is required' }, { status: 400 })
  }
  if (skus.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 SKUs per batch' }, { status: 400 })
  }

  try {
    const quotesBySku = await resolvePriceQuotesBatch(skus, body.customerId ?? null)
    const repo = getStorefrontPricingRepository()
    const customer = await repo.getCustomerContext(body.customerId ?? null)
    const customerGroup = customer?.customerGroup ?? 1
    const priceMode = isB2BCustomerGroup(customerGroup) ? 'b2b' : 'b2c'

    const quotes: Record<
      string,
      {
        sku: string
        netUnit: number
        grossUnit: number
        vatRate: number
        appliedRule: string
        listUnit?: number
        discountPercent?: number
        label?: string
      }
    > = {}

    for (const [sku, quote] of Object.entries(quotesBySku)) {
      quotes[sku] = {
        sku: quote.sku,
        netUnit: quote.netUnit,
        grossUnit: quote.grossUnit,
        vatRate: quote.vatRate,
        appliedRule: quote.appliedRule,
        listUnit: quote.listUnit,
        discountPercent: quote.discountPercent,
        label: quote.label,
      }
    }

    return NextResponse.json({ quotes, priceMode })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Batch pricing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
