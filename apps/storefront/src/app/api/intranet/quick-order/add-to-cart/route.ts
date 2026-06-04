import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { buildQuickOrderAdditions } from '@/lib/intranet/quick-order/add-to-cart'
import { isQuickOrderEnabled } from '@/lib/intranet/quick-order/enabled'

type Body = {
  items?: Array<{ sku?: string; qty?: number }>
}

export async function POST(request: Request) {
  if (!isQuickOrderEnabled()) {
    return NextResponse.json({ error: 'Quick order disabled' }, { status: 503 })
  }

  const guard = await requireB2bApiSession()
  if ('error' in guard) return guard.error

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = await buildQuickOrderAdditions(body.items ?? [], guard.customerId)
  if (!result.ok) {
    const payload =
      result.error === 'No valid catalog items'
        ? { error: result.error, missing: [] as string[] }
        : { error: result.error }
    return NextResponse.json(payload, { status: result.status })
  }

  return NextResponse.json({ additions: result.additions, missing: result.missing })
}
