import { describe, expect, it } from 'vitest'

import {
  formatUncataloguedNotesBlock,
  mergeCustomerNotesWithUncatalogued,
} from '@/lib/checkout/uncatalogued-requests'

describe('uncatalogued requests', () => {
  it('formats block with requests', () => {
    const block = formatUncataloguedNotesBlock([
      {
        id: '1',
        reference: 'XYZ-9',
        description: 'Tóner compatible',
        qty: 2,
        createdAt: '2026-01-01',
      },
    ])
    expect(block).toContain('[Solicitudes no catalogadas]')
    expect(block).toContain('XYZ-9 x2')
    expect(block).toContain('Tóner compatible')
  })

  it('merges with existing customer notes', () => {
    const merged = mergeCustomerNotesWithUncatalogued('Entrega urgente', [
      {
        id: '1',
        reference: 'ABC',
        description: 'Pieza especial',
        qty: 1,
        createdAt: '2026-01-01',
      },
    ])
    expect(merged).toContain('Entrega urgente')
    expect(merged).toContain('[Solicitudes no catalogadas]')
  })

  it('does not duplicate block if already present', () => {
    const base = '[Solicitudes no catalogadas]\n- ABC x1: Pieza'
    const merged = mergeCustomerNotesWithUncatalogued(base, [
      {
        id: '2',
        reference: 'DEF',
        description: 'Otra',
        qty: 1,
        createdAt: '2026-01-02',
      },
    ])
    expect(merged).toBe(base)
  })
})
