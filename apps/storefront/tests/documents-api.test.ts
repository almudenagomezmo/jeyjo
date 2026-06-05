import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as getInvoices } from '@/app/api/intranet/documents/invoices/route'
import type { NextRequest } from 'next/server'

import { GET as getInvoicePdf } from '@/app/api/intranet/documents/invoices/[id]/pdf/route'

const requireB2bApiSession = vi.fn()
const listInvoicesForCustomer = vi.fn()
const assertDocumentOwnedByCustomer = vi.fn()
const fetchDocumentPdfForCustomer = vi.fn()
const getSupabaseAdminClient = vi.fn()

vi.mock('@/lib/intranet/b2b-api-guard', () => ({
  requireB2bApiSession: (...args: unknown[]) => requireB2bApiSession(...args),
}))

vi.mock('@/lib/intranet/documents-service', () => ({
  listInvoicesForCustomer: (...args: unknown[]) => listInvoicesForCustomer(...args),
  assertDocumentOwnedByCustomer: (...args: unknown[]) => assertDocumentOwnedByCustomer(...args),
  fetchDocumentPdfForCustomer: (...args: unknown[]) => fetchDocumentPdfForCustomer(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => getSupabaseAdminClient(),
}))

describe('documents intranet API', () => {
  beforeEach(() => {
    requireB2bApiSession.mockReset()
    listInvoicesForCustomer.mockReset()
    assertDocumentOwnedByCustomer.mockReset()
    fetchDocumentPdfForCustomer.mockReset()
    getSupabaseAdminClient.mockReset()
  })

  it('GET invoices returns 403 without finance permission', async () => {
    requireB2bApiSession.mockResolvedValue({
      error: Response.json({ error: 'Forbidden' }, { status: 403 }),
    })
    const res = await getInvoices(new Request('http://localhost/api/intranet/documents/invoices'))
    expect(res?.status).toBe(403)
    expect(requireB2bApiSession).toHaveBeenCalledWith({ section: 'finance' })
  })

  it('GET invoices returns list for authorized customer', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: {},
      customerId: 'cust-1',
    })
    listInvoicesForCustomer.mockResolvedValue({
      erpCode: 'B2B-EMPRESA1',
      items: [{ id: 'INV-2026-0001', invoiceNumber: 'FAC-2026-0001' }],
    })

    const res = await getInvoices(new Request('http://localhost/api/intranet/documents/invoices'))
    expect(res?.status).toBe(200)
    const body = (await res!.json()) as { items: unknown[] }
    expect(body.items).toHaveLength(1)
  })

  it('GET invoice pdf returns 404 for cross-customer id', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: {},
      customerId: 'cust-1',
    })
    assertDocumentOwnedByCustomer.mockResolvedValue(null)
    getSupabaseAdminClient.mockReturnValue(null)

    const req = new Request('http://localhost/api/intranet/documents/invoices/INV-OTHER/pdf') as NextRequest
    const res = await getInvoicePdf(req, { params: Promise.resolve({ id: 'INV-OTHER' }) })
    expect(res?.status).toBe(404)
  })

  it('GET invoice pdf streams bytes when owned', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: {},
      customerId: 'cust-1',
    })
    assertDocumentOwnedByCustomer.mockResolvedValue({ erpCode: 'B2B-EMPRESA1' })
    getSupabaseAdminClient.mockReturnValue(null)
    fetchDocumentPdfForCustomer.mockResolvedValue({
      bytes: new Uint8Array([37, 80, 68, 70]),
      contentType: 'application/pdf',
      fileName: 'FAC-2026-0001.pdf',
    })

    const req = new Request(
      'http://localhost/api/intranet/documents/invoices/INV-2026-0001/pdf',
    ) as NextRequest
    const res = await getInvoicePdf(req, { params: Promise.resolve({ id: 'INV-2026-0001' }) })
    expect(res?.status).toBe(200)
    expect(res?.headers.get('Content-Type')).toBe('application/pdf')
  })
})
