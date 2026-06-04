import { describe, expect, it } from 'vitest'

import { mapDocToCartSnapshot } from '@/lib/catalog/fetch-cart-products'
import type { CmsPdpProductDoc } from '@/lib/catalog/fetch-product-pdp'

describe('mapDocToCartSnapshot', () => {
  it('omits wildcard published products', () => {
    const doc = {
      skuErp: '9000000001',
      slug: 'wildcard-item',
      title: 'Wildcard',
      isWildcard: true,
      _status: 'published',
      packUnit: 1,
      vatRate: 21,
    } as CmsPdpProductDoc

    expect(mapDocToCartSnapshot(doc)).toBeNull()
  })

  it('maps published non-wildcard product', () => {
    const doc = {
      skuErp: 'REF-001',
      slug: 'boligrafo-azul',
      title: 'Bolígrafo azul',
      isWildcard: false,
      _status: 'published',
      packUnit: 12,
      vatRate: 21,
      oemRef: 'OEM-1',
    } as CmsPdpProductDoc

    const snap = mapDocToCartSnapshot(doc)
    expect(snap?.slug).toBe('boligrafo-azul')
    expect(snap?.skuErp).toBe('REF-001')
    expect(snap?.packUnit).toBe(12)
  })
})
