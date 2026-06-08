import { describe, expect, it } from 'vitest'

import { mapDocToRow, matchesCategorySlugs } from '@/lib/catalog/fetch-product-list'
import { collectDescendantSlugs } from '@/lib/catalog/fetch-navigation-tree'
import { isPublicCatalogProduct } from '@/lib/catalog/public-product-filter'
import type { PlpProductRow } from '@/lib/plp/types'
import type { NavNode } from '@/lib/catalog/fetch-navigation-tree'

const CATEGORY_TREE: NavNode[] = [
  {
    id: '1',
    title: 'Escritura y corrección',
    slug: 'escritura',
    children: [
      {
        id: '2',
        title: 'Bolígrafos',
        slug: 'boligrafos',
        children: [
          { id: '5', title: 'Bolígrafos gel', slug: 'boligrafos-gel', children: [] },
          { id: '6', title: 'Bolígrafos tinta', slug: 'boligrafos-tinta', children: [] },
        ],
      },
      { id: '3', title: 'Rotuladores', slug: 'rotuladores', children: [] },
    ],
  },
]

function row(categorySlugs: string[]): PlpProductRow {
  return {
    sku: 'SKU-1',
    slug: 'sku-1',
    title: 'Producto test',
    brand: 'Marca',
    supplier: 'Distrisantiago',
    facetColor: null,
    facetMaterial: null,
    ecoLabel: false,
    categorySlugs,
    packUnit: 1,
    vatRate: 21,
    stockIndicator: 'limited',
    allowOrderWithoutStock: false,
    rating: 4,
    reviews: 0,
    hasOffer: false,
    imageUrl: null,
  }
}

describe('mapDocToRow', () => {
  it('maps brand and supplier from separate CMS relations', () => {
    const row = mapDocToRow({
      skuErp: '10102007',
      slug: 'boligrafo-bic',
      title: 'Bolígrafo BIC',
      brand: { name: 'BIC' },
      supplier: { name: 'Distrisantiago' },
      _status: 'published',
      isWildcard: false,
    })

    expect(row?.brand).toBe('BIC')
    expect(row?.supplier).toBe('Distrisantiago')
  })

  it('maps real review aggregates and null rating when reviewCount is zero', () => {
    const withReviews = mapDocToRow({
      skuErp: 'REF-002',
      slug: 'ref-002',
      title: 'Con valoraciones',
      reviewCount: 8,
      ratingAverage: 4.5,
      _status: 'published',
      isWildcard: false,
    })
    expect(withReviews?.rating).toBe(4.5)
    expect(withReviews?.reviews).toBe(8)

    const withoutReviews = mapDocToRow({
      skuErp: 'REF-003',
      slug: 'ref-003',
      title: 'Sin valoraciones',
      reviewCount: 0,
      ratingAverage: null,
      _status: 'published',
      isWildcard: false,
    })
    expect(withoutReviews?.rating).toBeNull()
    expect(withoutReviews?.reviews).toBe(0)
  })

  it('does not derive brand from supplier when brand is unset', () => {
    const row = mapDocToRow({
      skuErp: 'REF-001',
      slug: 'ref-001',
      title: 'Fixture',
      supplier: { name: 'Distrisantiago' },
      _status: 'published',
      isWildcard: false,
    })

    expect(row?.brand).toBeNull()
    expect(row?.supplier).toBe('Distrisantiago')
  })
})

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

describe('matchesCategorySlugs with expanded navigation tree', () => {
  it('matches child-category products when filtering by parent slugs', () => {
    const parent = CATEGORY_TREE[0]!
    const expandedSlugs = collectDescendantSlugs(parent)
    const product = row(['boligrafos'])

    expect(matchesCategorySlugs(product, expandedSlugs)).toBe(true)
    expect(matchesCategorySlugs(product, [parent.slug])).toBe(false)
  })

  it('matches family products on subcategory PLP but not on sibling family PLP', () => {
    const sub = CATEGORY_TREE[0]!.children[0]!
    const gelFamily = sub.children[0]!
    const tintaFamily = sub.children[1]!
    const product = row(['boligrafos-gel'])

    expect(matchesCategorySlugs(product, collectDescendantSlugs(sub))).toBe(true)
    expect(matchesCategorySlugs(product, collectDescendantSlugs(gelFamily))).toBe(true)
    expect(matchesCategorySlugs(product, collectDescendantSlugs(tintaFamily))).toBe(false)
  })
})
