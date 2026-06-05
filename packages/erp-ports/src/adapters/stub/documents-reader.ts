import { ErpIntegrationError } from '../../errors.js'
import type {
  ErpDocumentPdfResult,
  ErpDocumentType,
  ErpDocumentsReader,
  ErpDuePaymentListItem,
  ErpGetDocumentPdfInput,
  ErpInvoiceListItem,
  ErpListInvoicesByCustomerOptions,
} from '../../ports/documents-reader.js'
import type { ErpPageOptions, ErpPageResult } from '../../types/pagination.js'
import { createStubPdfBytes } from './document-pdf-stub.js'
import { STUB_DELIVERY_NOTES_BY_CUSTOMER } from './delivery-notes-data.js'
import { STUB_DUE_PAYMENTS_BY_CUSTOMER } from './due-payments-data.js'
import { STUB_ERP_QUOTES_BY_CUSTOMER } from './erp-quotes-data.js'
import { STUB_FORM347_BY_CUSTOMER } from './form347-data.js'
import { STUB_INVOICES_BY_CUSTOMER } from './invoice-data.js'

const FIVE_YEARS_MS = 5 * 365.25 * 24 * 60 * 60 * 1000

function pageResult<T>(items: T[], options?: ErpPageOptions): ErpPageResult<T> {
  const limit = Math.min(100, Math.max(1, options?.limit ?? 50))
  const slice = items.slice(0, limit)
  return {
    items: slice,
    nextCursor: items.length > limit ? String(limit) : null,
    hasMore: items.length > limit,
  }
}

function isWithinFiveYears(issuedAt: string, now = Date.now()): boolean {
  const ts = Date.parse(issuedAt)
  if (Number.isNaN(ts)) return false
  return ts >= now - FIVE_YEARS_MS
}

function portalInvoicesForCustomer(customerErpCode: string): ErpInvoiceListItem[] {
  const rows = STUB_INVOICES_BY_CUSTOMER[customerErpCode] ?? []
  return rows.filter((r) => r.status === 'updated' && isWithinFiveYears(r.issuedAt))
}

function recomputeOverdue(item: ErpDuePaymentListItem): ErpDuePaymentListItem {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  return {
    ...item,
    isOverdue: item.dueDate < todayStr && item.outstandingAmount > 0,
  }
}

type DocumentOwner = { type: ErpDocumentType; customerErpCode: string; fileName: string }

function buildDocumentOwnerIndex(): Map<string, DocumentOwner> {
  const map = new Map<string, DocumentOwner>()

  for (const [code, invoices] of Object.entries(STUB_INVOICES_BY_CUSTOMER)) {
    for (const inv of invoices) {
      if (inv.status !== 'updated') continue
      map.set(`invoice:${inv.id}`, {
        type: 'invoice',
        customerErpCode: code,
        fileName: `${inv.invoiceNumber}.pdf`,
      })
    }
  }

  for (const [code, notes] of Object.entries(STUB_DELIVERY_NOTES_BY_CUSTOMER)) {
    for (const note of notes) {
      map.set(`delivery_note:${note.id}`, {
        type: 'delivery_note',
        customerErpCode: code,
        fileName: `${note.deliveryNoteNumber}.pdf`,
      })
    }
  }

  for (const [code, years] of Object.entries(STUB_FORM347_BY_CUSTOMER)) {
    for (const year of Object.keys(years)) {
      map.set(`form_347:${code}:${year}`, {
        type: 'form_347',
        customerErpCode: code,
        fileName: `347-${year}.pdf`,
      })
    }
  }

  for (const [code, quotes] of Object.entries(STUB_ERP_QUOTES_BY_CUSTOMER)) {
    for (const quote of quotes) {
      map.set(`erp_quote:${quote.id}`, {
        type: 'erp_quote',
        customerErpCode: code,
        fileName: `${quote.quoteNumber}.pdf`,
      })
    }
  }

  for (const [code, dues] of Object.entries(STUB_DUE_PAYMENTS_BY_CUSTOMER)) {
    for (const due of dues) {
      map.set(`invoice:${due.invoiceId}`, {
        type: 'invoice',
        customerErpCode: code,
        fileName: `${due.invoiceNumber}.pdf`,
      })
    }
  }

  return map
}

const DOCUMENT_OWNER_INDEX = buildDocumentOwnerIndex()

function resolveDocumentKey(input: ErpGetDocumentPdfInput): string {
  if (input.type === 'form_347') {
    return `form_347:${input.customerErpCode}:${input.documentId}`
  }
  return `${input.type}:${input.documentId}`
}

export function createStubDocumentsReader(): ErpDocumentsReader {
  return {
    async listInvoices(options) {
      const all = Object.values(STUB_INVOICES_BY_CUSTOMER)
        .flat()
        .filter((r) => r.status === 'updated' && isWithinFiveYears(r.issuedAt))
      return pageResult(all, options)
    },

    async listInvoicesByCustomer(customerErpCode, options?: ErpListInvoicesByCustomerOptions) {
      let rows = portalInvoicesForCustomer(customerErpCode)
      if (options?.since) {
        const sinceDay = options.since.slice(0, 10)
        rows = rows.filter((r) => r.issuedAt.slice(0, 10) >= sinceDay)
      }
      return [...rows]
    },

    async listDeliveryNotes(options) {
      const all = Object.values(STUB_DELIVERY_NOTES_BY_CUSTOMER).flat()
      return pageResult(all, options)
    },

    async listDeliveryNotesByCustomer(customerErpCode) {
      return [...(STUB_DELIVERY_NOTES_BY_CUSTOMER[customerErpCode] ?? [])]
    },

    async listDuePaymentsByCustomer(customerErpCode) {
      return (STUB_DUE_PAYMENTS_BY_CUSTOMER[customerErpCode] ?? []).map(recomputeOverdue)
    },

    async getForm347Summary(customerErpCode, fiscalYear) {
      return STUB_FORM347_BY_CUSTOMER[customerErpCode]?.[fiscalYear] ?? null
    },

    async listErpQuotesByCustomer(customerErpCode) {
      return [...(STUB_ERP_QUOTES_BY_CUSTOMER[customerErpCode] ?? [])]
    },

    async getDocumentPdf(input: ErpGetDocumentPdfInput): Promise<ErpDocumentPdfResult> {
      const key = resolveDocumentKey(input)
      const owner = DOCUMENT_OWNER_INDEX.get(key)
      if (!owner || owner.customerErpCode !== input.customerErpCode) {
        throw new ErpIntegrationError(
          'ERP_VALIDATION',
          `Document ${input.type}/${input.documentId} not found for customer ${input.customerErpCode}`,
        )
      }

      const label = `${input.type} ${input.documentId}`
      return {
        bytes: createStubPdfBytes(label),
        contentType: 'application/pdf',
        fileName: owner.fileName,
      }
    },
  }
}

export { isWithinFiveYears, portalInvoicesForCustomer }
