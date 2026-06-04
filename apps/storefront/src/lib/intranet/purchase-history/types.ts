import type { PriceQuote } from '@jeyjo/pricing'

export type RawPurchaseHistoryLine = {
  sku: string
  quantity: number
  purchasedAt: string
  historicalUnitPrice: number
  department?: string | null
}

export type MergedPurchaseHistoryLine = {
  sku: string
  usualQty: number
  lastPurchasedAt: string
  historicalUnitPrice: number | null
  department: string | null
}

export type PurchaseHistoryLineView = MergedPurchaseHistoryLine & {
  productSlug: string | null
  name: string
  imageUrl: string | null
  categoryIds: string[]
  canRepeat: boolean
  currentQuote: PriceQuote | null
}

export type PurchaseHistoryFilters = {
  from?: string
  to?: string
  sku?: string
  categoryId?: string
  department?: string
  page?: number
  pageSize?: number
}
