import { beforeEach, describe, expect, it, vi } from 'vitest'

const searchMock = vi.fn()

vi.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: class MockQdrantClient {
    search = searchMock
  },
}))

import { resetQdrantClientForTests, searchPoints } from '@/lib/qdrant/client'

describe('qdrant client searchPoints', () => {
  beforeEach(() => {
    resetQdrantClientForTests()
    searchMock.mockReset()
    vi.stubEnv('QDRANT_URL', 'http://qdrant.test')
  })

  it('calls Qdrant search with cosine vector and limit', async () => {
    searchMock.mockResolvedValue([
      { id: '1', score: 0.9, payload: { skuErp: 'REF-001' } },
    ])

    const vector = Array.from({ length: 384 }, () => 0.01)
    const hits = await searchPoints('products', vector, { limit: 10 })

    expect(searchMock).toHaveBeenCalledWith('products', {
      vector,
      limit: 10,
      filter: undefined,
    })
    expect(hits[0]?.payload?.skuErp).toBe('REF-001')
  })
})
