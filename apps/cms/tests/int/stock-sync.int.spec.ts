import type { Payload, PayloadRequest } from 'payload'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  resolveStockIndicator,
  resetStubStockOutageState,
  resetStubDistrisantiagoStore,
  resetStubArnoiaStore,
} from '@jeyjo/stock-ports'
import { resetStockAdapterCache } from '@/stock/registry'
import { runStockSync } from '@/stock/StockSyncOrchestrator'

const { writeAuditLog, supabaseFrom } = vi.hoisted(() => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
  supabaseFrom: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: () => null,
  writeAuditLog,
}))

function mockSupabaseChain() {
  return {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'x' }, error: null }),
  }
}

describe('stock-sync integration', () => {
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

  it('full stub run sets wholesale fields and low indicator for REF-002', async () => {
    const products = [
      {
        id: 1,
        skuErp: 'REF-001',
        mainWholesaleRef: 'WH-REF-001',
        erpStock: 100,
      },
      {
        id: 2,
        skuErp: 'REF-002',
        mainWholesaleRef: 'WH-REF-002',
        erpStock: 2,
      },
      {
        id: 3,
        skuErp: 'REF-003',
        mainWholesaleRef: 'WH-REF-003',
        erpStock: 0,
      },
    ]

    const update = vi.fn().mockResolvedValue({})
    const find = vi.fn().mockImplementation(({ collection, where }) => {
      if (collection !== 'products') return Promise.resolve({ docs: [], hasNextPage: false })
      if (where?.skuErp?.equals) {
        const sku = where.skuErp.equals as string
        const doc = products.find((p) => p.skuErp === sku)
        return Promise.resolve({ docs: doc ? [doc] : [] })
      }
      if (where?.skuErp?.exists) {
        return Promise.resolve({ docs: products, hasNextPage: false })
      }
      return Promise.resolve({ docs: [], hasNextPage: false })
    })

    const payload = { find, update } as unknown as Payload
    const req = { context: {} } as PayloadRequest
    await runStockSync({ payload, req, actorName: 'test' })

    const ref2IndicatorUpdate = update.mock.calls.find(
      (call) =>
        call[0]?.id === 2 &&
        call[0]?.data?.stockIndicator === 'low',
    )
    expect(ref2IndicatorUpdate).toBeDefined()

    const ref2WholesaleUpdate = update.mock.calls.find(
      (call) =>
        call[0]?.id === 2 &&
        call[0]?.data?.distrisantiagoStock === 100,
    )
    expect(ref2WholesaleUpdate).toBeDefined()

    expect(
      resolveStockIndicator({
        erpStock: 2,
        distrisantiagoStock: 100,
        arnoiaStock: 0,
        threshold: 5,
      }).level,
    ).toBe('low')
  })
})
