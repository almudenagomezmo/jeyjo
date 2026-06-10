import type { AppliedPriceRule } from '@jeyjo/pricing'

export type TariffValidityStatus = 'active' | 'expired'

export type AppliedTariffView = {
  appliedRule: AppliedPriceRule
  appliedRuleLabel: string
  appliedNetPrice: number
}

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
  appliedTariff: AppliedTariffView
  /** True when the pactado price is the rule used in catalog/checkout. */
  pactPriceAppliesInShop: boolean
}

export type GroupOfferView = {
  sku: string
  productSlug: string | null
  name: string
  imageUrl: string | null
  offerNetPrice: number
  validTo: string | null
  appliedTariff: AppliedTariffView
  /** True when this group offer is the active pricing rule in the shop. */
  appliesInShop: boolean
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
