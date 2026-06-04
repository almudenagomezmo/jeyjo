import { describe, it, expect } from 'vitest'

import { resolveStockIndicator } from '../src/semaphore/resolve-stock-indicator.js'

describe('resolveStockIndicator (RF-005)', () => {
  it('returns available when ERP has stock and threshold is 5', () => {
    const result = resolveStockIndicator({
      erpStock: 100,
      distrisantiagoStock: null,
      arnoiaStock: null,
      threshold: 5,
    })
    expect(result.level).toBe('available')
    expect(result.label).toBe('Disponible')
  })

  it('returns low for CA-ERP-001 REF-002 scenario (ERP=2, wholesale higher)', () => {
    const result = resolveStockIndicator({
      erpStock: 2,
      distrisantiagoStock: 100,
      arnoiaStock: 0,
      threshold: 5,
    })
    expect(result.level).toBe('low')
    expect(result.label).toBe('Últimas unidades')
  })

  it('returns limited when all sources are null', () => {
    const result = resolveStockIndicator({
      erpStock: null,
      distrisantiagoStock: null,
      arnoiaStock: null,
    })
    expect(result.level).toBe('limited')
  })

  it('returns limited when all explicit zeros', () => {
    const result = resolveStockIndicator({
      erpStock: 0,
      distrisantiagoStock: 0,
      arnoiaStock: 0,
    })
    expect(result.level).toBe('limited')
  })

  it('applies custom threshold', () => {
    const result = resolveStockIndicator({
      erpStock: 8,
      threshold: 10,
    })
    expect(result.level).toBe('low')
  })

  it('sets isStale when a source failed', () => {
    const result = resolveStockIndicator({
      erpStock: 50,
      staleDistrisantiago: true,
    })
    expect(result.isStale).toBe(true)
  })
})
