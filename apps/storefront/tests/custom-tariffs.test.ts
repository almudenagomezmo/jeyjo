import { describe, expect, it } from 'vitest'

import { deriveDiscount1Pct, mapSpecialPriceRow } from '@/lib/intranet/custom-tariffs/map-line'
import { resolveTariffValidity, todayInMadrid } from '@/lib/intranet/custom-tariffs/validity'
import { filterNonWildcardLines } from '@/lib/intranet/purchase-history/wildcard'

describe('custom tariffs validity', () => {
  it('marks expired when validTo is before today in Madrid', () => {
    const today = todayInMadrid()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const result = resolveTariffValidity('2025-12-31')
    expect(result.status).toBe('expired')
    expect(result.statusLabel).toBe('Caducado')
  })

  it('marks active when validTo is in the future', () => {
    const result = resolveTariffValidity('2099-12-31')
    expect(result.status).toBe('active')
    expect(result.statusLabel).toBe('Vigente')
  })
})

describe('custom tariffs map line', () => {
  it('derives discount when ERP omits discount1Pct', () => {
    const { discount1Pct, derived } = deriveDiscount1Pct(10, 8.5, null)
    expect(derived).toBe(true)
    expect(discount1Pct).toBe(15)
  })

  it('uses ERP discount when provided', () => {
    const { discount1Pct, derived } = deriveDiscount1Pct(10, 5, 37.5)
    expect(derived).toBe(false)
    expect(discount1Pct).toBe(37.5)
  })

  it('sets canRequestReview only for expired rows', () => {
    const active = mapSpecialPriceRow(
      {
        customerErpCode: 'B2B-EMPRESA2',
        skuErp: 'REF-004',
        netPrice: 5,
        validFrom: '2026-01-01',
        validTo: '2099-12-31',
      },
      undefined,
    )
    const expired = mapSpecialPriceRow(
      {
        customerErpCode: 'B2B-EMPRESA2',
        skuErp: 'REF-002',
        netPrice: 8.5,
        validFrom: '2025-01-01',
        validTo: '2025-12-31',
      },
      undefined,
    )
    expect(active.canRequestReview).toBe(false)
    expect(expired.canRequestReview).toBe(true)
  })
})

describe('custom tariffs wildcard', () => {
  it('omits wildcard SKU from filtered set', () => {
    const filtered = filterNonWildcardLines([
      { sku: 'REF-004' },
      { sku: '9000000001' },
    ])
    expect(filtered.map((x) => x.sku)).toEqual(['REF-004'])
  })
})
