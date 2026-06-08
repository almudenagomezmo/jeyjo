import type { CollectionAfterChangeHook } from 'payload'

import { getSupabaseServerClient } from '@/lib/supabase-server'

const BUCKET = 'private-documents'

function mapDocumentTypeToPath(type: string): string {
  if (type === 'delivery_note') return 'delivery_note'
  if (type === 'due_payment') return 'due_payment'
  if (type === 'form_347') return 'form_347'
  if (type === 'erp_quote') return 'erp_quote'
  return 'invoice'
}

export const syncCustomerDocumentPdf: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  const customerId = String(doc.customerId ?? '').trim()
  const documentType = String(doc.documentType ?? '')
  const pdfFile = doc.pdfFile

  if (!customerId || !documentType || !pdfFile) return doc

  const mediaId = typeof pdfFile === 'object' ? pdfFile.id : pdfFile
  if (!mediaId) return doc

  const media = await req.payload.findByID({
    collection: 'media',
    id: mediaId,
    depth: 0,
    overrideAccess: true,
    req,
  })

  const url = media.url
  if (!url) return doc

  const supabase = getSupabaseServerClient()
  if (!supabase) return doc

  const storagePath = `${customerId}/${mapDocumentTypeToPath(documentType)}/${doc.id}.pdf`

  try {
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001'
    const fetchUrl = url.startsWith('http') ? url : `${base}${url}`
    const res = await fetch(fetchUrl)
    if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`)
    const bytes = new Uint8Array(await res.arrayBuffer())

    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
      contentType: 'application/pdf',
      upsert: true,
    })
    if (error) throw new Error(error.message)

    if (doc.storagePath !== storagePath || operation === 'create') {
      await req.payload.update({
        collection: 'customer-documents',
        id: doc.id,
        data: { storagePath },
        overrideAccess: true,
        req,
      })
    }
  } catch (e) {
    req.payload.logger.error({
      err: e,
      message: 'customer-document PDF sync failed',
      docId: doc.id,
    })
  }

  return doc
}
