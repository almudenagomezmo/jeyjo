import { NextResponse } from 'next/server'

import { resolveCachedDocumentPdf } from '@/lib/documents/pdf-cache'
import {
  assertDocumentOwnedByCustomer,
  fetchDocumentPdfForCustomer,
} from '@/lib/intranet/documents-service'
import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { ErpDocumentType } from '@jeyjo/erp-ports'

type PdfRouteParams = {
  documentType: ErpDocumentType
  documentId: string
}

function pdfResponse(bytes: Uint8Array, fileName: string, cacheHeader?: string) {
  const body = Buffer.from(bytes)
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      ...(cacheHeader ? { 'X-Document-Cache': cacheHeader } : {}),
    },
  })
}

export async function handleDocumentPdfDownload({ documentType, documentId }: PdfRouteParams) {
  const guard = await requireB2bApiSession({ section: 'finance' })
  if ('error' in guard) return guard.error

  const owned = await assertDocumentOwnedByCustomer(guard.customerId, documentType, documentId)
  if (!owned) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    const direct = await fetchDocumentPdfForCustomer(guard.customerId, documentType, documentId)
    if (!direct) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return pdfResponse(direct.bytes, direct.fileName)
  }

  try {
    const resolved = await resolveCachedDocumentPdf(admin, {
      customerId: guard.customerId,
      documentType,
      documentId,
      fetchFromErp: async () => {
        const pdf = await fetchDocumentPdfForCustomer(guard.customerId, documentType, documentId)
        if (!pdf) throw new Error('Document not found')
        return { bytes: pdf.bytes, fileName: pdf.fileName }
      },
    })

    return pdfResponse(resolved.bytes, resolved.fileName, resolved.fromCache ? 'hit' : 'miss')
  } catch {
    return NextResponse.json({ error: 'Unable to fetch document' }, { status: 502 })
  }
}

export function parseInvoiceListFilters(url: URL) {
  const yearRaw = url.searchParams.get('year')
  const monthRaw = url.searchParams.get('month')
  const amountMinRaw = url.searchParams.get('amountMin')
  const amountMaxRaw = url.searchParams.get('amountMax')

  return {
    year: yearRaw ? Number.parseInt(yearRaw, 10) : undefined,
    month: monthRaw ? Number.parseInt(monthRaw, 10) : undefined,
    query: url.searchParams.get('q') ?? undefined,
    amountMin: amountMinRaw ? Number.parseFloat(amountMinRaw) : undefined,
    amountMax: amountMaxRaw ? Number.parseFloat(amountMaxRaw) : undefined,
  }
}
