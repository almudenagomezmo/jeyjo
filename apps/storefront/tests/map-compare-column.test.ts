import { describe, expect, it } from 'vitest'

import { COMPARE_EMPTY_PLACEHOLDER } from '@/lib/compare/constants'
import { mapDocToCompareColumn } from '@/lib/compare/map-compare-column'
import type { PublicProductDoc } from '@/lib/catalog/fetch-public-products-by-skus'

describe('mapDocToCompareColumn', () => {
  it('uses em dash for null facet fields', () => {
    const doc: PublicProductDoc = {
      skuErp: 'REF-001',
      title: 'Producto',
      slug: 'producto',
      _status: 'published',
      isWildcard: false,
      brand: null,
      facetColor: null,
      facetMaterial: null,
      shortDescription: null,
    }

    const column = mapDocToCompareColumn(doc)
    expect(column?.brand).toBe(COMPARE_EMPTY_PLACEHOLDER)
    expect(column?.color).toBe(COMPARE_EMPTY_PLACEHOLDER)
    expect(column?.material).toBe(COMPARE_EMPTY_PLACEHOLDER)
    expect(column?.description).toBe(COMPARE_EMPTY_PLACEHOLDER)
  })

  it('strips html from shortDescription', () => {
    const doc: PublicProductDoc = {
      skuErp: 'REF-002',
      title: 'Producto 2',
      slug: 'producto-2',
      _status: 'published',
      isWildcard: false,
      shortDescription: '<p>Texto <strong>limpio</strong></p>',
    }

    const column = mapDocToCompareColumn(doc)
    expect(column?.description).toBe('Texto limpio')
  })
})
