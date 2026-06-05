import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { buildQuickOrderPreview } from '@/lib/intranet/quick-order/build-preview'

export async function POST(request: Request) {
  const guard = await requireB2bApiSession({ section: 'orders' })
  if ('error' in guard) return guard.error

  let body: { reference?: string; qty?: number }
  try {
    body = (await request.json()) as { reference?: string; qty?: number }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const reference = body.reference?.trim() ?? ''
  if (!reference) {
    return NextResponse.json({ error: 'reference is required' }, { status: 400 })
  }

  const qty = Math.max(1, Math.floor(Number(body.qty ?? 1)))
  const preview = await buildQuickOrderPreview(reference, qty, guard.customerId)

  return NextResponse.json({ preview })
}
