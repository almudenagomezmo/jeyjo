import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { listDuePaymentsForCustomer } from '@/lib/intranet/documents-service'

export async function GET() {
  const guard = await requireB2bApiSession({ section: 'finance' })
  if ('error' in guard) return guard.error

  const { items, totalOutstandingAmount } = await listDuePaymentsForCustomer(guard.customerId)
  return NextResponse.json({ items, totalOutstandingAmount, total: items.length })
}
