import { describe, it, expect, vi, beforeEach } from 'vitest'

const scrollPointBatch = vi.fn()
const deletePoints = vi.fn()

vi.mock('@/lib/qdrant', () => ({
  scrollPointBatch,
  deletePoints,
}))

describe('search orphan cleanup', () => {
  beforeEach(() => {
    scrollPointBatch.mockReset()
    deletePoints.mockReset()
    process.env.ORPHAN_CLEANUP_MAX_DELETES = '10'
  })

  it('deletes orphan product points and keeps valid published products', async () => {
    scrollPointBatch
      .mockResolvedValueOnce({
        points: [
          { id: 'orphan-1', payload: { payloadId: 999 } },
          { id: 'valid-1', payload: { payloadId: 1 } },
        ],
        nextOffset: null,
      })
      .mockResolvedValueOnce({ points: [], nextOffset: null })

    const payload = {
      findByID: vi.fn(async ({ id }: { id: number }) => {
        if (id === 999) throw new Error('Not found')
        return { id: 1, _status: 'published', isWildcard: false }
      }),
    }

    const { runSearchOrphanCleanup } = await import('@/search-indexer/orphanCleanup')
    const result = await runSearchOrphanCleanup(payload as never)

    expect(result.orphansDeleted).toBe(1)
    expect(deletePoints).toHaveBeenCalledWith('products', ['orphan-1'])
  })
})
