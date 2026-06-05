import { describe, expect, it } from 'vitest'

import { STUB_INVOICES_BY_CUSTOMER } from '@jeyjo/erp-ports'

import { findNewInvoiceIds } from '@/lib/notifications/invoice-diff'

describe('invoice diff CA-B2B-006', () => {
  it('detects one new invoice for empresa stub customer', () => {
    const all = STUB_INVOICES_BY_CUSTOMER['B2B-EMPRESA1'] ?? []
    const newOnes = findNewInvoiceIds(['INV-2026-0001'], all)
    expect(newOnes).toHaveLength(1)
    expect(newOnes[0]?.id).toBe('INV-2026-0002')
    expect(newOnes[0]?.totalAmount).toBe(1250)
  })

  it('returns empty when all ids known', () => {
    const all = STUB_INVOICES_BY_CUSTOMER['B2B-EMPRESA1'] ?? []
    const ids = all.map((i: { id: string }) => i.id)
    expect(findNewInvoiceIds(ids, all)).toHaveLength(0)
  })
})
