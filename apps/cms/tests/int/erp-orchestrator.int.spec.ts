import type { Payload, PayloadRequest } from 'payload'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  createStubCatalogReader,
  resetStubAdapterState,
  setStubSimulateUnavailable,
} from '@jeyjo/erp-ports'

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

vi.mock('@/erp/registry', () => ({
  getErpAdapters: () => ({
    catalogReader: createStubCatalogReader(),
    catalogWriter: {},
    documentsReader: {},
    pricingReader: {
      listSpecialPrices: vi.fn().mockResolvedValue({ items: [], nextCursor: null, hasMore: false }),
      listGroupOffers: vi.fn().mockResolvedValue({ items: [], nextCursor: null, hasMore: false }),
    },
  }),
}))

import { runCatalogSyncRead } from '@/erp/ErpCatalogSyncOrchestrator'

function mockSupabaseChain(finalData: unknown = { id: 'run-1' }) {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: finalData, error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  }
  return chain
}

describe('ErpCatalogSyncOrchestrator', () => {
  beforeEach(() => {
    resetStubAdapterState()
    setStubSimulateUnavailable(false)
    writeAuditLog.mockClear()
    supabaseFrom.mockImplementation(() => mockSupabaseChain())
  })

  it('runs catalog sync and writes audit log on success', async () => {
    const update = vi.fn().mockResolvedValue({ id: 1 })
    const create = vi.fn().mockResolvedValue({ id: 99 })
    const find = vi.fn().mockImplementation(({ collection, where }) => {
      if (collection === 'products') {
        const sku = where?.skuErp?.equals
        if (sku === '9000000001') {
          return Promise.resolve({ docs: [] })
        }
        return Promise.resolve({
          docs: [{ id: 1, skuErp: sku ?? 'ERP-GRF-001' }],
        })
      }
      if (collection === 'suppliers') {
        return Promise.resolve({ docs: [{ id: 1, erpCode: 'DIST-001' }] })
      }
      return Promise.resolve({ docs: [] })
    })

    const payload = { find, update, create } as unknown as Payload
    const req = { context: {} } as PayloadRequest

    const result = await runCatalogSyncRead({ payload, req, actorName: 'test' })

    expect(result.status).toMatch(/success|partial/)
    expect(result.productsUpdated).toBeGreaterThan(0)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'erp_sync',
        action: 'SYNC_ERP_READ',
      }),
    )
  })

  it('logs error_erp and rethrows on ERP_UNAVAILABLE without mutating via failed read', async () => {
    setStubSimulateUnavailable(true)

    const update = vi.fn()
    const payload = { find: vi.fn(), update, create: vi.fn() } as unknown as Payload

    await expect(runCatalogSyncRead({ payload, actorName: 'test' })).rejects.toMatchObject({
      code: 'ERP_UNAVAILABLE',
    })

    expect(update).not.toHaveBeenCalled()
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ status: 'error_erp' }),
      }),
    )
  })
})
