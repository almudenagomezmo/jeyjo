import type { Payload } from 'payload'

import { getSkaiAdapter, resolveSkaiAdapterKind } from '@/eva/registry'
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

  const pendingOrders = found.docs.map((order) => ({
    id: String(order.id),
    label: `${order.orderNumber ?? order.id} — pendiente de validación`,
    adminUrl: `/admin/collections/orders/${order.id}`,
  }))

  let activeConversations = 0
  let skaiUnresolved: EvaPanel['unresolvedQueries'] = []
  let isLive = false

  const adapterKind = resolveSkaiAdapterKind()
  if (adapterKind === 'live') {
    const adapter = getSkaiAdapter()
    const health = await adapter.validateConnection()
    if (health.ok) {
      isLive = true
      const metrics = await adapter.getConversationMetrics()
      activeConversations = metrics.activeConversations
      skaiUnresolved = metrics.unresolvedQueries.map((q) => ({
        id: q.id,
        label: q.label,
      }))
    }
  }

  const merged: EvaPanel['unresolvedQueries'] = [...skaiUnresolved, ...pendingOrders]

  return {
    activeConversations,
    unresolvedQueries: merged,
    isLive,
  }
}
