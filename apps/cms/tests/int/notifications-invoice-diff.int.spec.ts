import { describe, expect, it } from 'vitest'

import { createStubDocumentsReader } from '@jeyjo/erp-ports'

import { findNewInvoiceIds } from '@/lib/notifications/invoice-diff'

describe('invoice diff CA-B2B-006', () => {
  it('detects one new invoice for empresa stub customer', async () => {
    const reader = createStubDocumentsReader()
    const all = await reader.listInvoicesByCustomer('B2B-EMPRESA1')
    const newOnes = findNewInvoiceIds(['INV-2026-0001'], all)
    expect(newOnes.some((n) => n.id === 'INV-2026-0002')).toBe(true)
    expect(newOnes[0]?.totalAmount).toBe(1250)
  })

  it('returns empty when all portal ids known', async () => {
    const reader = createStubDocumentsReader()
    const all = await reader.listInvoicesByCustomer('B2B-EMPRESA1')
    const ids = all.map((i) => i.id)
    expect(findNewInvoiceIds(ids, all)).toHaveLength(0)
  })
})
