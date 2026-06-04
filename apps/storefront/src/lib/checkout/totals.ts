import type { PriceQuote } from '@jeyjo/pricing'

import { computeCartSummary } from '@/lib/cart/compute-summary'
import { computeShippingPreview } from '@/lib/cart/shipping'
import type { CartProductSnapshot } from '@/lib/cart/types'
import type { CheckoutSegment } from '@/lib/checkout/segment'
import type { CartLine } from '@/lib/types'

import { validateDemoCoupon } from './coupon'

const round2 = (n: number): number => Math.round(n * 100) / 100

export type CheckoutTotals = {
  subtotal: number
  discount: number
  merchandiseSubtotal: number
  shippingCost: number
  total: number
  segment: CheckoutSegment
  couponCode: string | null
}

export type DeliveryMethod =
  | 'home'
  | 'alternate_address'
  | 'pickup_alfaro'
  | 'pickup_rincon'

export function buildCheckoutTotals(
  lines: CartLine[],
  products: CartProductSnapshot[],
  quotes: Record<string, PriceQuote>,
  segment: CheckoutSegment,
  couponCode: string | null,
  deliveryMethod?: DeliveryMethod,
): CheckoutTotals {
  const summary = computeCartSummary(lines, products, quotes, segment)
  const coupon = validateDemoCoupon(couponCode)
  const discount = coupon ? round2(summary.subtotal * (coupon.percent / 100)) : 0
  const merchandiseSubtotal = round2(summary.subtotal - discount)

  const isPickup =
    deliveryMethod === 'pickup_alfaro' || deliveryMethod === 'pickup_rincon'
  const { shippingCost } = isPickup
    ? { shippingCost: 0 }
    : computeShippingPreview(merchandiseSubtotal, segment)

  const total = round2(merchandiseSubtotal + shippingCost)

  return {
    subtotal: summary.subtotal,
    discount,
    merchandiseSubtotal,
    shippingCost,
    total,
    segment,
    couponCode: coupon?.code ?? null,
  }
}
