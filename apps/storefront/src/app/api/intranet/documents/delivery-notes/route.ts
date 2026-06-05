import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { listDeliveryNotesForCustomer } from '@/lib/intranet/documents-service'

export async function GET() {
  const guard = await requireB2bApiSession({ section: 'finance' })
  if ('error' in guard) return guard.error

  const { items } = await listDeliveryNotesForCustomer(guard.customerId)
  return NextResponse.json({ items, total: items.length })
}
