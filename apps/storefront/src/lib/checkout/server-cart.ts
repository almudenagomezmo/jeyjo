import type { PriceQuote } from '@jeyjo/pricing'

import { getCustomerContext, pricingCustomerId } from '@/lib/auth/customer-context'
import { computeCartSummary } from '@/lib/cart/compute-summary'
import type { CartProductSnapshot } from '@/lib/cart/types'
import { resolveCheckoutSegment } from '@/lib/checkout/segment'
import { buildCheckoutTotals, type DeliveryMethod } from '@/lib/checkout/totals'
import { fetchCartProductsByIds } from '@/lib/catalog/fetch-cart-products'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import type { CartLine } from '@/lib/types'

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

  const summary = computeCartSummary(lines, products, quotes, segment)
  const totals = buildCheckoutTotals(
    lines,
    products,
    quotes,
    segment,
    couponCode,
    deliveryMethod,
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

  return { ctx, segment, products, quotes, summary, totals, lineSnapshots }
}
