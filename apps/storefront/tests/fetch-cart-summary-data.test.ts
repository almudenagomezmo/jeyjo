import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchCartSummaryData } from '@/lib/hooks/useCartSummary'
import type { CartLine } from '@/lib/types'

describe('fetchCartSummaryData', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === '/api/catalog/cart-products') {
          return new Response(
            JSON.stringify({
              products: [
                {
                  slug: 'item-a',
                  skuErp: 'SKU-A',
                  name: 'Item A',
                  ref: 'REF-A',
                  packUnit: 1,
                  imageUrl: null,
                  vatRate: 21,
                  brand: 'Marca',
                  glyph: 'pen',
                },
                {
                  slug: 'item-b',
                  skuErp: 'SKU-B',
                  name: 'Item B',
                  ref: 'REF-B',
                  packUnit: 1,
                  imageUrl: null,
                  vatRate: 21,
                  brand: 'Marca',
                  glyph: 'box',
                },
              ],
            }),
            { status: 200 },
          )
        }
        if (url === '/api/pricing/batch') {
          const body = JSON.parse(String(init?.body)) as { skus: string[] }
          const quotes: Record<string, unknown> = {}
          for (const sku of body.skus) {
            quotes[sku] = {
              sku,
              netUnit: sku === 'SKU-A' ? 10 : 5,
              grossUnit: sku === 'SKU-A' ? 12.1 : 6.05,
              vatRate: 21,
              appliedRule: 'p1_retail',
            }
          }
          return new Response(JSON.stringify({ quotes, priceMode: 'b2c' }), {
            status: 200,
          })
        }
        return new Response('{}', { status: 404 })
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('two SKUs return correct B2C subtotal', async () => {
    const lines: CartLine[] = [
      { productId: 'item-a', qty: 2 },
      { productId: 'item-b', qty: 1 },
    ]
    const summary = await fetchCartSummaryData(lines, 'b2c')
    expect(summary.subtotal).toBe(30.25)
    expect(summary.lines).toHaveLength(2)
  })
})
