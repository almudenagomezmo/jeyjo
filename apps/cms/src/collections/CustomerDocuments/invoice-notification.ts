import type { CollectionAfterChangeHook } from 'payload'

import { dispatchNotification } from '@/lib/notifications/dispatch'

export const notifyInvoiceDocumentCreated: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation !== 'create') return doc
  if (doc.documentType !== 'invoice') return doc

  const customerId = String(doc.customerId ?? '').trim()
  if (!customerId) return doc

  try {
    await dispatchNotification(req.payload, {
      customerId,
      type: 'invoice_new',
      title: 'Nueva factura disponible',
      body: `Factura ${doc.documentNumber} disponible en Contabilidad.`,
      payload: {
        invoiceId: String(doc.id),
        href: `/intranet/contabilidad/facturas`,
      },
      idempotencyKey: `invoice-doc:${doc.id}`,
    })
  } catch (e) {
    req.payload.logger.warn({
      err: e,
      message: 'invoice_new dispatch failed for customer document',
      docId: doc.id,
    })
  }

  return doc
}
