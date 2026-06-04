import { describe, expect, it } from 'vitest'

import { isPublicCatalogProduct } from '@/lib/catalog/public-product-filter'
import { mapRelatedDocsToRows } from '@/lib/catalog/fetch-product-pdp'
import type { CmsPdpProductDoc } from '@/lib/catalog/fetch-product-pdp'

describe('PDP catalog visibility', () => {
  it('wildcard product is not public', () => {
    expect(
      isPublicCatalogProduct({
        skuErp: '9000000001',
        isWildcard: true,
        _status: 'published',
      }),
    ).toBe(false)
  })
})

describe('mapRelatedDocsToRows', () => {
  it('excludes draft and wildcard related products', () => {
    const related = [
      {
        skuErp: 'OK-1',
        slug: 'ok-1',
        title: 'Public',
        _status: 'published',
        isWildcard: false,
        supplier: { name: 'Marca' },
      },
      {
        skuErp: '9000000001',
        slug: 'wild',
        title: 'Wildcard',
        _status: 'published',
        isWildcard: true,
        supplier: { name: 'Marca' },
      },
      {
        skuErp: 'DRAFT-1',
        slug: 'draft-1',
        title: 'Draft',
        _status: 'draft',
        isWildcard: false,
        supplier: { name: 'Marca' },
      },
    ] as CmsPdpProductDoc[]

    const rows = mapRelatedDocsToRows(related)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.sku).toBe('OK-1')
  })
})
