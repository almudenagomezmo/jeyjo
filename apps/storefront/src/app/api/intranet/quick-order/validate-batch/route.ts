import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { isQuickOrderEnabled } from '@/lib/intranet/quick-order/enabled'
import { parseQuickOrderSpreadsheet } from '@/lib/intranet/quick-order/parse-spreadsheet'
import { validateQuickOrderRefs } from '@/lib/intranet/quick-order/validate-rows'

type JsonBody = {
  items?: Array<{ ref?: string; qty?: number }>
}

export async function POST(request: Request) {
  if (!isQuickOrderEnabled()) {
    return NextResponse.json({ error: 'Quick order disabled' }, { status: 503 })
  }

  const guard = await requireB2bApiSession()
  if ('error' in guard) return guard.error

  const contentType = request.headers.get('content-type') ?? ''
  let items: Array<{ ref: string; qty: number; rowIndex?: number }> = []

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }
    const buffer = await (file as File).arrayBuffer()
    const parsed = parseQuickOrderSpreadsheet(buffer)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    items = parsed.rows
  } else {
    let body: JsonBody
    try {
      body = (await request.json()) as JsonBody
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    items = (body.items ?? [])
      .map((item, index) => ({
        ref: item.ref?.trim() ?? '',
        qty: Math.max(1, Math.floor(Number(item.qty ?? 1))),
        rowIndex: index + 1,
      }))
      .filter((item) => item.ref)
    if (items.length === 0) {
      return NextResponse.json({ error: 'No items' }, { status: 400 })
    }
  }

  const rows = await validateQuickOrderRefs(items)
  const okCount = rows.filter((r) => r.status === 'ok').length

  return NextResponse.json({ rows, okCount, total: rows.length })
}
