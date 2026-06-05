import { NextResponse } from 'next/server'

import { parseInvoiceListFilters } from '@/lib/intranet/documents-api'
import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { listInvoicesForCustomer } from '@/lib/intranet/documents-service'

export async function GET(request: Request) {
  const guard = await requireB2bApiSession({ section: 'finance' })
  if ('error' in guard) return guard.error

  const filters = parseInvoiceListFilters(new URL(request.url))
  const { erpCode, items } = await listInvoicesForCustomer(guard.customerId, filters)

  if (!erpCode) {
    return NextResponse.json({ items: [], total: 0 })
  }

  return NextResponse.json({ items, total: items.length })
}
