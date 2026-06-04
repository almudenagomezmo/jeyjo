/** Normalized product from ERP — maps to Payload `erpFields` + optional supplier link. */
export type ErpProductDto = {
  skuErp: string
  mainWholesaleRef?: string | null
  oemRef?: string | null
  ean?: string | null
  shortDescription?: string | null
  p1Price?: number | null
  p2Price?: number | null
  vatRate?: number | null
  packUnit?: number | null
  isWildcard?: boolean
  allowOrderWithoutStock?: boolean
  erpStock?: number | null
  supplierErpCode?: string | null
  /** ISO-8601 timestamp from ERP when provided */
  syncedAt?: string | null
}

export type ErpSupplierType = 'wholesaler' | 'manufacturer' | 'distributor' | 'other'

export type ErpSupplierDto = {
  erpCode: string
  name: string
  type: ErpSupplierType
  baseImageUrl?: string | null
}

export type ErpUpsertConfirmation = {
  naturalKey: string
  acknowledgedAt: string
}
