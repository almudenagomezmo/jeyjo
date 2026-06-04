import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getProductPriceBase } from '@/lib/pricing/product-catalog'

const fetchPublic = vi.fn()

vi.mock('@/lib/catalog/fetch-product-by-sku', () => ({
  fetchPublicProductBySkuFromCms: (...args: unknown[]) => fetchPublic(...args),
}))

describe('getProductPriceBase', () => {
  beforeEach(() => {
    fetchPublic.mockReset()
  })

  it('returns price base from CMS product', async () => {
    fetchPublic.mockResolvedValue({
      skuErp: 'REF-001',
      p1Price: 1,
      p2Price: 0.9,
      vatRate: 21,
      _status: 'published',
      isWildcard: false,
    })

    const base = await getProductPriceBase('REF-001')
    expect(base).toEqual({
      sku: 'REF-001',
      p1Price: 1,
      p2Price: 0.9,
      vatRate: 21,
    })
  })

  it('returns null for wildcard SKU', async () => {
    fetchPublic.mockResolvedValue(null)
    expect(await getProductPriceBase('9000000001')).toBeNull()
  })
})
