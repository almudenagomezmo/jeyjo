import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { buildQuickOrderAdditions } from '@/lib/intranet/quick-order/add-lines'

type AddBody = {
  items?: Array<{ reference?: string; qty?: number }>
}

export async function POST(request: Request) {
  const guard = await requireB2bApiSession({ section: 'orders' })
  if ('error' in guard) return guard.error

  let body: AddBody
  try {
    body = (await request.json()) as AddBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const items = (body.items ?? [])
    .map((item) => ({
      reference: item.reference?.trim() ?? '',
      qty: Math.max(1, Math.floor(Number(item.qty ?? 1))),
    }))
    .filter((item) => item.reference)

  if (items.length === 0) {
    return NextResponse.json({ error: 'No items' }, { status: 400 })
  }

  const { additions, missing } = await buildQuickOrderAdditions(items, guard.customerId)

  if (additions.length === 0) {
    return NextResponse.json({ error: 'No valid catalog items', missing }, { status: 400 })
  }

  return NextResponse.json({ additions, missing })
}
