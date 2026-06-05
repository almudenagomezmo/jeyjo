import type { ErpGroupOfferDto, ErpSpecialPriceDto } from '../../types/pricing-dtos.js'

export const STUB_SPECIAL_PRICES: ErpSpecialPriceDto[] = [
  {
    customerErpCode: 'B2B-EMPRESA2',
    skuErp: 'REF-004',
    netPrice: 5,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    recommendedNetPrice: 8,
    discount1Pct: 37.5,
    discount2Pct: null,
    minQty: null,
  },
  {
    customerErpCode: 'B2B-EMPRESA2',
    skuErp: 'REF-002',
    netPrice: 8.5,
    validFrom: '2025-01-01',
    validTo: '2025-12-31',
    recommendedNetPrice: 10,
    discount1Pct: 15,
    discount2Pct: 0,
    minQty: 6,
  },
]

export const STUB_GROUP_OFFERS: ErpGroupOfferDto[] = [
  {
    skuErp: 'REF-003',
    offerNetPrice: 8,
    customerGroup: 2,
    validFrom: '2026-01-01',
    validTo: '2099-12-31',
    active: true,
  },
]
