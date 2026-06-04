import { describe, expect, it } from 'vitest'

import { isPublicCatalogProduct } from '@/lib/catalog/public-product-filter'

describe('PLP public product filter', () => {
  it('excludes wildcard from list candidates', () => {
    expect(
      isPublicCatalogProduct({
        skuErp: '9000000001',
        isWildcard: true,
        _status: 'published',
      }),
    ).toBe(false)
  })

  it('includes published non-wildcard for PLP listing', () => {
    expect(
      isPublicCatalogProduct({
        skuErp: 'REF-001',
        isWildcard: false,
        _status: 'published',
      }),
    ).toBe(true)
  })
})
