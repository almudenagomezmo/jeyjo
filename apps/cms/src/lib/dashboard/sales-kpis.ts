import type { Payload } from 'payload'

import { isQualifyingDashboardOrder } from '@/lib/dashboard/order-qualify'
import type { SalesKpis } from '@/lib/dashboard/types'
import type { Order } from '@/payload-types'

export function aggregateSalesKpisFromOrders(orders: Pick<Order, 'amount' | 'jeyjoStatus' | 'paymentStatus'>[]): SalesKpis {
  const qualifying = orders.filter(isQualifyingDashboardOrder)
  const orderCount = qualifying.length
  const revenue = qualifying.reduce((sum, o) => sum + (typeof o.amount === 'number' ? o.amount : 0), 0)
  const avgTicket = orderCount > 0 ? revenue / orderCount : 0
  return { orderCount, revenue, avgTicket }
}

export async function fetchSalesKpis(
  payload: Payload,
  fromIso: string,
  toIso: string,
): Promise<SalesKpis> {
  const found = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { createdAt: { greater_than_equal: fromIso } },
        { createdAt: { less_than_equal: toIso } },
      ],
    },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })

  return aggregateSalesKpisFromOrders(found.docs)
}
