import type {
  ErpDeliveryNoteListItem,
  ErpDocumentPdfResult,
  ErpDocumentType,
  ErpDuePaymentListItem,
  ErpErpQuoteListItem,
  ErpForm347Summary,
  ErpInvoiceListItem,
} from '@jeyjo/erp-ports'

import { buildDocumentStoragePath } from '@/lib/documents/pdf-cache'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

import {
  fetchCmsCustomerDocumentById,
  fetchCmsCustomerDocuments,
  type CmsCustomerDocument,
} from './cms-customer-documents'

const BUCKET = 'private-documents'

function toIsoDate(value: string | null | undefined): string {
  if (!value) return new Date().toISOString()
  if (value.includes('T')) return value
  return `${value}T00:00:00.000Z`
}

function mapInvoice(doc: CmsCustomerDocument, erpCode: string | null): ErpInvoiceListItem {
  const gross = Number(doc.grossAmount ?? doc.netAmount ?? 0)
  const net = Number(doc.netAmount ?? gross)
  return {
    id: String(doc.id),
    invoiceNumber: doc.documentNumber,
    issuedAt: toIsoDate(doc.issuedAt),
    netAmount: net,
    grossAmount: gross,
    totalAmount: gross,
    currency: 'EUR',
    status: 'updated',
    customerErpCode: erpCode ?? doc.customerId,
  }
}

export async function listInvoicesWebNative(
  customerId: string,
  erpCode: string | null,
): Promise<ErpInvoiceListItem[]> {
  const docs = await fetchCmsCustomerDocuments(customerId, 'invoice')
  return docs.map((d) => mapInvoice(d, erpCode))
}

export async function listDeliveryNotesWebNative(
  customerId: string,
  erpCode: string | null,
): Promise<ErpDeliveryNoteListItem[]> {
  const docs = await fetchCmsCustomerDocuments(customerId, 'delivery_note')
  return docs.map((d) => ({
    id: String(d.id),
    deliveryNoteNumber: d.documentNumber,
    issuedAt: toIsoDate(d.issuedAt),
    status: (d.status === 'preparing' ? 'preparing' : 'issued') as 'issued' | 'preparing',
    customerErpCode: erpCode ?? customerId,
  }))
}

export async function listDuePaymentsWebNative(
  customerId: string,
  erpCode: string | null,
): Promise<ErpDuePaymentListItem[]> {
  const docs = await fetchCmsCustomerDocuments(customerId, 'due_payment')
  const today = new Date().toISOString().slice(0, 10)
  return docs.map((d) => {
    const dueDate = toIsoDate(d.dueDate).slice(0, 10)
    return {
      invoiceId: String(d.id),
      invoiceNumber: d.documentNumber,
      invoiceDate: toIsoDate(d.issuedAt).slice(0, 10),
      dueDate,
      outstandingAmount: Number(d.outstandingAmount ?? 0),
      currency: 'EUR',
      isOverdue: dueDate < today,
      customerErpCode: erpCode ?? customerId,
    }
  })
}

export async function getForm347WebNative(
  customerId: string,
  erpCode: string | null,
  fiscalYear: number,
): Promise<ErpForm347Summary | null> {
  const docs = await fetchCmsCustomerDocuments(customerId, 'form_347')
  const match = docs.find((d) => Number(d.fiscalYear) === fiscalYear)
  if (!match) return null
  return {
    fiscalYear,
    totalOperationsAmount: Number(match.grossAmount ?? match.netAmount ?? 0),
    currency: 'EUR',
    customerErpCode: erpCode ?? customerId,
  }
}

export async function listErpQuotesWebNative(
  customerId: string,
  erpCode: string | null,
): Promise<ErpErpQuoteListItem[]> {
  const docs = await fetchCmsCustomerDocuments(customerId, 'erp_quote')
  const today = new Date().toISOString().slice(0, 10)
  return docs.map((d) => {
    const validUntil = d.validUntil ? toIsoDate(d.validUntil).slice(0, 10) : today
    return {
      id: String(d.id),
      quoteNumber: d.documentNumber,
      issuedAt: toIsoDate(d.issuedAt),
      validUntil,
      netAmount: Number(d.netAmount ?? 0),
      grossAmount: Number(d.grossAmount ?? d.netAmount ?? 0),
      status: validUntil >= today ? 'active' : 'expired',
      customerErpCode: erpCode ?? customerId,
    }
  })
}

export async function assertCmsDocumentOwned(
  customerId: string,
  documentType: ErpDocumentType,
  documentId: string,
): Promise<boolean> {
  const doc = await fetchCmsCustomerDocumentById(documentId)
  if (!doc) return false
  if (doc.customerId !== customerId) return false
  if (documentType === 'form_347' && doc.documentType === 'form_347') return true
  return doc.documentType === documentType
}

export async function fetchCmsDocumentPdf(
  customerId: string,
  documentType: ErpDocumentType,
  documentId: string,
): Promise<ErpDocumentPdfResult | null> {
  const owned = await assertCmsDocumentOwned(customerId, documentType, documentId)
  if (!owned) return null

  const admin = getSupabaseAdminClient()
  if (!admin) return null

  const storagePath =
    (await fetchCmsCustomerDocumentById(documentId))?.storagePath ??
    buildDocumentStoragePath(customerId, documentType, documentId)

  const { data, error } = await admin.storage.from(BUCKET).download(storagePath)
  if (error || !data) return null

  const bytes = new Uint8Array(await data.arrayBuffer())
  return {
    bytes,
    contentType: 'application/pdf',
    fileName: `${documentId}.pdf`,
  }
}
