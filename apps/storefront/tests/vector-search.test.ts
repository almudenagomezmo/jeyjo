import { beforeEach, describe, expect, it, vi } from 'vitest'

const searchPointsMock = vi.fn()
const embedMock = vi.fn()

vi.mock('@/lib/qdrant/client', () => ({
  searchPoints: (...args: unknown[]) => searchPointsMock(...args),
}))

vi.mock('@/lib/search/embedding-cache', () => ({
  getCachedQueryEmbedding: (...args: unknown[]) => embedMock(...args),
}))

import { vectorSearchProductSkus } from '@/lib/search/vector-search'

describe('vectorSearchProductSkus', () => {
  beforeEach(() => {
    searchPointsMock.mockReset()
    embedMock.mockReset()
    embedMock.mockResolvedValue(Array.from({ length: 384 }, () => 0.1))
  })

  it('returns ordered sku list from mocked Qdrant hits', async () => {
    searchPointsMock.mockResolvedValue([
      { id: 'a', score: 0.95, payload: { skuErp: 'SKU-A' } },
      { id: 'b', score: 0.8, payload: { skuErp: 'SKU-B' } },
      { id: 'c', score: 0.5, payload: { payloadOnly: true } },
    ])

    const hits = await vectorSearchProductSkus('boligrafo', { limit: 5 })

    expect(hits.map((h) => h.sku)).toEqual(['SKU-A', 'SKU-B'])
    expect(searchPointsMock).toHaveBeenCalledWith(
      'products',
      expect.any(Array),
      { limit: 5 },
    )
  })

  it('returns empty for short queries', async () => {
    const hits = await vectorSearchProductSkus('ab')
    expect(hits).toEqual([])
    expect(searchPointsMock).not.toHaveBeenCalled()
  })
})
