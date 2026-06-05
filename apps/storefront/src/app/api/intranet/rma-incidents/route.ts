import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { buildRmaListPage, submitRmaRequest } from '@/lib/intranet/rma/service'
import type { CreateRmaInput, RmaListFilter } from '@/lib/intranet/rma/types'

function parseListFilter(value: string | null): RmaListFilter {
  if (value === 'open' || value === 'closed') return value
  return 'all'
}

export async function GET(request: Request) {
  const guard = await requireB2bApiSession({ section: 'orders' })
  if ('error' in guard) return guard.error

  const url = new URL(request.url)
  const page = Number.parseInt(url.searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(url.searchParams.get('pageSize') ?? '25', 10)
  const status = parseListFilter(url.searchParams.get('status'))

  const result = await buildRmaListPage(guard.customerId, {
    status,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 25,
  })

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const guard = await requireB2bApiSession({ section: 'orders' })
  if ('error' in guard) return guard.error

  let body: CreateRmaInput
  try {
    body = (await request.json()) as CreateRmaInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const outcome = await submitRmaRequest(
    guard.customerId,
    guard.ctx.email ?? null,
    body,
  )

  if (outcome.error) {
    const status = outcome.error.code === 'DUPLICATE' ? 409 : 400
    return NextResponse.json(outcome.error, { status })
  }

  if (!outcome.result) {
    return NextResponse.json({ error: 'Could not create RMA' }, { status: 500 })
  }

  return NextResponse.json(outcome.result, { status: 201 })
}
