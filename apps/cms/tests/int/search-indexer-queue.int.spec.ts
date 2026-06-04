import { describe, it, expect, vi, beforeEach } from 'vitest'

import { payloadIdToUuid } from '@/lib/entity-uuid'

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

describe('search-indexer searchEvents claim', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('claimSearchEvents marks only pending rows as processing', async () => {
    const pendingId = '11111111-1111-1111-1111-111111111111'
    const claimedRow = {
      id: pendingId,
      entity_type: 'producto',
      entity_id: payloadIdToUuid('producto', 1),
      action: 'upsert',
      payload: {},
      status: 'processing',
      error_message: null,
      created_at: new Date().toISOString(),
      processed_at: null,
    }

    mockFrom.mockImplementation((table: string) => {
      if (table !== 'search_events') {
        throw new Error(`Unexpected table ${table}`)
      }

      return {
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: [claimedRow], error: null }),
            }),
          }),
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              lt: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [{ id: pendingId }], error: null }),
            }),
          }),
        }),
      }
    })

    const { claimSearchEvents } = await import('@/search-indexer/searchEvents')
    const claimed = await claimSearchEvents(10)

    expect(claimed).toHaveLength(1)
    expect(claimed[0]?.id).toBe(pendingId)
  })
})
