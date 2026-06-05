import { describe, expect, it } from 'vitest'

import { computeShippingPreview, SHIPPING_RULES } from '@/lib/cart/shipping'
import { DEFAULT_SHIPPING_RULES } from '@/lib/system-config/defaults'

describe('computeShippingPreview', () => {
  const customRules = {
    b2c: { threshold: 50, cost: 7 },
    b2b: { threshold: 15, cost: 3 },
  }

  it('B2C subtotal 38€ → amountToFreeShipping 1€ with defaults', () => {
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

  it('uses custom rules when provided', () => {
    const preview = computeShippingPreview(45, 'b2c', customRules)
    expect(preview.shippingCost).toBe(7)
    expect(preview.amountToFreeShipping).toBe(5)
  })

  it('zero subtotal has no shipping cost', () => {
    expect(computeShippingPreview(0, 'b2c').shippingCost).toBe(0)
  })

  it('default rules match DEFAULT_SHIPPING_RULES export', () => {
    expect(SHIPPING_RULES).toEqual(DEFAULT_SHIPPING_RULES)
  })
})
