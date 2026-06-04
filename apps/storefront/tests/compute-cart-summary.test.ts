import { describe, expect, it } from 'vitest'
import type { PriceQuote } from '@jeyjo/pricing'

import { computeCartSummary } from '@/lib/cart/compute-summary'
import type { CartProductSnapshot } from '@/lib/cart/types'
import type { CartLine } from '@/lib/types'

const products: CartProductSnapshot[] = [
  {
    slug: 'boligrafo-a',
    skuErp: 'SKU-A',
    name: 'Bolígrafo A',
    ref: 'REF-A',
    packUnit: 1,
    imageUrl: null,
    vatRate: 21,
    brand: 'Marca',
    glyph: 'pen',
  },
  {
    slug: 'caja-b',
    skuErp: 'SKU-B',
    name: 'Caja B',
    ref: 'REF-B',
    packUnit: 12,
    imageUrl: null,
    vatRate: 21,
    brand: 'Marca',
    glyph: 'box',
  },
]

function quote(sku: string, net: number, gross: number): PriceQuote {
  return {
    sku,
    netUnit: net,
    grossUnit: gross,
    vatRate: 21,
    appliedRule: 'p1_retail',
  }
}

describe('computeCartSummary', () => {
  it('computes subtotal from two SKUs in B2C mode', () => {
    const lines: CartLine[] = [
      { productId: 'boligrafo-a', qty: 2 },
      { productId: 'caja-b', qty: 1 },
    ]
    const quotes = {
      'SKU-A': quote('SKU-A', 1, 1.21),
      'SKU-B': quote('SKU-B', 10, 12.1),
    }

    const summary = computeCartSummary(lines, products, quotes, 'b2c')
    expect(summary.lines).toHaveLength(2)
    expect(summary.lines[0]?.lineTotal).toBe(2.42)
    expect(summary.lines[1]?.lineTotal).toBe(12.1)
    expect(summary.subtotal).toBe(14.52)
    expect(summary.itemCount).toBe(3)
  })

  it('marks orphan lines when product or quote is missing', () => {
    const lines: CartLine[] = [{ productId: 'ghost-product', qty: 1 }]
    const summary = computeCartSummary(lines, products, {}, 'b2c')
    expect(summary.lines[0]?.unavailable).toBe(true)
    expect(summary.subtotal).toBe(0)
  })

  it('includes shipping preview in total', () => {
    const lines: CartLine[] = [{ productId: 'boligrafo-a', qty: 1 }]
    const quotes = { 'SKU-A': quote('SKU-A', 30, 36.3) }
    const summary = computeCartSummary(lines, products, quotes, 'b2c')
    expect(summary.shippingCost).toBe(5)
    expect(summary.amountToFreeShipping).toBe(2.7)
    expect(summary.total).toBe(41.3)
  })
})
