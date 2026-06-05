import { NextResponse } from 'next/server'

import { getCustomerContext, pricingCustomerId } from '@/lib/auth/customer-context'
import { fetchCartProductsByIds } from '@/lib/catalog/fetch-cart-products'
import { validateCoupon } from '@/lib/coupon/validate'
import { isMarketingCouponsEnabled } from '@/lib/coupon/enabled'
import { resolveCheckoutSegment } from '@/lib/checkout/segment'
import { buildCheckoutTotals } from '@/lib/checkout/totals'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import type { CartLine } from '@/lib/types'

export async function POST(request: Request) {
  if (!isMarketingCouponsEnabled()) {
    return NextResponse.json({ error: 'Coupons disabled' }, { status: 503 })
  }

  let body: { code?: string; lines?: CartLine[] }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const code = body.code?.trim()
  const lines = Array.isArray(body.lines) ? body.lines : []
  if (!code) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 })
  }
  if (lines.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const ctx = await getCustomerContext()
  const segment = resolveCheckoutSegment(ctx)
  const ids = [...new Set(lines.map((l) => l.productId))]
  const products = ids.length > 0 ? await fetchCartProductsByIds(ids) : []
  const skus = products.map((p) => p.skuErp).filter(Boolean)
  const quotesBySku =
    skus.length > 0 ? await resolvePriceQuotesBatch(skus, pricingCustomerId(ctx)) : {}

  const coupon = await validateCoupon({
    code,
    lines,
    products,
    quotes: quotesBySku,
    mode: segment,
  })

  if (!coupon.valid) {
    return NextResponse.json(
      {
        valid: false,
        errors: coupon.errors,
        message: 'Cupón no válido',
      },
      { status: 400 },
    )
  }

  const totals = buildCheckoutTotals(lines, products, quotesBySku, segment, coupon)

  return NextResponse.json({
    valid: true,
    code: coupon.couponCode,
    label: coupon.label,
    discountAmount: coupon.discountAmount,
    eligibleSubtotal: coupon.eligibleSubtotal,
    showOfferExclusionWarning: coupon.showOfferExclusionWarning,
    totals,
  })
}

export async function DELETE() {
  return NextResponse.json({ ok: true })
}
