import type { Payload } from 'payload'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const { dispatchProfileNotification, supabaseFrom } = vi.hoisted(() => ({
  dispatchProfileNotification: vi.fn().mockResolvedValue({ created: 1, emailsSent: 0 }),
  supabaseFrom: vi.fn(),
}))

vi.mock('@/lib/notifications/dispatch-profile', () => ({
  dispatchProfileNotification,
}))

vi.mock('@/lib/notifications/env', () => ({
  isWishlistStockAlertsEnabled: () => true,
}))

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: () => ({
    from: supabaseFrom,
  }),
}))

import { processWishlistStockAlerts } from '@/lib/notifications/wishlist-stock-alerts'

const payload = {
  logger: { warn: vi.fn(), error: vi.fn() },
} as unknown as Payload

function mockWatchQuery(watches: { id: string; web_profile_id: string; sku: string }[]) {
  supabaseFrom.mockImplementation((table: string) => {
    if (table === 'stock_watches') {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(function (this: typeof chain, ...args: unknown[]) {
          if (args[0] === 'id') {
            return { eq: vi.fn().mockResolvedValue({ error: null }) }
          }
          return Promise.resolve({ data: watches, error: null })
        }),
        update: vi.fn().mockReturnThis(),
      }
      return chain
    }
    if (table === 'web_profiles') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'profile-1', customer_id: 'cust-1', role: 'b2b_superadmin' },
          error: null,
        }),
      }
    }
    return {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
  })
}

describe('processWishlistStockAlerts', () => {
  beforeEach(() => {
    dispatchProfileNotification.mockClear()
    supabaseFrom.mockReset()
  })

  it('dispatches for limited to available transition', async () => {
    mockWatchQuery([{ id: 'w1', web_profile_id: 'profile-1', sku: 'REF-001' }])

    const result = await processWishlistStockAlerts(payload, {
      syncRunId: 'run-1',
      transitions: [
        {
          sku: 'REF-001',
          previousIndicator: 'limited',
          newIndicator: 'available',
          productTitle: 'Bolígrafo',
          slug: 'boligrafo',
          stockLabel: 'Disponible',
        },
      ],
    })

    expect(result.dispatchesAttempted).toBe(1)
    expect(dispatchProfileNotification).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({
        type: 'stock_available',
        idempotencyKey: 'stock:REF-001:profile-1:run-1',
      }),
    )
  })

  it('skips when no alertable transition', async () => {
    const result = await processWishlistStockAlerts(payload, {
      syncRunId: 'run-1',
      transitions: [
        {
          sku: 'REF-002',
          previousIndicator: 'available',
          newIndicator: 'low',
          productTitle: 'Goma',
          slug: 'goma',
          stockLabel: 'Últimas unidades',
        },
      ],
    })

    expect(result.dispatchesAttempted).toBe(0)
    expect(dispatchProfileNotification).not.toHaveBeenCalled()
  })
})
