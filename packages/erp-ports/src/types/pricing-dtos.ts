/** Normalized special price from ERP. */
export type ErpSpecialPriceDto = {
  customerErpCode: string
  skuErp: string
  netPrice: number
  validFrom: string
  validTo?: string | null
  /** P2 / recommended sale price for RF-020 display. */
  recommendedNetPrice?: number
  discount1Pct?: number | null
  discount2Pct?: number | null
  minQty?: number | null
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
