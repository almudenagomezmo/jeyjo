export type QuickOrderMatchField = 'sku' | 'oem' | 'ean'

export type QuickOrderLineStatus = 'ok' | 'not_found' | 'wildcard' | 'invalid_qty'

export type QuickOrderLinePreview = {
  inputReference: string
  sku: string | null
  productSlug: string | null
  title: string | null
  imageUrl: string | null
  qty: number
  packUnit: number
  matchedBy: QuickOrderMatchField | null
  status: QuickOrderLineStatus
  quote: {
    netUnit: number
    grossUnit: number
    appliedRule: string
    label?: string
  } | null
}

export type QuickOrderAddition = {
  productId: string
  sku: string
  qty: number
  quote: {
    netUnit: number
    grossUnit: number
    appliedRule: string
    label?: string
  }
}
