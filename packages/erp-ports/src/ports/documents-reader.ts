import type { ErpPageOptions, ErpPageResult } from '../types/pagination.js'

export type ErpDocumentType = 'invoice' | 'delivery_note' | 'form_347' | 'erp_quote'

export type ErpInvoiceStatus = 'updated' | 'draft'

/** Invoice list item — notification sync (#28) + portal Contabilidad (#37). */
export type ErpInvoiceListItem = {
  id: string
  invoiceNumber: string
  issuedAt: string
  netAmount: number
  grossAmount: number
  totalAmount: number
  currency: string
  status: ErpInvoiceStatus
  customerErpCode: string
  updatedAt?: string
}

export type ErpDeliveryNoteStatus = 'issued' | 'preparing'

export type ErpDeliveryNoteListItem = {
  id: string
  deliveryNoteNumber: string
  issuedAt: string
  status: ErpDeliveryNoteStatus
  customerErpCode: string
  updatedAt?: string
}

export type ErpDuePaymentListItem = {
  invoiceId: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  outstandingAmount: number
  currency: string
  isOverdue: boolean
  customerErpCode: string
}

export type ErpForm347Summary = {
  fiscalYear: number
  totalOperationsAmount: number
  currency: string
  customerErpCode: string
}

export type ErpErpQuoteStatus = 'active' | 'expired'

export type ErpErpQuoteListItem = {
  id: string
  quoteNumber: string
  issuedAt: string
  validUntil: string
  netAmount: number
  grossAmount: number
  status: ErpErpQuoteStatus
  customerErpCode: string
  updatedAt?: string
}

export type ErpGetDocumentPdfInput = {
  type: ErpDocumentType
  documentId: string
  customerErpCode: string
}

export type ErpDocumentPdfResult = {
  bytes: Uint8Array
  contentType: 'application/pdf'
  fileName: string
}

export type ErpListInvoicesByCustomerOptions = {
  since?: string
}

export type ErpListInvoicesFilterOptions = ErpListInvoicesByCustomerOptions & {
  year?: number
  month?: number
  query?: string
  amountMin?: number
  amountMax?: number
}

/**
 * Read-only ERP documents port (invoices, delivery notes, vencimientos, 347, presupuestos ERP).
 */
export interface ErpDocumentsReader {
  listInvoices(options?: ErpPageOptions): Promise<ErpPageResult<ErpInvoiceListItem>>
  listInvoicesByCustomer(
    customerErpCode: string,
    options?: ErpListInvoicesByCustomerOptions,
  ): Promise<ErpInvoiceListItem[]>
  listDeliveryNotes(options?: ErpPageOptions): Promise<ErpPageResult<ErpDeliveryNoteListItem>>
  listDeliveryNotesByCustomer(
    customerErpCode: string,
    options?: ErpPageOptions,
  ): Promise<ErpDeliveryNoteListItem[]>
  listDuePaymentsByCustomer(
    customerErpCode: string,
  ): Promise<ErpDuePaymentListItem[]>
  getForm347Summary(customerErpCode: string, fiscalYear: number): Promise<ErpForm347Summary | null>
  listErpQuotesByCustomer(
    customerErpCode: string,
    options?: ErpPageOptions,
  ): Promise<ErpErpQuoteListItem[]>
  getDocumentPdf(input: ErpGetDocumentPdfInput): Promise<ErpDocumentPdfResult>
}
