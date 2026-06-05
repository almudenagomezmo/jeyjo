export type TariffValidityStatus = 'active' | 'expired'

export type CustomTariffLineView = {
  sku: string
  productSlug: string | null
  name: string
  imageUrl: string | null
  minQty: number | null
  recommendedNetPrice: number
  discount1Pct: number | null
  discount2Pct: number | null
  discountDerived: boolean
  netPrice: number
  validTo: string | null
  status: TariffValidityStatus
  statusLabel: 'Vigente' | 'Caducado'
  canRequestReview: boolean
}

export type GroupOfferView = {
  sku: string
  productSlug: string | null
  name: string
  imageUrl: string | null
  offerNetPrice: number
  validTo: string | null
}

export type CustomTariffsFilters = {
  sku?: string
  page?: number
  pageSize?: number
}

export type CustomTariffsPageResult = {
  specialPrices: CustomTariffLineView[]
  groupOffers: GroupOfferView[]
  total: number
  page: number
  pageSize: number
}
