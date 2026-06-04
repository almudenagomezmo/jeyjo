import type { Payload } from 'payload'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  ErpIntegrationError,
  setStubSimulateUnavailable,
  resetStubAdapterState,
} from '@jeyjo/erp-ports'
import { resetErpAdapterCache } from '@/erp/registry'

const { writeAuditLog } = vi.hoisted(() => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: () => null,
  writeAuditLog,
}))

vi.mock('@/stock/recalculateIndicators', () => ({
  recalculateStockIndicatorsForSkus: vi.fn(),
}))

import { recalculateStockIndicatorsForSkus } from '@/stock/recalculateIndicators'
import { runCatalogSyncRead } from '@/erp/ErpCatalogSyncOrchestrator'

describe('catalog sync failure does not recalculate stock', () => {
  const prevAdapter = process.env.ERP_ADAPTER

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('ERP_ADAPTER', 'stub')
    resetErpAdapterCache()
    resetStubAdapterState()
    setStubSimulateUnavailable(false)
    vi.mocked(recalculateStockIndicatorsForSkus).mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    if (prevAdapter === undefined) delete process.env.ERP_ADAPTER
    else process.env.ERP_ADAPTER = prevAdapter
  })

  it('does not invoke indicator recalculation on ERP_UNAVAILABLE', async () => {
    setStubSimulateUnavailable(true)
    const payload = { find: vi.fn(), update: vi.fn(), create: vi.fn() } as unknown as Payload

    await expect(runCatalogSyncRead({ payload, actorName: 'test' })).rejects.toBeInstanceOf(
      ErpIntegrationError,
    )

    expect(recalculateStockIndicatorsForSkus).not.toHaveBeenCalled()
  })
})
