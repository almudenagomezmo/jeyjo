import type { ErpGroupOfferDto, ErpSpecialPriceDto } from '../types/pricing-dtos.js'
import type { ErpPageOptions, ErpPageResult } from '../types/pagination.js'

export type ErpPricingReader = {
  listSpecialPrices(customerErpCode: string, options?: ErpPageOptions): Promise<ErpPageResult<ErpSpecialPriceDto>>
  listGroupOffers(options?: ErpPageOptions): Promise<ErpPageResult<ErpGroupOfferDto>>
}
