import {
  createStubDocumentsReader,
  type ErpDocumentType,
  type ErpDocumentsReader,
} from '@jeyjo/erp-ports'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export type InvoiceListFilters = {
  year?: number
  month?: number
  query?: string
  amountMin?: number
  amountMax?: number
}

async function loadCustomerErpCode(customerId: string): Promise<string | null> {
  const admin = getSupabaseAdminClient()
  if (!admin) return null
  const { data } = await admin
    .from('customers')
    .select('erp_code')
    .eq('id', customerId)
    .maybeSingle()
  return data?.erp_code?.trim() ?? null
}

function getDocumentsReader(): ErpDocumentsReader {
  return createStubDocumentsReader()
}

export function filterInvoicesForPortal<
  T extends {
    invoiceNumber: string
    issuedAt: string
    grossAmount: number
  },
>(rows: T[], filters: InvoiceListFilters): T[] {
  let result = [...rows]

  if (filters.year) {
    result = result.filter((r) => new Date(r.issuedAt).getUTCFullYear() === filters.year)
  }
  if (filters.month && filters.month >= 1 && filters.month <= 12) {
    result = result.filter((r) => new Date(r.issuedAt).getUTCMonth() + 1 === filters.month)
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase()
    result = result.filter((r) => r.invoiceNumber.toLowerCase().includes(q))
  }
  if (filters.amountMin != null && Number.isFinite(filters.amountMin)) {
    result = result.filter((r) => r.grossAmount >= filters.amountMin!)
  }
  if (filters.amountMax != null && Number.isFinite(filters.amountMax)) {
    result = result.filter((r) => r.grossAmount <= filters.amountMax!)
  }

  return result
}

export async function listInvoicesForCustomer(
  customerId: string,
  filters: InvoiceListFilters = {},
) {
  const erpCode = await loadCustomerErpCode(customerId)
  if (!erpCode) {
    return { erpCode: null, items: [] as Awaited<ReturnType<ErpDocumentsReader['listInvoicesByCustomer']>> }
  }
  const reader = getDocumentsReader()
  const rows = await reader.listInvoicesByCustomer(erpCode)
  return { erpCode, items: filterInvoicesForPortal(rows, filters) }
}

export async function listDeliveryNotesForCustomer(customerId: string) {
  const erpCode = await loadCustomerErpCode(customerId)
  if (!erpCode) return { erpCode: null, items: [] }
  const reader = getDocumentsReader()
  return { erpCode, items: await reader.listDeliveryNotesByCustomer(erpCode) }
}

export async function listDuePaymentsForCustomer(customerId: string) {
  const erpCode = await loadCustomerErpCode(customerId)
  if (!erpCode) return { erpCode: null, items: [], totalOutstandingAmount: 0 }
  const reader = getDocumentsReader()
  const items = await reader.listDuePaymentsByCustomer(erpCode)
  const totalOutstandingAmount = items.reduce((sum, row) => sum + row.outstandingAmount, 0)
  return { erpCode, items, totalOutstandingAmount }
}

export async function getForm347ForCustomer(customerId: string, fiscalYear: number) {
  const erpCode = await loadCustomerErpCode(customerId)
  if (!erpCode) return { erpCode: null, summary: null }
  const reader = getDocumentsReader()
  const summary = await reader.getForm347Summary(erpCode, fiscalYear)
  return { erpCode, summary }
}

export async function listErpQuotesForCustomer(customerId: string) {
  const erpCode = await loadCustomerErpCode(customerId)
  if (!erpCode) return { erpCode: null, items: [] }
  const reader = getDocumentsReader()
  return { erpCode, items: await reader.listErpQuotesByCustomer(erpCode) }
}

export async function assertDocumentOwnedByCustomer(
  customerId: string,
  documentType: ErpDocumentType,
  documentId: string,
): Promise<{ erpCode: string } | null> {
  const erpCode = await loadCustomerErpCode(customerId)
  if (!erpCode) return null

  const reader = getDocumentsReader()

  switch (documentType) {
    case 'invoice': {
      const rows = await reader.listInvoicesByCustomer(erpCode)
      if (!rows.some((r) => r.id === documentId)) return null
      break
    }
    case 'delivery_note': {
      const rows = await reader.listDeliveryNotesByCustomer(erpCode)
      if (!rows.some((r) => r.id === documentId)) return null
      break
    }
    case 'erp_quote': {
      const rows = await reader.listErpQuotesByCustomer(erpCode)
      if (!rows.some((r) => r.id === documentId)) return null
      break
    }
    case 'form_347': {
      const year = Number.parseInt(documentId, 10)
      if (!Number.isFinite(year)) return null
      const summary = await reader.getForm347Summary(erpCode, year)
      if (!summary) return null
      break
    }
    default:
      return null
  }

  return { erpCode }
}

export async function fetchDocumentPdfForCustomer(
  customerId: string,
  documentType: ErpDocumentType,
  documentId: string,
) {
  const owned = await assertDocumentOwnedByCustomer(customerId, documentType, documentId)
  if (!owned) return null

  const reader = getDocumentsReader()
  const pdf = await reader.getDocumentPdf({
    type: documentType,
    documentId,
    customerErpCode: owned.erpCode,
  })
  return pdf
}

export { loadCustomerErpCode, getDocumentsReader }
