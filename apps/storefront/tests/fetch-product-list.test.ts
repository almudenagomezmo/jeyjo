import { describe, expect, it } from 'vitest'

import { matchesCategorySlugs } from '@/lib/catalog/fetch-product-list'
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
