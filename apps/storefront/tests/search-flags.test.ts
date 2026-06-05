import { describe, expect, it, vi, beforeEach } from 'vitest'

const getSearchConfig = vi.fn()

vi.mock('@/lib/system-config/fetch', () => ({
  getSearchConfig,
}))

describe('search flags', () => {
  beforeEach(() => {
    vi.resetModules()
    getSearchConfig.mockReset()
    delete process.env.PREDICTIVE_SEARCH_ENABLED
    delete process.env.QDRANT_URL
  })

  it('isPredictiveSearchEnabled respects CMS toggle', async () => {
    process.env.QDRANT_URL = 'http://qdrant.test'
    getSearchConfig.mockResolvedValue({
      predictiveEnabled: false,
      suggestLimit: 8,
      minQueryLength: 2,
    })

    const { isPredictiveSearchEnabled } = await import('@/lib/search/search-flags')
    await expect(isPredictiveSearchEnabled()).resolves.toBe(false)
  })

  it('isPredictiveSearchEnabled false without Qdrant', async () => {
    getSearchConfig.mockResolvedValue({
      predictiveEnabled: true,
      suggestLimit: 8,
      minQueryLength: 2,
    })

    const { isPredictiveSearchEnabled } = await import('@/lib/search/search-flags')
    await expect(isPredictiveSearchEnabled()).resolves.toBe(false)
  })
})
