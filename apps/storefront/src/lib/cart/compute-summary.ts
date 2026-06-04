import type { PriceQuote } from '@jeyjo/pricing'

import { computeShippingPreview } from '@/lib/cart/shipping'
import type { CartDetailedLine, CartProductSnapshot, CartSummary } from '@/lib/cart/types'
import type { CartLine, PriceMode } from '@/lib/types'
import { getDualPrice, getPriceViewFromQuote } from '@/lib/utils/price'

const round2 = (n: number): number => Math.round(n * 100) / 100

export function findCartSnapshot(
  productId: string,
  products: CartProductSnapshot[],
): CartProductSnapshot | null {
  const key = productId.trim()
  if (!key) return null
  return (
    products.find((p) => p.slug === key || p.skuErp === key) ?? null
  )
}

export function computeCartSummary(
  lines: CartLine[],
  products: CartProductSnapshot[],
  quotes: Record<string, PriceQuote>,
  mode: PriceMode,
): CartSummary {
  const detailed: CartDetailedLine[] = lines.map((line) => {
    const snapshot = findCartSnapshot(line.productId, products)
    const sku = snapshot?.skuErp
    const quote = sku ? quotes[sku] : undefined

    if (!snapshot || !quote) {
      return {
        lineId: line.productId,
        snapshot,
        unavailable: true,
        qty: line.qty,
        unitPrice: 0,
        lineTotal: 0,
      }
    }

    const dual = getDualPrice(getPriceViewFromQuote(quote), mode)
    const unitPrice = dual.primary
    const lineTotal = round2(unitPrice * line.qty)

    return {
      lineId: line.productId,
      snapshot,
      unavailable: false,
      qty: line.qty,
      unitPrice,
      lineTotal,
    }
  })

  const pricedLines = detailed.filter((l) => !l.unavailable)
  const subtotal = round2(pricedLines.reduce((s, l) => s + l.lineTotal, 0))
  const { shippingThreshold, shippingCost, amountToFreeShipping } =
    computeShippingPreview(subtotal, mode)

  return {
    lines: detailed,
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
    subtotal,
    shippingThreshold,
    shippingCost,
    amountToFreeShipping,
    total: round2(subtotal + shippingCost),
    mode,
  }
}
