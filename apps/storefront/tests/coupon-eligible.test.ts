import { describe, expect, it } from 'vitest'
import type { PriceQuote } from '@jeyjo/pricing'

import { computeEligibleSubtotal } from '@/lib/coupon/eligible'
import type { CartProductSnapshot } from '@/lib/cart/types'
import type { CartLine } from '@/lib/types'

const products: CartProductSnapshot[] = [
  {
    slug: 'ref-007',
    skuErp: 'REF-007',
    name: 'Offer item',
    ref: 'REF-007',
    packUnit: 1,
    imageUrl: null,
    vatRate: 21,
    brand: 'B',
    glyph: 'pen',
  },
  {
    slug: 'ref-008',
    skuErp: 'REF-008',
    name: 'Regular item',
    ref: 'REF-008',
    packUnit: 1,
    imageUrl: null,
    vatRate: 21,
    brand: 'B',
    glyph: 'pen',
  },
]

function quote(sku: string, net: number, rule: PriceQuote['appliedRule']): PriceQuote {
  return {
    sku,
    netUnit: net,
    grossUnit: net * 1.21,
    vatRate: 21,
    appliedRule: rule,
  }
}

describe('computeEligibleSubtotal CA-CHECKOUT-005', () => {
  it('excludes group_offer lines from eligible subtotal', () => {
    const lines: CartLine[] = [
      { productId: 'ref-007', qty: 1 },
      { productId: 'ref-008', qty: 1 },
    ]
    const quotes = {
      'REF-007': quote('REF-007', 30, 'group_offer'),
      'REF-008': quote('REF-008', 50 / 1.21, 'p1_retail'),
    }

    const result = computeEligibleSubtotal(lines, products, quotes, 'b2c')
    expect(result.eligibleSubtotal).toBe(50)
    expect(result.ineligibleOfferLines).toContain('ref-007')
  })
})
