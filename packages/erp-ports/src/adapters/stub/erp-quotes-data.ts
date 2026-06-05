import type { ErpErpQuoteListItem } from '../../ports/documents-reader.js'

export const STUB_ERP_QUOTES_BY_CUSTOMER: Record<string, ErpErpQuoteListItem[]> = {
  'B2B-EMPRESA1': [
    {
      id: 'EQ-2026-001',
      quoteNumber: 'PRE-ERP-2026-001',
      issuedAt: '2026-01-10T10:00:00.000Z',
      validUntil: '2026-07-10',
      netAmount: 800.0,
      grossAmount: 968.0,
      status: 'active',
      customerErpCode: 'B2B-EMPRESA1',
      updatedAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'EQ-2025-099',
      quoteNumber: 'PRE-ERP-2025-099',
      issuedAt: '2025-03-01T10:00:00.000Z',
      validUntil: '2025-06-01',
      netAmount: 450.0,
      grossAmount: 544.5,
      status: 'expired',
      customerErpCode: 'B2B-EMPRESA1',
    },
  ],
  'B2B-EMPRESA2': [],
}
