export type AppliedPriceRule = 'special_price' | 'group_offer' | 'b2b_discount' | 'p1_retail'

export type ProductPriceBase = {
  sku: string
  p1Price: number
  p2Price: number
  vatRate: number
}

export type CustomerPricingContext = {
  customerId: string
  customerGroup: number
  generalDiscount: number
  erpCode?: string | null
}

export type PricingInput = {
  sku: string
  customerId?: string | null
}

export type PriceQuote = {
  sku: string
  netUnit: number
  grossUnit: number
  vatRate: number
  appliedRule: AppliedPriceRule
  listUnit?: number
  discountPercent?: number
  label?: string
}
