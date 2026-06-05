import type { ErpPageOptions, ErpPageResult } from '../types/pagination.js'

/** Invoice list item — extended for notification sync (#28); full portal UI in #37. */
export type ErpInvoiceListItem = {
  id: string
  issuedAt: string
  totalAmount: number
  currency: string
  customerErpCode: string
}

/** Delivery note list item — full shape in change #37. */
export type ErpDeliveryNoteListItem = {
  id: string
  issuedAt: string
}

export type ErpListInvoicesByCustomerOptions = {
  since?: string
}

/**
 * Read-only ERP documents port (invoices, delivery notes).
 */
export interface ErpDocumentsReader {
  listInvoices(options?: ErpPageOptions): Promise<ErpPageResult<ErpInvoiceListItem>>
  listInvoicesByCustomer(
    customerErpCode: string,
    options?: ErpListInvoicesByCustomerOptions,
  ): Promise<ErpInvoiceListItem[]>
  listDeliveryNotes(options?: ErpPageOptions): Promise<ErpPageResult<ErpDeliveryNoteListItem>>
}
