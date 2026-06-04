import { beforeEach, describe, expect, it } from 'vitest'

import {
  createStubPurchaseHistoryReader,
  setStubSimulateUnavailable,
  resetStubAdapterState,
} from '../src/index.js'

describe('stub ErpPurchaseHistoryReader', () => {
  beforeEach(() => {
    resetStubAdapterState()
    setStubSimulateUnavailable(false)
  })

  it('returns REF-010 with historical 5.00 for B2B-EMPRESA1', async () => {
    const reader = createStubPurchaseHistoryReader()
    const lines = await reader.listLines('B2B-EMPRESA1')
    const ref10 = lines.find((l) => l.sku === 'REF-010')
    expect(ref10).toBeDefined()
    expect(ref10?.historicalUnitPrice).toBe(5)
    expect(ref10?.quantity).toBe(12)
  })

  it('filters by date range', async () => {
    const reader = createStubPurchaseHistoryReader()
    const lines = await reader.listLines('B2B-EMPRESA1', {
      from: '2026-01-01',
      to: '2026-12-31',
    })
    expect(lines.every((l) => l.purchasedAt >= '2026-01-01')).toBe(true)
    expect(lines.some((l) => l.sku === 'REF-002')).toBe(false)
  })

  it('filters by partial SKU', async () => {
    const reader = createStubPurchaseHistoryReader()
    const lines = await reader.listLines('B2B-EMPRESA1', { sku: 'REF-01' })
    expect(lines.every((l) => l.sku.includes('REF-01'))).toBe(true)
  })

  it('returns empty for unknown customer code', async () => {
    const reader = createStubPurchaseHistoryReader()
    await expect(reader.listLines('UNKNOWN')).resolves.toEqual([])
  })
})
