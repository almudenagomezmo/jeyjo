import type { ErpGroupOfferDto, ErpSpecialPriceDto } from '../../types/pricing-dtos.js'

export const STUB_SPECIAL_PRICES: ErpSpecialPriceDto[] = [
  {
    customerErpCode: 'B2B-EMPRESA2',
    skuErp: 'REF-004',
    netPrice: 5,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
]

export const STUB_GROUP_OFFERS: ErpGroupOfferDto[] = [
  {
    skuErp: 'REF-003',
    offerNetPrice: 8,
    validFrom: '2026-01-01',
    validTo: '2099-12-31',
    active: true,
  },
]
