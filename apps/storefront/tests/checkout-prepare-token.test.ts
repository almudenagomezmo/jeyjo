import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import {
  signCheckoutPrepare,
  verifyCheckoutPrepare,
  type CheckoutPreparePayload,
} from '@/lib/checkout/prepare-token'

describe('checkout prepare token', () => {
  beforeEach(() => {
    process.env.CHECKOUT_SIGNING_SECRET = 'test-secret-key-for-hmac-signing'
  })

  afterEach(() => {
    delete process.env.CHECKOUT_SIGNING_SECRET
  })

  it('round-trips a valid payload', () => {
    const payload: CheckoutPreparePayload = {
      exp: Date.now() + 60_000,
      lines: [{ productId: 'x', qty: 1 }],
      totals: {
        subtotal: 10,
        discount: 0,
        merchandiseSubtotal: 10,
        shippingCost: 5,
        total: 15,
        segment: 'b2c',
        couponCode: null,
      },
      lineSnapshots: [],
    }
    const token = signCheckoutPrepare(payload)
    expect(token).toBeTruthy()
    const verified = verifyCheckoutPrepare(token!)
    expect(verified?.totals.total).toBe(15)
  })
})
