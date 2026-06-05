import type { Payload } from 'payload'

import { fetchCustomersByIds, resolveCustomerLabel } from '@/lib/orders/customer-label'
import type { RecentOrderRow } from '@/lib/dashboard/types'
import type { Order } from '@/payload-types'

export async function buildRecentOrders(payload: Payload, limit = 5): Promise<RecentOrderRow[]> {
  const found = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { jeyjoStatus: { not_equals: 'cancelled' } },
        { paymentStatus: { not_equals: 'failed' } },
      ],
    },
    sort: '-createdAt',
    limit,
    depth: 0,
    overrideAccess: true,
  })

  const customerIds = found.docs
    .map((d) => d.customerRef?.trim())
    .filter((id): id is string => Boolean(id))
  const customers = await fetchCustomersByIds(customerIds)

  return found.docs.map((order) => {
    const customer = order.customerRef ? customers.get(order.customerRef) : undefined
    return {
      id: order.id,
      orderNumber: order.orderNumber ?? null,
      total: order.amount ?? null,
      createdAt: order.createdAt,
      origin: order.origin ?? null,
      jeyjoStatus: order.jeyjoStatus ?? null,
      customerLabel: resolveCustomerLabel(order, customer),
      adminUrl: `/admin/collections/orders/${order.id}`,
    }
  })
}

export function mapOrderToRecentRow(
  order: Order,
  customerLabel: string,
): RecentOrderRow {
  return {
    id: order.id,
    orderNumber: order.orderNumber ?? null,
    total: order.amount ?? null,
    createdAt: order.createdAt,
    origin: order.origin ?? null,
    jeyjoStatus: order.jeyjoStatus ?? null,
    customerLabel,
    adminUrl: `/admin/collections/orders/${order.id}`,
  }
}
