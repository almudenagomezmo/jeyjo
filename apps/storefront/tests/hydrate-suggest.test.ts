import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/pricing/resolve-batch', () => ({
  resolvePriceQuotesBatch: vi.fn().mockResolvedValue({}),
}))

import { hydrateSuggestProducts } from '@/lib/search/hydrate-suggest'

describe('hydrateSuggestProducts', () => {
  beforeEach(() => {
    vi.stubEnv('CMS_URL', 'http://cms.test')
  })

  it('omits wildcard SKU from suggest response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          docs: [
            {
              skuErp: 'GOOD',
              title: 'Good',
              slug: 'good',
              _status: 'published',
              isWildcard: false,
            },
            {
              skuErp: 'WILD',
              title: 'Wildcard',
              slug: 'wild',
              _status: 'published',
              isWildcard: true,
            },
          ],
        }),
      }),
    )

    const products = await hydrateSuggestProducts([
      { sku: 'GOOD', score: 1, payload: { skuErp: 'GOOD' } },
      { sku: 'WILD', score: 0.9, payload: { skuErp: 'WILD' } },
    ])

    expect(products.map((p) => p.sku)).toEqual(['GOOD'])
  })

  it('returns imageUrl from catalog thumbnail hydration', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          docs: [
            {
              skuErp: 'REF-IMG',
              title: 'With image',
              slug: 'ref-img',
              _status: 'published',
              isWildcard: false,
              ownImage: { url: '/media/own.jpg' },
            },
          ],
        }),
      }),
    )

    const products = await hydrateSuggestProducts([
      { sku: 'REF-IMG', score: 1, payload: { skuErp: 'REF-IMG', title: 'With image' } },
    ])

    expect(products[0]?.imageUrl).toBe('http://cms.test/media/own.jpg')
  })

  it('maps packUnit and canAddToCart from catalog snapshot', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          docs: [
            {
              skuErp: 'PACK-12',
              title: 'Pack product',
              slug: 'pack-product',
              _status: 'published',
              isWildcard: false,
              packUnit: 12,
              stockIndicator: 'available',
            },
            {
              skuErp: 'NO-STOCK',
              title: 'No stock',
              slug: 'no-stock',
              _status: 'published',
              isWildcard: false,
              stockIndicator: 'limited',
            },
            {
              skuErp: 'BACKORDER',
              title: 'Backorder',
              slug: 'backorder',
              _status: 'published',
              isWildcard: false,
              stockIndicator: 'limited',
              allowOrderWithoutStock: true,
            },
          ],
        }),
      }),
    )

    const products = await hydrateSuggestProducts([
      { sku: 'PACK-12', score: 1, payload: { skuErp: 'PACK-12' } },
      { sku: 'NO-STOCK', score: 0.9, payload: { skuErp: 'NO-STOCK' } },
      { sku: 'BACKORDER', score: 0.8, payload: { skuErp: 'BACKORDER' } },
    ])

    expect(products[0]).toMatchObject({ packUnit: 12, canAddToCart: true })
    expect(products[1]).toMatchObject({ packUnit: 1, canAddToCart: false })
    expect(products[2]).toMatchObject({ canAddToCart: true })
  })
})

describe('EAN query mock ordering', () => {
  it('keeps highest score first for EAN hit', () => {
    const hits = [
      { sku: '3086123519963', score: 0.99 },
      { sku: 'OTHER', score: 0.2 },
    ]
    const ordered = [...hits].sort((a, b) => b.score - a.score)
    expect(ordered[0]?.sku).toBe('3086123519963')
  })
})
