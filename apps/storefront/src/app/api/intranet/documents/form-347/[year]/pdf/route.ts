import type { NextRequest } from 'next/server'

import { handleDocumentPdfDownload } from '@/lib/intranet/documents-api'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ year: string }> },
) {
  const { year } = await context.params
  return handleDocumentPdfDownload({ documentType: 'form_347', documentId: year })
}
