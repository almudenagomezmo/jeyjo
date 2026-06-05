import type { ErpDeliveryNoteListItem } from '../../ports/documents-reader.js'

export const STUB_DELIVERY_NOTES_BY_CUSTOMER: Record<string, ErpDeliveryNoteListItem[]> = {
  'B2B-EMPRESA1': [
    {
      id: 'DN-2026-001',
      deliveryNoteNumber: 'ALB-2026-001',
      issuedAt: '2026-02-18T09:00:00.000Z',
      status: 'issued',
      customerErpCode: 'B2B-EMPRESA1',
      updatedAt: '2026-02-18T09:00:00.000Z',
    },
    {
      id: 'DN-2026-002',
      deliveryNoteNumber: 'ALB-2026-002',
      issuedAt: '2026-03-05T11:00:00.000Z',
      status: 'preparing',
      customerErpCode: 'B2B-EMPRESA1',
      updatedAt: '2026-03-05T11:00:00.000Z',
    },
  ],
  'B2B-EMPRESA2': [
    {
      id: 'DN-2026-100',
      deliveryNoteNumber: 'ALB-2026-100',
      issuedAt: '2026-03-02T09:00:00.000Z',
      status: 'issued',
      customerErpCode: 'B2B-EMPRESA2',
    },
  ],
}
