import { describe, expect, it } from 'vitest'

import { filterInvoicesForPortal } from '@/lib/intranet/documents-service'

const SAMPLE = [
  {
    id: '1',
    invoiceNumber: 'FAC-2026-0001',
    issuedAt: '2026-01-15T10:00:00.000Z',
    netAmount: 100,
    grossAmount: 121,
  },
  {
    id: '2',
    invoiceNumber: 'FAC-2023-0100',
    issuedAt: '2023-06-10T10:00:00.000Z',
    netAmount: 200,
    grossAmount: 242,
  },
]

describe('filterInvoicesForPortal', () => {
  it('filters by year and invoice number query', () => {
    const rows = filterInvoicesForPortal(SAMPLE, { year: 2026, query: '0001' })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.invoiceNumber).toBe('FAC-2026-0001')
  })

  it('filters by gross amount range', () => {
    const rows = filterInvoicesForPortal(SAMPLE, { amountMin: 200, amountMax: 250 })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe('2')
  })
})
