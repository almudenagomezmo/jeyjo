import type { CollectionAfterChangeHook } from 'payload'

import type { QuoteStatus } from '@/collections/Quotes/status-transitions'

import { dispatchNotification } from './dispatch'
import { sendProactiveEmail } from './emails/send-proactive-email'
import { isNotificationsEnabled } from './env'
import { quoteStatusLabel } from './labels'

const NOTIFY_STATUSES: QuoteStatus[] = ['sent', 'accepted', 'cancelled']

export const notifyQuoteStatusChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  if (!isNotificationsEnabled() || operation !== 'update') return doc

  const prev = previousDoc?.status as QuoteStatus | undefined
  const next = doc.status as QuoteStatus | undefined
  if (!next || next === prev || !NOTIFY_STATUSES.includes(next)) return doc

  const customerRef =
    typeof doc.customerRef === 'string' ? doc.customerRef.trim() : null
  if (!customerRef && doc.segment !== 'b2b') return doc
  if (!customerRef) {
    const guestEmail = typeof doc.guestEmail === 'string' ? doc.guestEmail.trim() : null
    if (!guestEmail) return doc
    const quoteNumber = String(doc.quoteNumber ?? doc.id)
    const label = quoteStatusLabel(next)
    await sendProactiveEmail(req.payload, {
      to: guestEmail,
      type: 'quote_status',
      title: `Presupuesto ${quoteNumber}: ${label}`,
      body: `Tu presupuesto ha pasado a estado ${label}`,
      payload: {
        quoteNumber,
        statusLabel: label,
        href: '/cuenta/presupuestos',
      },
    })
    return doc
  }

  const quoteNumber = String(doc.quoteNumber ?? doc.id)
  const label = quoteStatusLabel(next)

  await dispatchNotification(req.payload, {
    customerId: customerRef,
    type: 'quote_status',
    title: `Presupuesto ${quoteNumber}: ${label}`,
    body: `Tu presupuesto ha pasado a estado ${label}`,
    payload: {
      quoteNumber,
      statusLabel: label,
      href: '/cuenta/empresa/contabilidad/presupuestos',
    },
    idempotencyKey: `quote:${doc.id}:status:${next}`,
  })

  return doc
}
