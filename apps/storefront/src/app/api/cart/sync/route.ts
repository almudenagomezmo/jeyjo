import { NextResponse } from 'next/server'

import { syncAbandonedCartSnapshot } from '@/lib/abandoned-cart/sync'
import type { CartLine } from '@/lib/types'

export async function POST(request: Request) {
  let body: { lines?: CartLine[] }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const lines = Array.isArray(body.lines) ? body.lines : []
  const result = await syncAbandonedCartSnapshot(lines)

  if (!result.ok && result.reason === 'guest') {
    return NextResponse.json({ ok: false, skipped: true, reason: 'guest' })
  }
  if (!result.ok && result.reason === 'not_b2c') {
    return NextResponse.json({ ok: false, skipped: true, reason: 'not_b2c' })
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? 'sync failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
