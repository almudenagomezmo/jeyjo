import { describe, expect, it } from 'vitest'

import { deriveOrderCouponDiscount } from '@/lib/orders/order-coupon-summary'

describe('deriveOrderCouponDiscount', () => {
  it('derives coupon discount from line subtotal, shipping and order total', () => {
    expect(
      deriveOrderCouponDiscount({
        linesSubtotal: 100,
        shippingCost: 5,
        orderTotal: 90,
      }),
    ).toBe(15)
  })

  it('returns zero when totals match without discount', () => {
    expect(
      deriveOrderCouponDiscount({
        linesSubtotal: 100,
        shippingCost: 0,
        orderTotal: 100,
      }),
    ).toBe(0)
  })
})
