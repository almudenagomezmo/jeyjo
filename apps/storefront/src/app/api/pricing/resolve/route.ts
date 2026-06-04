import { NextResponse } from 'next/server'

import { isB2BCustomerGroup, resolvePrice } from '@jeyjo/pricing'

import { getStorefrontPricingRepository } from '@/lib/pricing/repository'
import { getProductPriceBase } from '@/lib/pricing/product-catalog'

export async function POST(request: Request) {
  if (process.env.PRICING_ENGINE_ENABLED === 'false') {
    return NextResponse.json({ error: 'Pricing engine disabled' }, { status: 503 })
  }

  let body: { sku?: string; customerId?: string | null }
  try {
    body = (await request.json()) as { sku?: string; customerId?: string | null }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const sku = body.sku?.trim()
  if (!sku) {
    return NextResponse.json({ error: 'sku is required' }, { status: 400 })
  }

  const productBase = await getProductPriceBase(sku)
  if (!productBase) {
    return NextResponse.json({ error: 'Product not available' }, { status: 404 })
  }

  try {
    const repo = getStorefrontPricingRepository()
    const quote = await resolvePrice(
      { sku, customerId: body.customerId ?? null },
      repo,
    )

    const customer = await repo.getCustomerContext(body.customerId ?? null)
    const customerGroup = customer?.customerGroup ?? 1
    const priceMode = isB2BCustomerGroup(customerGroup) ? 'b2b' : 'b2c'

    return NextResponse.json({
      quote: {
        sku: quote.sku,
        netUnit: quote.netUnit,
        grossUnit: quote.grossUnit,
        vatRate: quote.vatRate,
        appliedRule: quote.appliedRule,
        listUnit: quote.listUnit,
        discountPercent: quote.discountPercent,
        label: quote.label,
      },
      priceMode,
      headerLabel: priceMode === 'b2b' ? 'Precios sin IVA (B2B)' : 'Precios sin IVA',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pricing resolution failed'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
