import type { PriceQuote } from '@jeyjo/pricing'

export type RawPurchaseHistoryLine = {
  sku: string
  quantity: number
  purchasedAt: string
  historicalUnitPrice: number
  department?: string | null
  orderStatus?: string | null
  orderNumber?: string | null
  orderId?: number | null
}

export type MergedPurchaseHistoryLine = {
  sku: string
  usualQty: number
  lastPurchasedAt: string
  historicalUnitPrice: number | null
  department: string | null
  lastOrderStatus: string | null
  lastOrderNumber: string | null
  lastOrderId: number | null
}

export type PurchaseHistoryLineView = MergedPurchaseHistoryLine & {
  productSlug: string | null
  name: string
  imageUrl: string | null
  categoryIds: string[]
  canRepeat: boolean
  currentQuote: PriceQuote | null
}

export type PurchaseHistoryOrderLineRaw = {
  sku: string
  qty: number
  historicalUnitPrice: number
}

export type PurchaseHistoryOrderGroup = {
  orderKey: string
  orderId: number | null
  orderNumber: string | null
  orderStatus: string | null
  purchasedAt: string
  department: string | null
  lines: PurchaseHistoryOrderLineRaw[]
}

export type PurchaseHistoryOrderLineView = {
  sku: string
  qty: number
  historicalUnitPrice: number | null
  productSlug: string | null
  name: string
  imageUrl: string | null
  categoryIds: string[]
  canRepeat: boolean
  currentQuote: PriceQuote | null
}

export type PurchaseHistoryOrderView = {
  orderKey: string
  orderId: number | null
  orderNumber: string | null
  orderStatus: string | null
  purchasedAt: string
  department: string | null
  lines: PurchaseHistoryOrderLineView[]
}

export type PurchaseHistoryFilters = {
  from?: string
  to?: string
  sku?: string
  categoryId?: string
  department?: string
  status?: string
  page?: number
  pageSize?: number
}
