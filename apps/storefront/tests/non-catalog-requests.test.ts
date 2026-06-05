import { describe, expect, it } from 'vitest'

import {
  formatNonCatalogBlock,
  mergeObservationsWithNonCatalog,
} from '@/lib/intranet/non-catalog-requests'

describe('non-catalog requests', () => {
  it('formats block with notes', () => {
    const block = formatNonCatalogBlock([
      { reference: 'ABC-1', note: 'Urgente', createdAt: '2026-01-01' },
      { reference: 'ABC-2', note: '', createdAt: '2026-01-02' },
    ])
    expect(block).toContain('Referencias no catalogadas:')
    expect(block).toContain('ABC-1: Urgente')
    expect(block).toContain('- ABC-2')
  })

  it('merges with user notes under limit', () => {
    const { text, truncated } = mergeObservationsWithNonCatalog('Pedido mensual', [
      { reference: 'X-1', note: '', createdAt: '' },
    ])
    expect(text).toContain('Pedido mensual')
    expect(text).toContain('X-1')
    expect(truncated).toBe(false)
  })

  it('truncates when over 500 chars', () => {
    const long = 'x'.repeat(480)
    const { text, truncated } = mergeObservationsWithNonCatalog(long, [
      { reference: 'Y-1', note: 'nota larga', createdAt: '' },
    ])
    expect(text.length).toBe(500)
    expect(truncated).toBe(true)
  })
})
