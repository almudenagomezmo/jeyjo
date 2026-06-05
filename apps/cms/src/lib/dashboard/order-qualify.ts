import type { Order } from '@/payload-types'

export function isQualifyingDashboardOrder(order: Pick<Order, 'jeyjoStatus' | 'paymentStatus'>): boolean {
  if (order.jeyjoStatus === 'cancelled') return false
  if (order.paymentStatus === 'failed') return false
  return true
}

export function qualifyingOrdersWhere(fromIso: string, toIso: string) {
  return {
    and: [
      { createdAt: { greater_than_equal: fromIso } },
      { createdAt: { less_than_equal: toIso } },
      { jeyjoStatus: { not_equals: 'cancelled' } },
      { paymentStatus: { not_equals: 'failed' } },
    ],
  }
}
