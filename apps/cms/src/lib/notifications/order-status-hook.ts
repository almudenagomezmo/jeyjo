import type { CollectionAfterChangeHook } from 'payload'

import type { JeyjoOrderStatus } from '@/collections/Orders/status-transitions'
import { isJeyjoOrderStatus } from '@/collections/Orders/status-transitions'

import { dispatchNotification } from './dispatch'
import { isNotificationsEnabled } from './env'
import { orderStatusLabel } from './labels'

const NOTIFY_STATUSES: JeyjoOrderStatus[] = [
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
]

export const notifyOrderStatusChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  if (!isNotificationsEnabled() || operation !== 'update') return doc

  const prev = previousDoc?.jeyjoStatus as string | undefined
  const next = doc.jeyjoStatus as string | undefined
  if (!next || next === prev || !isJeyjoOrderStatus(next)) return doc
  if (!NOTIFY_STATUSES.includes(next)) return doc

  const customerRef =
    typeof doc.customerRef === 'string' ? doc.customerRef.trim() : null
  if (!customerRef) return doc

  const orderNumber = String(doc.orderNumber ?? doc.id)
  const label = orderStatusLabel(next)

  await dispatchNotification(req.payload, {
    customerId: customerRef,
    type: 'order_status',
    title: `Pedido ${orderNumber}: ${label}`,
    body: `Tu pedido ha pasado a estado ${label}`,
    payload: {
      orderNumber,
      statusLabel: label,
      href: '/cuenta/empresa/pedidos',
    },
    idempotencyKey: `order:${doc.id}:status:${next}`,
  })

  return doc
}
