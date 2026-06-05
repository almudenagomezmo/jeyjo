import { NextResponse } from 'next/server'

import { requireB2bSuperadmin } from '@/lib/intranet/b2b-api-guard'
import {
  getCompanyOrderForApproval,
  rejectCompanyOrder,
} from '@/lib/intranet/order-approvals'

type RouteContext = { params: Promise<{ orderId: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireB2bSuperadmin()
  if ('error' in session) return session.error

  const { orderId } = await context.params
  const id = Number.parseInt(orderId, 10)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
  }

  const order = await getCompanyOrderForApproval(session.customerId, id)
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const ok = await rejectCompanyOrder(id)
  if (!ok) {
    return NextResponse.json({ error: 'Could not reject order' }, { status: 503 })
  }

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber })
}
