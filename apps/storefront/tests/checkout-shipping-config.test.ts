import { describe, expect, it } from 'vitest'
import type { PriceQuote } from '@jeyjo/pricing'

import { buildCheckoutTotals } from '@/lib/checkout/totals'
import type { CartProductSnapshot } from '@/lib/cart/types'
import type { CartLine } from '@/lib/types'

describe('buildCheckoutTotals with system shipping config', () => {
  const lines: CartLine[] = [{ productId: 'prod-a', qty: 38 }]
  const products: CartProductSnapshot[] = [
    {
      slug: 'prod-a',
      skuErp: 'REF-A',
      name: 'Product A',
      ref: 'REF-A',
      brand: 'Brand',
      packUnit: 1,
      imageUrl: null,
      vatRate: 21,
      glyph: 'pen',
    },
  ]

  function quote(net: number, gross: number): PriceQuote {
    return {
      sku: 'REF-A',
      netUnit: net,
      grossUnit: gross,
      vatRate: 21,
      appliedRule: 'p1_retail',
    }
  }

  it('charges configured B2C shipping cost below threshold', () => {
    const totals = buildCheckoutTotals(
      lines,
      products,
      { 'REF-A': quote(1, 1) },
      'b2c',
      null,
      undefined,
      {
        b2c: { threshold: 39, cost: 5 },
        b2b: { threshold: 10, cost: 2.5 },
      },
    )
    expect(totals.merchandiseSubtotal).toBe(38)
    expect(totals.shippingCost).toBe(5)
    expect(totals.total).toBe(43)
  })

  it('applies staff-configured B2C threshold', () => {
    const totals = buildCheckoutTotals(
      lines,
      products,
      { 'REF-A': quote(1, 1) },
      'b2c',
      null,
      undefined,
      {
        b2c: { threshold: 45, cost: 6 },
        b2b: { threshold: 10, cost: 2.5 },
      },
    )
    expect(totals.shippingCost).toBe(6)
    expect(totals.total).toBe(44)
  })
})
