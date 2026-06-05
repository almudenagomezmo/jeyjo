import { describe, expect, it } from 'vitest'

import {
  arePlpFiltersEqual,
  countActivePlpFilters,
  normalizePlpFilters,
} from '@/lib/plp/filters-utils'
import type { PlpActiveFilters } from '@/lib/plp/types'

const baseFilters: PlpActiveFilters = {
  brands: [],
  colors: [],
  materials: [],
  priceMax: null,
  inStockToday: false,
  eco: false,
}

describe('filters-utils', () => {
  it('treats price at ceiling as no active price filter', () => {
    expect(normalizePlpFilters({ ...baseFilters, priceMax: 100 }, 100).priceMax).toBeNull()
    expect(countActivePlpFilters({ ...baseFilters, priceMax: 100 }, 100)).toBe(0)
  })

  it('detects pending filter changes', () => {
    const applied = { ...baseFilters, brands: ['bic'] }
    const pending = { ...baseFilters, brands: ['bic', 'pilot'] }

    expect(arePlpFiltersEqual(applied, pending, 100)).toBe(false)
    expect(arePlpFiltersEqual(applied, applied, 100)).toBe(true)
  })

  it('counts active filters consistently', () => {
    const filters = {
      ...baseFilters,
      brands: ['bic'],
      inStockToday: true,
      priceMax: 50,
    }

    expect(countActivePlpFilters(filters, 100)).toBe(3)
  })
})
