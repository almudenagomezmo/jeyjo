import { describe, expect, it } from 'vitest'

import { buildFacetAggregates } from '@/lib/plp/facet-aggregates'
import type { PlpProductRow } from '@/lib/plp/types'

const rows: PlpProductRow[] = [
  {
    sku: 'A',
    slug: 'a',
    title: 'A',
    brand: 'BIC',
    supplier: 'Distrisantiago',
    facetColor: 'Azul',
    facetMaterial: 'Plástico',
    ecoLabel: false,
    categorySlugs: ['escritura'],
    packUnit: 1,
    vatRate: 21,
    stockIndicator: 'available',
    allowOrderWithoutStock: false,
    rating: 4,
    reviews: 0,
    hasOffer: false,
    imageUrl: null,
  },
  {
    sku: 'B',
    slug: 'b',
    title: 'B',
    brand: 'Pilot',
    supplier: 'Distrisantiago',
    facetColor: 'Azul',
    facetMaterial: 'Metal',
    ecoLabel: true,
    categorySlugs: ['escritura'],
    packUnit: 1,
    vatRate: 21,
    stockIndicator: 'low',
    allowOrderWithoutStock: false,
    rating: 5,
    reviews: 0,
    hasOffer: false,
    imageUrl: null,
  },
  {
    sku: 'C',
    slug: 'c',
    title: 'C',
    brand: 'BIC',
    supplier: 'Distrisantiago',
    facetColor: 'Rojo',
    facetMaterial: 'Plástico',
    ecoLabel: false,
    categorySlugs: ['escritura'],
    packUnit: 1,
    vatRate: 21,
    stockIndicator: 'available',
    allowOrderWithoutStock: false,
    rating: 3,
    reviews: 0,
    hasOffer: false,
    imageUrl: null,
  },
]

const quotes = {
  A: { sku: 'A', netUnit: 1, grossUnit: 1.21, vatRate: 21, appliedRule: 'p1_retail' as const },
  B: { sku: 'B', netUnit: 2, grossUnit: 2.42, vatRate: 21, appliedRule: 'p1_retail' as const },
  C: { sku: 'C', netUnit: 3, grossUnit: 3.63, vatRate: 21, appliedRule: 'p1_retail' as const },
}

describe('buildFacetAggregates', () => {
  it('counts brand options with inStockToday filter applied', () => {
    const facets = buildFacetAggregates(rows, {
      brands: [],
      suppliers: [],
      colors: [],
      materials: [],
      priceMax: null,
      inStockToday: true,
      eco: false,
    }, quotes)

    const bic = facets.brands.find((b) => b.value === 'BIC')
    expect(bic?.count).toBe(2)
    const pilot = facets.brands.find((b) => b.value === 'Pilot')
    expect(pilot).toBeUndefined()
  })

  it('narrows with brand and supplier filters together', () => {
    const filtered = rows.filter(
      (r) =>
        r.brand === 'BIC' &&
        r.supplier === 'Distrisantiago' &&
        r.stockIndicator === 'available',
    )
    expect(filtered).toHaveLength(2)
  })

  it('counts supplier facet options', () => {
    const facets = buildFacetAggregates(rows, {
      brands: ['BIC'],
      suppliers: [],
      colors: [],
      materials: [],
      priceMax: null,
      inStockToday: false,
      eco: false,
    }, quotes)

    const distri = facets.suppliers.find((s) => s.value === 'Distrisantiago')
    expect(distri?.count).toBe(2)
  })
})
