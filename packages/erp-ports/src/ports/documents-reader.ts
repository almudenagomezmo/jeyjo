import type { ErpPageOptions, ErpPageResult } from '../types/pagination.js'

/** Invoice list item — full shape in change #37. */
export type ErpInvoiceListItem = {
  id: string
  issuedAt: string
}

/** Delivery note list item — full shape in change #37. */
export type ErpDeliveryNoteListItem = {
  id: string
  issuedAt: string
}

/**
 * Read-only ERP documents port (invoices, delivery notes).
 * Stub and default bundle throw `ERP_NOT_IMPLEMENTED` until change #37.
 */
export interface ErpDocumentsReader {
  listInvoices(options?: ErpPageOptions): Promise<ErpPageResult<ErpInvoiceListItem>>
  listDeliveryNotes(options?: ErpPageOptions): Promise<ErpPageResult<ErpDeliveryNoteListItem>>
}
