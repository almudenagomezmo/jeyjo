export type OrderLineSnapshot = {
  lineId?: string
  skuErp: string
  name?: string
  qty: number
  unitPrice: number
  lineTotal?: number
}

export type OrderExportInput = {
  orderNumber: string
  createdAt: string
  customerErpCode?: string | null
  customerTaxId?: string | null
  lines: OrderLineSnapshot[]
}

export type AvansuiteRow = {
  webOrderNumber: string
  orderDate: string
  customerErpCode: string
  customerTaxId: string
  skuErp: string
  quantity: number
  unitPrice: number
  lineDiscount: number
}

export type ValidationIssue = {
  orderNumber: string
  field: string
  message: string
}

export type ValidationResult = {
  ok: boolean
  issues: ValidationIssue[]
}
