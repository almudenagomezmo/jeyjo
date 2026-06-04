import { describe, it, expect, vi, beforeEach } from 'vitest'

import { EMBEDDING_DIMENSION, embedDocumentText, resetEmbeddingSingletonForTests } from '@/search-indexer/embedding'

const mockPipeline = vi.fn()

vi.mock('@xenova/transformers', () => ({
  env: {
    allowLocalModels: false,
    useBrowserCache: false,
  },
  pipeline: (...args: unknown[]) => mockPipeline(...args),
}))

describe('search-indexer embedding', () => {
  beforeEach(() => {
    resetEmbeddingSingletonForTests()
    mockPipeline.mockReset()
  })

  it('returns a 384-dimensional vector', async () => {
    const vector = new Float32Array(EMBEDDING_DIMENSION).fill(0.1)
    mockPipeline.mockResolvedValue(async () => ({
      data: vector,
    }))

    const result = await embedDocumentText('Grifo monomando REF-001')

    expect(result).toHaveLength(384)
    expect(mockPipeline).toHaveBeenCalledWith('feature-extraction', 'Xenova/multilingual-e5-small')
  })

  it('fails fast when embedding dimension mismatches collection config', async () => {
    mockPipeline.mockResolvedValue(async () => ({
      data: new Float32Array(128).fill(0.1),
    }))

    await expect(embedDocumentText('invalid dimension')).rejects.toThrow(/Expected embedding dimension 384/)
  })
})

describe('search-indexer indexText', () => {
  it('includes skuErp and ean in product index string', async () => {
    const { buildIndexText } = await import('@/search-indexer/indexText')

    const text = buildIndexText('producto', {
      title: 'Grifo',
      skuErp: 'REF-001',
      ean: '8412345678901',
    })

    expect(text).toContain('REF-001')
    expect(text).toContain('8412345678901')
    expect(text).toContain('Grifo')
  })
})

describe('search-indexer payload mappers', () => {
  it('maps product payload with ERP references', async () => {
    const { mapProductQdrantPayload } = await import('@/search-indexer/payloadMappers')

    const payload = mapProductQdrantPayload(
      {
        title: 'Grifo',
        slug: 'grifo',
        skuErp: 'REF-001',
        ean: '8412345678901',
        _status: 'published',
      },
      42,
    )

    expect(payload.entityType).toBe('producto')
    expect(payload.payloadId).toBe(42)
    expect(payload.skuErp).toBe('REF-001')
    expect(payload.ean).toBe('8412345678901')
    expect(payload.isPublished).toBe(true)
  })
})
