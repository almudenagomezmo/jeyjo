import { beforeEach, describe, expect, it, vi } from 'vitest'

const searchPointsMock = vi.fn()
const embedMock = vi.fn()
const hydrateMock = vi.fn()

vi.mock('@/lib/qdrant/client', () => ({
  searchPoints: (...args: unknown[]) => searchPointsMock(...args),
}))

vi.mock('@/lib/search/embedding-cache', () => ({
  getCachedQueryEmbedding: (...args: unknown[]) => embedMock(...args),
}))

vi.mock('@/lib/search/hydrate-suggest', () => ({
  hydrateSuggestProducts: (...args: unknown[]) => hydrateMock(...args),
  mapCategoryHits: (cats: Array<{ slug: string; label: string }>) =>
    cats.map((c) => ({ ...c, href: `/c/${c.slug}` })),
}))

vi.mock('@/lib/search/search-flags', () => ({
  isQdrantConfigured: () => true,
}))

import { POST } from '@/app/api/search/suggest/route'
import { runSuggestSearch } from '@/lib/search/run-suggest-search'

describe('POST /api/search/suggest', () => {
  beforeEach(() => {
    searchPointsMock.mockReset()
    embedMock.mockReset()
    hydrateMock.mockReset()
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('QDRANT_URL', 'http://qdrant.test')
    embedMock.mockResolvedValue(Array.from({ length: 384 }, () => 0.1))
    searchPointsMock.mockResolvedValue([])
    hydrateMock.mockResolvedValue([])
  })

  it('returns 400 when query is shorter than 3 characters', async () => {
    const res = await POST(
      new Request('http://localhost/api/search/suggest', {
        method: 'POST',
        body: JSON.stringify({ q: 'ab' }),
      }),
    )
    expect(res.status).toBe(400)
    expect(embedMock).not.toHaveBeenCalled()
  })

  it('returns JSON with products array for valid query', async () => {
    searchPointsMock.mockImplementation(async (collection: string) => {
      if (collection === 'products') {
        return [{ id: '1', score: 0.9, payload: { skuErp: 'REF-001' } }]
      }
      return []
    })
    hydrateMock.mockResolvedValue([
      { sku: 'REF-001', title: 'Pen', slug: 'pen', href: '/p/pen' },
    ])

    const res = await POST(
      new Request('http://localhost/api/search/suggest', {
        method: 'POST',
        body: JSON.stringify({ q: 'boli' }),
      }),
    )

    expect(res.status).toBe(200)
    const json = (await res.json()) as { products: unknown[] }
    expect(json.products).toHaveLength(1)
  })

  it('returns 503 in production when search throws', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    embedMock.mockRejectedValue(new Error('Qdrant down'))

    const res = await POST(
      new Request('http://localhost/api/search/suggest', {
        method: 'POST',
        body: JSON.stringify({ q: 'boligrafo' }),
      }),
    )

    expect(res.status).toBe(503)
    const json = (await res.json()) as { error: string; fallback: boolean }
    expect(json.error).toBe('Search unavailable')
    expect(json.fallback).toBe(false)
  })
})

describe('runSuggestSearch', () => {
  beforeEach(() => {
    searchPointsMock.mockReset()
    embedMock.mockReset()
    hydrateMock.mockReset()
    embedMock.mockResolvedValue(Array.from({ length: 384 }, () => 0.1))
    hydrateMock.mockResolvedValue([])
  })

  it('queries products and categories collections', async () => {
    searchPointsMock.mockResolvedValue([])

    await runSuggestSearch('boligrafo')

    expect(searchPointsMock).toHaveBeenCalledWith('products', expect.any(Array), { limit: 10 })
    expect(searchPointsMock).toHaveBeenCalledWith('categories', expect.any(Array), { limit: 4 })
  })
})
