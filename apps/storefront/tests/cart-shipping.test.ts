import { describe, expect, it } from 'vitest'

import { computeShippingPreview, SHIPPING_RULES } from '@/lib/cart/shipping'

describe('computeShippingPreview', () => {
  it('B2C subtotal 38€ → amountToFreeShipping 1€', () => {
    const preview = computeShippingPreview(38, 'b2c')
    expect(preview.amountToFreeShipping).toBe(1)
    expect(preview.shippingCost).toBe(SHIPPING_RULES.b2c.cost)
  })

  it('B2C at threshold has free shipping', () => {
    const preview = computeShippingPreview(40, 'b2c')
    expect(preview.shippingCost).toBe(0)
    expect(preview.amountToFreeShipping).toBe(0)
  })

  it('B2B below threshold applies B2B cost', () => {
    const preview = computeShippingPreview(5, 'b2b')
    expect(preview.shippingCost).toBe(SHIPPING_RULES.b2b.cost)
    expect(preview.amountToFreeShipping).toBe(5)
  })

  it('zero subtotal has no shipping cost', () => {
    expect(computeShippingPreview(0, 'b2c').shippingCost).toBe(0)
  })
})
