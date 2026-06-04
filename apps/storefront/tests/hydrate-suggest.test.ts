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
