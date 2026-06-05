import type { PriceQuote } from '@jeyjo/pricing'

import { getCustomerContext, pricingCustomerId } from '@/lib/auth/customer-context'
import { computeCartSummary } from '@/lib/cart/compute-summary'
import type { CartProductSnapshot } from '@/lib/cart/types'
import { validateCoupon } from '@/lib/coupon/validate'
import { resolveCheckoutSegment } from '@/lib/checkout/segment'
import { buildCheckoutTotals, type DeliveryMethod } from '@/lib/checkout/totals'
import { fetchCartProductsByIds } from '@/lib/catalog/fetch-cart-products'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import { getShippingRules } from '@/lib/system-config/fetch'
import type { CartLine } from '@/lib/types'

export class CouponValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'CouponValidationError'
  }
}

export async function resolveServerCheckoutCart(
  lines: CartLine[],
  couponCode: string | null,
  deliveryMethod?: DeliveryMethod,
) {
  const ctx = await getCustomerContext()
  const segment = resolveCheckoutSegment(ctx)

  const ids = [...new Set(lines.map((l) => l.productId))]
  const products: CartProductSnapshot[] =
    ids.length > 0 ? await fetchCartProductsByIds(ids) : []

  const skus = products.map((p) => p.skuErp).filter(Boolean)
  const customerId = pricingCustomerId(ctx)
  const quotesBySku = skus.length > 0 ? await resolvePriceQuotesBatch(skus, customerId) : {}
  const quotes = quotesBySku as Record<string, PriceQuote>

  const couponResult =
    couponCode && couponCode.trim()
      ? await validateCoupon({
          code: couponCode,
          lines,
          products,
          quotes,
          mode: segment,
        })
      : null

  if (couponResult && !couponResult.valid && couponResult.errors.length > 0) {
    throw new CouponValidationError(
      `Cupón no válido: ${couponResult.errors.join(', ')}`,
      couponResult.errors[0] ?? 'invalid',
    )
  }

  const shippingRules = await getShippingRules()

  const summary = computeCartSummary(lines, products, quotes, segment, shippingRules)
  const totals = buildCheckoutTotals(
    lines,
    products,
    quotes,
    segment,
    couponResult,
    deliveryMethod,
    shippingRules,
  )

  const lineSnapshots = summary.lines
    .filter((l) => !l.unavailable && l.snapshot)
    .map((l) => ({
      lineId: l.lineId,
      skuErp: l.snapshot!.skuErp,
      name: l.snapshot!.name,
      qty: l.qty,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    }))

  return { ctx, segment, products, quotes, summary, totals, lineSnapshots, couponResult }
}
