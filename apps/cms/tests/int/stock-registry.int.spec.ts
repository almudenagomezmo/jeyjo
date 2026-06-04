import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
  getStockSourceReaders,
  resetStockAdapterCache,
  resolveStockDistriAdapterKind,
} from '@/stock/registry'
import { StockIntegrationError } from '@jeyjo/stock-ports'

describe('stock adapter registry', () => {
  const prevDistri = process.env.STOCK_DISTRI_ADAPTER
  const prevArnoia = process.env.STOCK_ARNOIA_ADAPTER
  beforeEach(() => {
    resetStockAdapterCache()
    vi.stubEnv('NODE_ENV', 'development')
    delete process.env.STOCK_DISTRI_ADAPTER
    delete process.env.STOCK_ARNOIA_ADAPTER
  })

  afterEach(() => {
    resetStockAdapterCache()
    vi.unstubAllEnvs()
    if (prevDistri === undefined) delete process.env.STOCK_DISTRI_ADAPTER
    else process.env.STOCK_DISTRI_ADAPTER = prevDistri
    if (prevArnoia === undefined) delete process.env.STOCK_ARNOIA_ADAPTER
    else process.env.STOCK_ARNOIA_ADAPTER = prevArnoia
  })

  it('defaults to stub readers in development', () => {
    expect(resolveStockDistriAdapterKind()).toBe('stub')
    const readers = getStockSourceReaders()
    expect(readers.distrisantiago.sourceId).toBe('distrisantiago')
    expect(readers.arnoia.sourceId).toBe('arnoia')
  })

  it('fails fast for ftp adapter', () => {
    process.env.STOCK_DISTRI_ADAPTER = 'ftp'
    process.env.STOCK_ARNOIA_ADAPTER = 'stub'
    resetStockAdapterCache()
    expect(() => getStockSourceReaders()).toThrow(StockIntegrationError)
  })
})
