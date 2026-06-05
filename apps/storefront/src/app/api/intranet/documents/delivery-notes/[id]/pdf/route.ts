import type { NextRequest } from 'next/server'

import { handleDocumentPdfDownload } from '@/lib/intranet/documents-api'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return handleDocumentPdfDownload({ documentType: 'delivery_note', documentId: id })
}
