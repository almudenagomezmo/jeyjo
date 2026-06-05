import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { isQuickOrderEnabled } from '@/lib/intranet/quick-order/enabled'
import { buildQuickOrderTemplateBuffer } from '@/lib/intranet/quick-order/parse-spreadsheet'

export async function GET() {
  if (!isQuickOrderEnabled()) {
    return NextResponse.json({ error: 'Quick order disabled' }, { status: 503 })
  }

  const guard = await requireB2bApiSession()
  if ('error' in guard) return guard.error

  const buffer = buildQuickOrderTemplateBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-pedido-rapido.xlsx"',
    },
  })
}
