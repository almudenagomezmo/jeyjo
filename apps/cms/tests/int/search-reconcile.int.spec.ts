import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()

vi.mock('@/lib/supabase-server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabase-server')>()
  return {
    ...actual,
    getSupabaseServerClient: () => ({
      from: mockFrom,
    }),
  }
})

describe('search queue stats', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('returns counts and oldest pending age', async () => {
    const createdAt = new Date(Date.now() - 120_000).toISOString()

    mockFrom.mockImplementation((table: string) => {
      if (table !== 'search_events') throw new Error(`Unexpected table ${table}`)

      return {
        select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.head) {
            return {
              eq: vi.fn().mockImplementation((field: string, value: string) => {
                const counts: Record<string, number> = {
                  pending: 3,
                  processing: 1,
                  error: 2,
                }
                return Promise.resolve({ count: counts[value] ?? 0, error: null })
              }),
            }
          }

          return {
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { created_at: createdAt }, error: null }),
                }),
              }),
            }),
          }
        }),
      }
    })

    const { getSearchQueueStats } = await import('@/search-indexer/queueStats')
    const stats = await getSearchQueueStats()

    expect(stats.pending).toBe(3)
    expect(stats.processing).toBe(1)
    expect(stats.error).toBe(2)
    expect(stats.oldestPendingAgeSec).toBeGreaterThanOrEqual(119)
  })
})

describe('hasActiveSearchEvent', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('returns true when pending or processing exists', async () => {
    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ count: 1, error: null }),
          }),
        }),
      }),
    }))

    const { hasActiveSearchEvent } = await import('@/search-indexer/searchEvents')
    await expect(hasActiveSearchEvent('producto', 42)).resolves.toBe(true)
  })
})

describe('resetRecentErrorEventsForReconcile', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('resets recent error rows under reconcile attempt cap', async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'err-1',
                payload: {},
                status: 'error',
              },
            ],
            error: null,
          }),
        }),
      }),
      update,
    }))

    const { resetRecentErrorEventsForReconcile } = await import('@/search-indexer/searchEvents')
    const reset = await resetRecentErrorEventsForReconcile(24)

    expect(reset).toBe(1)
    expect(update).toHaveBeenCalled()
  })
})
