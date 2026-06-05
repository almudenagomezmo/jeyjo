import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockSupabase = {
  from: (table: string) => {
    if (table === 'storefront_sessions') {
      return {
        select: () => ({
          gte: () => ({
            lte: async () => ({ count: 20, error: null }),
          }),
        }),
      }
    }
    if (table === 'storefront_cart_activity') {
      return {
        select: () => ({
          gt: () => ({
            gte: async () => ({ count: 2, error: null }),
          }),
        }),
      }
    }
    if (table === 'erp_sync_runs') {
      return {
        select: () => ({
          gte: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      }
    }
    if (table === 'audit_log') {
      return {
        select: () => ({
          eq: () => ({
            gte: () => ({
              order: () => ({
                limit: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }
    }
    if (table === 'customers') {
      return {
        select: () => ({
          is: async () => ({ count: 0, error: null }),
        }),
      }
    }
    return {
      select: () => ({
        is: async () => ({ count: 0, error: null }),
      }),
    }
  },
}

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: () => mockSupabase,
}))

describe('dashboard summary integration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns summary with conversion when sessions and orders exist', async () => {
    const { buildDashboardSummary } = await import('@/lib/dashboard/build-summary')

    const summary = await buildDashboardSummary({
      payload: {
        find: async ({ collection, where }: { collection: string; where?: { and?: unknown[] } }) => {
          if (collection === 'orders') {
            const hasEvaFilter = JSON.stringify(where ?? {}).includes('eva')
            if (hasEvaFilter) {
              return {
                docs: [
                  {
                    id: 99,
                    orderNumber: 'EVA-2026-0015',
                    origin: 'eva',
                    validatedEva: false,
                    jeyjoStatus: 'pending_confirmation',
                  },
                ],
              }
            }
            return {
              docs: [
                {
                  id: 1,
                  orderNumber: 'WEB-001',
                  amount: 100,
                  createdAt: new Date().toISOString(),
                  jeyjoStatus: 'confirmed',
                  paymentStatus: 'paid',
                  origin: 'b2c',
                  guestEmail: 'guest@test.com',
                  orderLineSnapshots: [{ skuErp: 'REF-001', qty: 2 }],
                },
              ],
              totalDocs: 1,
            }
          }
          if (collection === 'products') {
            return { docs: [{ id: 10, skuErp: 'REF-001', title: 'Producto', erpStock: 2 }] }
          }
          return { docs: [] }
        },
      } as never,
      user: { staffRoles: ['superadmin'] },
      period: 'today',
    })

    expect(summary.conversion.uniqueVisitors).toBe(20)
    expect(summary.conversion.completedOrders).toBe(1)
    expect(summary.conversion.rate).toBe(0.05)
    expect(summary.roleScope).toBe('full')
    expect(summary.eva.unresolvedQueries.length).toBe(1)
  })
})
