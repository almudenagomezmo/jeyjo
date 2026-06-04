import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}))

import { getStockIndicator } from '@/lib/stock/get-stock-indicator'

vi.mock('@/lib/catalog/fetch-product-by-sku', () => ({
  fetchProductBySkuFromCms: vi.fn(),
}))

import { fetchProductBySkuFromCms } from '@/lib/catalog/fetch-product-by-sku'

describe('getStockIndicator', () => {
  beforeEach(() => {
    vi.mocked(fetchProductBySkuFromCms).mockReset()
  })

  it('returns indicator without numeric fields for published product', async () => {
    vi.mocked(fetchProductBySkuFromCms).mockResolvedValue({
      skuErp: 'REF-001',
      _status: 'published',
      isWildcard: false,
      stockIndicator: 'available',
      allowOrderWithoutStock: false,
      syncDistrisantiagoAt: new Date().toISOString(),
      syncArnoiaAt: new Date().toISOString(),
    })

    const result = await getStockIndicator('REF-001')
    expect(result).toEqual({
      level: 'available',
      label: 'Disponible',
      isStale: false,
      allowOrderWithoutStock: false,
    })
    expect(result).not.toHaveProperty('erpStock')
    expect(result).not.toHaveProperty('distrisantiagoStock')
  })

  it('returns null for wildcard SKU', async () => {
    vi.mocked(fetchProductBySkuFromCms).mockResolvedValue({
      skuErp: '9000000001',
      _status: 'published',
      isWildcard: true,
      stockIndicator: 'available',
    })

    expect(await getStockIndicator('9000000001')).toBeNull()
  })

  it('returns null for draft product', async () => {
    vi.mocked(fetchProductBySkuFromCms).mockResolvedValue({
      skuErp: 'REF-001',
      _status: 'draft',
      isWildcard: false,
    })

    expect(await getStockIndicator('REF-001')).toBeNull()
  })
})
