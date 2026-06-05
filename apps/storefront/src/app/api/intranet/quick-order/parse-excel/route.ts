import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { buildQuickOrderPreview } from '@/lib/intranet/quick-order/build-preview'
import { parseQuickOrderExcel } from '@/lib/intranet/quick-order/excel-parser'

const BATCH_CONCURRENCY = 8

export async function POST(request: Request) {
  const guard = await requireB2bApiSession({ section: 'orders' })
  if ('error' in guard) return guard.error

  const form = await request.formData()
  const file = form.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const parsed = parseQuickOrderExcel(buffer)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const rows: Awaited<ReturnType<typeof buildQuickOrderPreview>>[] = []
  const errors: string[] = []

  for (let i = 0; i < parsed.rows.length; i += BATCH_CONCURRENCY) {
    const chunk = parsed.rows.slice(i, i + BATCH_CONCURRENCY)
    const previews = await Promise.all(
      chunk.map(async (row) => {
        if (!row.reference.trim()) {
          errors.push(`Fila ${row.rowNumber}: referencia vacía`)
          return buildQuickOrderPreview('', 1, guard.customerId)
        }
        if (row.qty < 1) {
          errors.push(`Fila ${row.rowNumber}: cantidad inválida`)
          return buildQuickOrderPreview(row.reference, 0, guard.customerId)
        }
        return buildQuickOrderPreview(row.reference, row.qty, guard.customerId)
      }),
    )
    rows.push(...previews)
  }

  return NextResponse.json({ rows, errors })
}
