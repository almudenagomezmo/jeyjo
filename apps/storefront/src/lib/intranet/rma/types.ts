export type RmaReason = 'wrong_item' | 'defective' | 'wrong_qty' | 'other'

export type RmaStatus = 'requested' | 'in_review' | 'authorized' | 'rejected'

export type RmaListFilter = 'open' | 'closed' | 'all'

export type RmaIncidentRow = {
  id: number
  rmaNumber: string | null
  status: RmaStatus | string | null
  articleSku: string
  deliveryNoteNumber: string
  reason: RmaReason | string
  observations: string | null
  createdAt: string
  productTitle?: string | null
}

export type RmaListResult = {
  incidents: RmaIncidentRow[]
  total: number
  page: number
  pageSize: number
}

export type CreateRmaInput = {
  articleSku: string
  deliveryNoteNumber: string
  reason: RmaReason
  observations?: string | null
}

export type CreateRmaResult = {
  id: number
  rmaNumber: string
  status: string
}
