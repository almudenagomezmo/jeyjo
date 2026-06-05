import { NextResponse } from 'next/server'

import { requireB2bSuperadmin } from '@/lib/intranet/b2b-api-guard'
import { listPendingCompanyApprovalOrders } from '@/lib/intranet/order-approvals'

export async function GET() {
  const session = await requireB2bSuperadmin()
  if ('error' in session) return session.error

  const orders = await listPendingCompanyApprovalOrders(session.customerId)
  return NextResponse.json({ orders })
}
