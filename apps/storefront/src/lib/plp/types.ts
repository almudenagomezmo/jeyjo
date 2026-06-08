import type { PriceQuote } from '@jeyjo/pricing'
import type { StockIndicatorLevel } from '@jeyjo/stock-ports'

import type { PublicStockIndicator } from '@/lib/stock/types'

export type PlpSortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'name'

export type PlpProductRow = {
  sku: string
  slug: string
  title: string
  brand: string | null
  supplier: string | null
  facetColor: string | null
  facetMaterial: string | null
  ecoLabel: boolean
  categorySlugs: string[]
  packUnit: number
  vatRate: number
  stockIndicator: StockIndicatorLevel
  allowOrderWithoutStock: boolean
  rating: number | null
  reviews: number
  hasOffer: boolean
  imageUrl: string | null
}

export type PlpActiveFilters = {
  brands: string[]
  suppliers: string[]
  colors: string[]
  materials: string[]
  priceMax: number | null
  inStockToday: boolean
  eco: boolean
}

export type FacetOption = {
  value: string
  count: number
}

export type PlpFacetAggregates = {
  brands: FacetOption[]
  suppliers: FacetOption[]
  colors: FacetOption[]
  materials: FacetOption[]
  priceMax: number
}

export type PlpPagePayload = {
  rows: PlpProductRow[]
  facets: PlpFacetAggregates
  activeFilters: PlpActiveFilters
  sort: PlpSortKey
  page: number
  pageSize: number
  totalFiltered: number
  quotesBySku: Record<string, PriceQuote>
  stockBySku: Record<string, PublicStockIndicator>
}

export const PLP_PAGE_SIZE = 48
export const PLP_AGGREGATION_LIMIT = 500
