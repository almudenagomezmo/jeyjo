import { describe, expect, it } from 'vitest'

import { parsePlpSearchParams, serializePlpSearchParams } from '@/lib/plp/plp-search-params'

describe('plp-search-params', () => {
  it('parses brand and inStockToday from query', () => {
    const { filters, sort, page } = parsePlpSearchParams({
      brand: 'bic',
      inStockToday: '1',
      sort: 'price-asc',
    })
    expect(filters.brands).toEqual(['bic'])
    expect(filters.inStockToday).toBe(true)
    expect(sort).toBe('price-asc')
    expect(page).toBe(1)
  })

  it('round-trips URL params', () => {
    const filters = {
      brands: ['bic'],
      colors: [],
      materials: [],
      priceMax: null,
      inStockToday: true,
      eco: false,
    }
    const sp = serializePlpSearchParams({ filters, sort: 'relevance', page: 1 })
    expect(sp.get('brand')).toBe('bic')
    expect(sp.get('inStockToday')).toBe('1')

    const parsed = parsePlpSearchParams(Object.fromEntries(sp.entries()))
    expect(parsed.filters.brands).toEqual(['bic'])
    expect(parsed.filters.inStockToday).toBe(true)
  })
})
