import type { ErpInvoiceListItem } from '../../ports/documents-reader.js'

/** Stub invoices per ERP customer code (B2B-EMPRESA1 = empresa@test.com seed). */
export const STUB_INVOICES_BY_CUSTOMER: Record<string, ErpInvoiceListItem[]> = {
  'B2B-EMPRESA1': [
    {
      id: 'INV-2026-0001',
      issuedAt: '2026-01-15T10:00:00.000Z',
      totalAmount: 450.5,
      currency: 'EUR',
      customerErpCode: 'B2B-EMPRESA1',
    },
    {
      id: 'INV-2026-0002',
      issuedAt: '2026-02-20T10:00:00.000Z',
      totalAmount: 1250.0,
      currency: 'EUR',
      customerErpCode: 'B2B-EMPRESA1',
    },
  ],
  'B2B-EMPRESA2': [
    {
      id: 'INV-2026-0100',
      issuedAt: '2026-03-01T10:00:00.000Z',
      totalAmount: 89.99,
      currency: 'EUR',
      customerErpCode: 'B2B-EMPRESA2',
    },
  ],
}
