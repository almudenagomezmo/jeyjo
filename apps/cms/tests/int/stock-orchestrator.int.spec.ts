import type { Payload, PayloadRequest } from 'payload'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  resetStubStockOutageState,
  resetStubDistrisantiagoStore,
  resetStubArnoiaStore,
  setStubStockSimulateUnavailable,
} from '@jeyjo/stock-ports'

const { writeAuditLog, supabaseFrom } = vi.hoisted(() => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
  supabaseFrom: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: () => ({
    from: supabaseFrom,
  }),
  writeAuditLog,
}))

import { resetStockAdapterCache } from '@/stock/registry'
import { runStockSync } from '@/stock/StockSyncOrchestrator'

function mockSupabaseChain(finalData: unknown = { id: 'stock-run-1' }) {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: finalData, error: null }),
  }
  return chain
}

describe('StockSyncOrchestrator', () => {
  beforeEach(() => {
    resetStockAdapterCache()
    resetStubStockOutageState()
    resetStubDistrisantiagoStore()
    resetStubArnoiaStore()
    writeAuditLog.mockClear()
    supabaseFrom.mockImplementation(() => mockSupabaseChain())
    process.env.STOCK_DISTRI_ADAPTER = 'stub'
    process.env.STOCK_ARNOIA_ADAPTER = 'stub'
  })

  it('updates wholesale fields and indicators for matched products', async () => {
    const update = vi.fn().mockResolvedValue({ id: 1 })
    const find = vi.fn().mockImplementation(({ collection, where, page }) => {
      if (collection === 'products') {
        if (where?.skuErp?.equals === 'REF-001') {
          return Promise.resolve({
            docs: [
              {
                id: 1,
                skuErp: 'REF-001',
                mainWholesaleRef: 'WH-REF-001',
                erpStock: 100,
              },
            ],
          })
        }
        if (where?.skuErp?.exists) {
          return Promise.resolve({
            docs: [
              {
                id: 1,
                skuErp: 'REF-001',
                mainWholesaleRef: 'WH-REF-001',
                erpStock: 100,
                distrisantiagoStock: 0,
                arnoiaStock: 50,
              },
            ],
            hasNextPage: false,
            page: page ?? 1,
          })
        }
      }
      return Promise.resolve({ docs: [], hasNextPage: false })
    })

    const payload = { find, update } as unknown as Payload
    const req = { context: {} } as PayloadRequest

    const result = await runStockSync({ payload, req, actorName: 'test' })

    expect(result.status).toMatch(/success|partial/)
    expect(result.productsUpdated).toBeGreaterThan(0)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          distrisantiagoStock: 0,
          arnoiaStock: 50,
        }),
        req: expect.objectContaining({
          context: expect.objectContaining({ stockSync: true }),
        }),
      }),
    )
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'stock_sync',
        action: 'SYNC_STOCK_READ',
      }),
    )
  })

  it('marks partial and preserves distri stock on Distrisantiago outage (RNF-007)', async () => {
    setStubStockSimulateUnavailable('distrisantiago', true)

    const update = vi.fn().mockResolvedValue({ id: 1 })
    const find = vi.fn().mockImplementation(({ collection, where }) => {
      if (collection === 'products' && where?.skuErp?.exists) {
        return Promise.resolve({
          docs: [
            {
              id: 1,
              skuErp: 'REF-001',
              mainWholesaleRef: 'WH-REF-001',
              erpStock: 100,
              distrisantiagoStock: 77,
              arnoiaStock: null,
            },
          ],
          hasNextPage: false,
        })
      }
      return Promise.resolve({ docs: [], hasNextPage: false })
    })

    const payload = { find, update } as unknown as Payload
    const req = { context: {} } as PayloadRequest
    const result = await runStockSync({ payload, req, actorName: 'test' })

    expect(result.status).toBe('partial')
    expect(result.distrisantiagoStatus).toBe('failed')
    expect(result.arnoiaStatus).toBe('success')
    const distriUpdates = update.mock.calls.filter(
      (call) => 'distrisantiagoStock' in (call[0]?.data ?? {}),
    )
    expect(distriUpdates).toHaveLength(0)
  })
})
