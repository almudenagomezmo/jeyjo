import type { ErpPricingReader } from '../../ports/pricing-reader.js'
import type { ErpPageOptions, ErpPageResult } from '../../types/pagination.js'
import type { ErpGroupOfferDto, ErpSpecialPriceDto } from '../../types/pricing-dtos.js'
import { getStubSimulateUnavailable } from './store.js'
import { ErpIntegrationError } from '../../errors.js'
import { STUB_GROUP_OFFERS, STUB_SPECIAL_PRICES } from './pricing-data.js'

function pageResult<T>(items: T[], options?: ErpPageOptions): ErpPageResult<T> {
  const limit = options?.limit ?? items.length
  const slice = items.slice(0, limit)
  return { items: slice, nextCursor: null, hasMore: slice.length < items.length }
}

export function createStubPricingReader(): ErpPricingReader {
  return {
    async listSpecialPrices(customerErpCode, options) {
      if (getStubSimulateUnavailable()) {
        throw new ErpIntegrationError('ERP_UNAVAILABLE', 'Stub ERP pricing unavailable')
      }
      const filtered = STUB_SPECIAL_PRICES.filter((s) => s.customerErpCode === customerErpCode)
      return pageResult<ErpSpecialPriceDto>(filtered, options)
    },
    async listGroupOffers(options) {
      if (getStubSimulateUnavailable()) {
        throw new ErpIntegrationError('ERP_UNAVAILABLE', 'Stub ERP pricing unavailable')
      }
      const active = STUB_GROUP_OFFERS.filter((o) => o.active)
      return pageResult<ErpGroupOfferDto>(active, options)
    },
  }
}
