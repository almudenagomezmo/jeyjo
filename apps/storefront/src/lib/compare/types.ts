import type { PriceQuote } from '@jeyjo/pricing'

import type { PublicStockIndicator } from '@/lib/stock/types'

export type CompareColumn = {
  sku: string
  slug: string
  title: string
  imageUrl: string | null
  brand: string
  supplier: string
  color: string
  material: string
  packUnit: number
  vatRate: number
  description: string
  quote?: PriceQuote
  stock: PublicStockIndicator
}

export type ComparePageResult = {
  columns: CompareColumn[]
  requestedSkus: string[]
  validSkus: string[]
  invalidSkus: string[]
}
