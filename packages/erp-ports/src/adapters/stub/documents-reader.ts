import { ErpIntegrationError } from '../../errors.js'
import type { ErpDocumentsReader } from '../../ports/documents-reader.js'
import type { ErpPageOptions, ErpPageResult } from '../../types/pagination.js'
import { STUB_INVOICES_BY_CUSTOMER } from './invoice-data.js'

function pageResult<T>(items: T[], options?: ErpPageOptions): ErpPageResult<T> {
  const limit = Math.min(100, Math.max(1, options?.limit ?? 50))
  const slice = items.slice(0, limit)
  return {
    items: slice,
    nextCursor: items.length > limit ? String(limit) : null,
    hasMore: items.length > limit,
  }
}

export function createStubDocumentsReader(): ErpDocumentsReader {
  const notImplemented = async (): Promise<never> => {
    throw new ErpIntegrationError(
      'ERP_NOT_IMPLEMENTED',
      'ErpDocumentsReader listDeliveryNotes is not implemented in the stub phase (see change #37)',
    )
  }

  return {
    async listInvoices(options) {
      const all = Object.values(STUB_INVOICES_BY_CUSTOMER).flat()
      return pageResult(all, options)
    },

    async listInvoicesByCustomer(customerErpCode, options) {
      const rows = STUB_INVOICES_BY_CUSTOMER[customerErpCode] ?? []
      if (!options?.since) return [...rows]
      const sinceDay = options.since.slice(0, 10)
      return rows.filter((r) => r.issuedAt.slice(0, 10) >= sinceDay)
    },

    listDeliveryNotes: notImplemented,
  }
}
