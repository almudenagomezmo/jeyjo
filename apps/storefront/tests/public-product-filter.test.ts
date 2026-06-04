import { describe, expect, it } from 'vitest'

import { isPublicCatalogProduct } from '@/lib/catalog/public-product-filter'

describe('isPublicCatalogProduct', () => {
  it('excludes wildcard products', () => {
    expect(
      isPublicCatalogProduct({
        skuErp: '9000000001',
        isWildcard: true,
        _status: 'published',
      }),
    ).toBe(false)
  })

  it('excludes draft products', () => {
    expect(
      isPublicCatalogProduct({
        skuErp: 'REF-001',
        isWildcard: false,
        _status: 'draft',
      }),
    ).toBe(false)
  })

  it('includes published non-wildcard products', () => {
    expect(
      isPublicCatalogProduct({
        skuErp: 'REF-001',
        isWildcard: false,
        _status: 'published',
      }),
    ).toBe(true)
  })
})
