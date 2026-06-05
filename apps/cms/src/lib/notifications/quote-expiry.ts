import type { Payload } from 'payload'

import { dispatchNotification } from './dispatch'

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function runQuoteExpiryNotifications(payload: Payload): Promise<{
  quotesChecked: number
  notificationsCreated: number
}> {
  const targetDay = addDays(new Date(), 7)

  const { docs } = await payload.find({
    collection: 'quotes',
    where: {
      and: [
        { status: { in: ['sent', 'accepted'] } },
        { validUntil: { equals: targetDay } },
        { customerRef: { exists: true } },
      ],
    },
    limit: 200,
    depth: 0,
  })

  let notificationsCreated = 0

  for (const quote of docs) {
    const customerRef =
      typeof quote.customerRef === 'string' ? quote.customerRef.trim() : null
    if (!customerRef) continue

    const quoteNumber = String(quote.quoteNumber ?? quote.id)
    const result = await dispatchNotification(payload, {
      customerId: customerRef,
      type: 'quote_expiring',
      title: 'Presupuesto próximo a caducar',
      body: `El presupuesto ${quoteNumber} caduca en 7 días`,
      payload: {
        quoteNumber,
        href: '/intranet/contabilidad/presupuestos',
      },
      idempotencyKey: `quote:${quote.id}:expiring:${targetDay}`,
    })
    notificationsCreated += result.created
  }

  return { quotesChecked: docs.length, notificationsCreated }
}
