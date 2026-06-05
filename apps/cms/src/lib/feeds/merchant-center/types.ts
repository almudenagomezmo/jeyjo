export type MerchantFeedAvailability = 'in_stock' | 'out_of_stock' | 'preorder'

export type MerchantFeedRow = {
  id: string
  title: string
  description: string
  link: string
  imageLink: string
  price: string
  availability: MerchantFeedAvailability
  brand?: string
  gtin?: string
}

export type MerchantFeedOmittedCounts = {
  missingImage: number
  missingPrice: number
  missingSku: number
}

export type MerchantFeedBuildResult = {
  rows: MerchantFeedRow[]
  omitted: MerchantFeedOmittedCounts
  xml: string
}
