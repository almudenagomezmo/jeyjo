import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPipeline = vi.fn()

vi.mock('@xenova/transformers', () => ({
  env: { allowLocalModels: false, useBrowserCache: false },
  pipeline: (...args: unknown[]) => mockPipeline(...args),
}))

describe('search-embedding', () => {
  beforeEach(async () => {
    vi.resetModules()
    mockPipeline.mockReset()
  })

  it('returns a 384-dimensional query vector', async () => {
    const vector = new Float32Array(384).fill(0.1)
    mockPipeline.mockResolvedValue(async () => ({ data: vector }))

    const { embedQueryText, EMBEDDING_DIMENSION } = await import('../src/index')
    const result = await embedQueryText('boligrafo')

    expect(result).toHaveLength(EMBEDDING_DIMENSION)
    expect(mockPipeline).toHaveBeenCalledWith('feature-extraction', 'Xenova/multilingual-e5-small')
  })
})
