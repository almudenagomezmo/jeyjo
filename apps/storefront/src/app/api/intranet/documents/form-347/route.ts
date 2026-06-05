import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { getForm347ForCustomer } from '@/lib/intranet/documents-service'

export async function GET(request: Request) {
  const guard = await requireB2bApiSession({ section: 'finance' })
  if ('error' in guard) return guard.error

  const url = new URL(request.url)
  const yearRaw = url.searchParams.get('year')
  const fiscalYear = yearRaw
    ? Number.parseInt(yearRaw, 10)
    : new Date().getFullYear() - 1

  if (!Number.isFinite(fiscalYear)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }

  const { summary } = await getForm347ForCustomer(guard.customerId, fiscalYear)
  if (!summary) {
    return NextResponse.json({ summary: null, fiscalYear })
  }

  return NextResponse.json({ summary, fiscalYear })
}
