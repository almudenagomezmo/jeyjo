/** Normalized special price from ERP. */
export type ErpSpecialPriceDto = {
  customerErpCode: string
  skuErp: string
  netPrice: number
  validFrom: string
  validTo?: string | null
}

/** Normalized group offer from ERP. */
export type ErpGroupOfferDto = {
  skuErp: string
  offerNetPrice: number
  customerGroup?: number | null
  validFrom: string
  validTo?: string | null
  active: boolean
}
