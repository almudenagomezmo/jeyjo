import type { PriceQuote } from '@jeyjo/pricing'

import { computeCartSummary } from '@/lib/cart/compute-summary'
import type { ShippingRules } from '@/lib/system-config/defaults'
import { DEFAULT_SHIPPING_RULES } from '@/lib/system-config/defaults'
import { computeShippingPreview } from '@/lib/cart/shipping'
import type { CartProductSnapshot } from '@/lib/cart/types'
import type { CouponValidationResult } from '@/lib/coupon/types'
import type { CheckoutSegment } from '@/lib/checkout/segment'
import type { CartLine } from '@/lib/types'

const round2 = (n: number): number => Math.round(n * 100) / 100

export type CheckoutTotals = {
  subtotal: number
  discount: number
  merchandiseSubtotal: number
  shippingCost: number
  total: number
  segment: CheckoutSegment
  couponCode: string | null
  couponLabel: string | null
  showOfferExclusionWarning?: boolean
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
  coupon: CouponValidationResult | null,
  deliveryMethod?: DeliveryMethod,
  shippingRules: ShippingRules = DEFAULT_SHIPPING_RULES,
): CheckoutTotals {
  const summary = computeCartSummary(lines, products, quotes, segment, shippingRules)
  const discount =
    coupon?.valid && coupon.discountAmount > 0 ? round2(coupon.discountAmount) : 0
  const merchandiseSubtotal = round2(summary.subtotal - discount)

  const isPickup =
    deliveryMethod === 'pickup_alfaro' || deliveryMethod === 'pickup_rincon'
  const { shippingCost } = isPickup
    ? { shippingCost: 0 }
    : computeShippingPreview(merchandiseSubtotal, segment, shippingRules)

  const total = round2(merchandiseSubtotal + shippingCost)

  return {
    subtotal: summary.subtotal,
    discount,
    merchandiseSubtotal,
    shippingCost,
    total,
    segment,
    couponCode: coupon?.valid ? coupon.couponCode : null,
    couponLabel: coupon?.valid ? coupon.label : null,
    showOfferExclusionWarning: coupon?.showOfferExclusionWarning ?? false,
  }
}
