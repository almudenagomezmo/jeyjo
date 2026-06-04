import { describe, expect, it } from 'vitest'
import type { PriceQuote } from '@jeyjo/pricing'

import { buildCheckoutTotals } from '@/lib/checkout/totals'
import type { CartProductSnapshot } from '@/lib/cart/types'
import type { CartLine } from '@/lib/types'

const products: CartProductSnapshot[] = [
  {
    slug: 'item-a',
    skuErp: 'SKU-A',
    name: 'Item',
    ref: 'R1',
    packUnit: 1,
    imageUrl: null,
    vatRate: 21,
    brand: 'B',
    glyph: 'pen',
  },
]

function quote(net: number, gross: number): PriceQuote {
  return {
    sku: 'SKU-A',
    netUnit: net,
    grossUnit: gross,
    vatRate: 21,
    appliedRule: 'p1_retail',
  }
}

describe('buildCheckoutTotals', () => {
  it('B2C 40€ merchandise has free shipping and total 40', () => {
    const lines: CartLine[] = [{ productId: 'item-a', qty: 40 }]
    const quotes = { 'SKU-A': quote(1, 1) }

    const totals = buildCheckoutTotals(lines, products, quotes, 'b2c', null, 'home')
    expect(totals.merchandiseSubtotal).toBe(40)
    expect(totals.shippingCost).toBe(0)
    expect(totals.total).toBe(40)
  })

  it('pickup Alfaro forces zero shipping', () => {
    const lines: CartLine[] = [{ productId: 'item-a', qty: 5 }]
    const quotes = { 'SKU-A': quote(1, 1.21) }

    const totals = buildCheckoutTotals(
      lines,
      products,
      quotes,
      'b2c',
      null,
      'pickup_alfaro',
    )
    expect(totals.shippingCost).toBe(0)
  })
})
