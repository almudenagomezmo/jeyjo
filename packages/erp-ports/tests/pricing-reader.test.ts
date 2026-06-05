import { describe, it, expect, beforeEach } from 'vitest'

import {
  createStubAdapterBundle,
  createStubPricingReader,
  resetStubAdapterState,
  setStubSimulateUnavailable,
} from '../src/index.js'

describe('stub ErpPricingReader', () => {
  beforeEach(() => {
    resetStubAdapterState()
    setStubSimulateUnavailable(false)
  })

  it('lists special price for REF-004 empresa2', async () => {
    const reader = createStubPricingReader()
    const page = await reader.listSpecialPrices('B2B-EMPRESA2')
    expect(page.items.some((s) => s.skuErp === 'REF-004' && s.netPrice === 5)).toBe(true)
  })

  it('lists expired special price with RF-020 fields for empresa2', async () => {
    const reader = createStubPricingReader()
    const page = await reader.listSpecialPrices('B2B-EMPRESA2')
    const expired = page.items.find((s) => s.skuErp === 'REF-002')
    expect(expired?.validTo).toBe('2025-12-31')
    expect(expired?.recommendedNetPrice).toBe(10)
    expect(expired?.discount1Pct).toBe(15)
  })

  it('lists active group offer for REF-003', async () => {
    const reader = createStubPricingReader()
    const page = await reader.listGroupOffers()
    expect(page.items.some((o) => o.skuErp === 'REF-003' && o.offerNetPrice === 8)).toBe(true)
  })

  it('bundle exposes pricingReader when stub', () => {
    const bundle = createStubAdapterBundle()
    expect(bundle.pricingReader).toBeDefined()
    expect(typeof bundle.pricingReader.listGroupOffers).toBe('function')
  })
})
