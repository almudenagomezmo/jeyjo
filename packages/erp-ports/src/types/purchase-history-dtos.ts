/** Single ERP purchase history line (pre-aggregation). */
export type ErpPurchaseHistoryLineDto = {
  sku: string
  quantity: number
  purchasedAt: string
  historicalUnitPrice: number
  department?: string | null
}

export type ErpPurchaseHistoryListOptions = {
  from?: string
  to?: string
  sku?: string
  department?: string
  limit?: number
}
