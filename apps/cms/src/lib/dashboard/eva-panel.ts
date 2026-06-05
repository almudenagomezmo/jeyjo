import type { Payload } from 'payload'

import type { EvaPanel } from '@/lib/dashboard/types'

const EVA_QUEUE_LIMIT = 5

export async function buildEvaPanel(payload: Payload): Promise<EvaPanel> {
  const found = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { origin: { equals: 'eva' } },
        { validatedEva: { equals: false } },
        { jeyjoStatus: { not_equals: 'cancelled' } },
      ],
    },
    sort: '-createdAt',
    limit: EVA_QUEUE_LIMIT,
    depth: 0,
    overrideAccess: true,
  })

  const unresolvedQueries = found.docs.map((order) => ({
    id: String(order.id),
    label: `${order.orderNumber ?? order.id} — pendiente de validación`,
    adminUrl: `/admin/collections/orders/${order.id}`,
  }))

  return {
    activeConversations: 0,
    unresolvedQueries,
  }
}
