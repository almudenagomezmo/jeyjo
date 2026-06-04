import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'

const getProductPriceBase = vi.fn()
const resolvePrice = vi.fn()
const getStorefrontPricingRepository = vi.fn()

vi.mock('@/lib/pricing/product-catalog', () => ({
  getProductPriceBase: (...args: unknown[]) => getProductPriceBase(...args),
}))

vi.mock('@jeyjo/pricing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@jeyjo/pricing')>()
  return {
    ...actual,
    resolvePrice: (...args: unknown[]) => resolvePrice(...args),
  }
})

vi.mock('@/lib/pricing/repository', () => ({
  getStorefrontPricingRepository: () => getStorefrontPricingRepository(),
}))

describe('resolvePriceQuotesBatch', () => {
  beforeEach(() => {
    getProductPriceBase.mockReset()
    resolvePrice.mockReset()
    getStorefrontPricingRepository.mockReturnValue({})
  })

  it('returns P1 quotes for anonymous batch without P2 leak', async () => {
    getProductPriceBase.mockResolvedValue({
      sku: 'REF-001',
      p1Price: 1,
      p2Price: 0.9,
      vatRate: 21,
    })
    resolvePrice.mockResolvedValue({
      sku: 'REF-001',
      netUnit: 1,
      grossUnit: 1.21,
      vatRate: 21,
      appliedRule: 'p1_retail',
    })

    const out = await resolvePriceQuotesBatch(['REF-001'])
    expect(out['REF-001']?.appliedRule).toBe('p1_retail')
    expect(out['REF-001']?.netUnit).toBe(1)
  })

  it('omits unknown SKU', async () => {
    getProductPriceBase.mockResolvedValue(null)
    const out = await resolvePriceQuotesBatch(['MISSING'])
    expect(out['MISSING']).toBeUndefined()
  })
})
