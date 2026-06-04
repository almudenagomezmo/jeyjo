import { describe, it, expect, beforeEach } from 'vitest'

import {
  StockIntegrationError,
  createStubDistrisantiagoReader,
  createStubArnoiaReader,
  resetStubDistrisantiagoStore,
  resetStubArnoiaStore,
  resetStubStockOutageState,
  setStubStockSimulateUnavailable,
} from '../src/index.js'

describe('stub stock readers', () => {
  beforeEach(() => {
    resetStubStockOutageState()
    resetStubDistrisantiagoStore()
    resetStubArnoiaStore()
  })

  it('lists at least three distinct wholesale refs from Distrisantiago', async () => {
    const reader = createStubDistrisantiagoReader()
    const page = await reader.listStockSnapshots()
    const refs = new Set(page.items.map((r) => r.wholesaleRef))
    expect(refs.size).toBeGreaterThanOrEqual(3)
    for (const row of page.items) {
      expect(row.sourceId).toBe('distrisantiago')
      expect(row.quantity).toBeGreaterThanOrEqual(0)
    }
  })

  it('returns null for unknown ref', async () => {
    const reader = createStubDistrisantiagoReader()
    await expect(reader.getStockByRef('UNKNOWN-REF')).resolves.toBeNull()
  })

  it('Arnoia returns independent quantities for same wholesale ref', async () => {
    const distri = createStubDistrisantiagoReader()
    const arnoia = createStubArnoiaReader()
    const d = await distri.getStockByRef('WH-REF-001')
    const a = await arnoia.getStockByRef('WH-REF-001')
    expect(d?.quantity).toBe(0)
    expect(a?.quantity).toBe(50)
  })

  it('simulates STOCK_UNAVAILABLE per source independently', async () => {
    const distri = createStubDistrisantiagoReader()
    const arnoia = createStubArnoiaReader()
    setStubStockSimulateUnavailable('distrisantiago', true)
    await expect(distri.listStockSnapshots()).rejects.toBeInstanceOf(StockIntegrationError)
    const page = await arnoia.listStockSnapshots()
    expect(page.items.length).toBeGreaterThan(0)
  })
})
