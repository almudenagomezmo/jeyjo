import type { ErpDuePaymentListItem } from '../../ports/documents-reader.js'

/** CA-B2B-003 fixtures — outstanding balances for vencimientos. */
export const STUB_DUE_PAYMENTS_BY_CUSTOMER: Record<string, ErpDuePaymentListItem[]> = {
  'B2B-EMPRESA1': [
    {
      invoiceId: 'INV-DUE-2024-001',
      invoiceNumber: 'FAC-2024-001',
      invoiceDate: '2023-12-15',
      dueDate: '2024-01-01',
      outstandingAmount: 150.0,
      currency: 'EUR',
      isOverdue: true,
      customerErpCode: 'B2B-EMPRESA1',
    },
    {
      invoiceId: 'INV-DUE-2026-050',
      invoiceNumber: 'FAC-2026-050',
      invoiceDate: '2026-05-01',
      dueDate: '2026-12-31',
      outstandingAmount: 300.0,
      currency: 'EUR',
      isOverdue: false,
      customerErpCode: 'B2B-EMPRESA1',
    },
  ],
  'B2B-EMPRESA2': [],
}
