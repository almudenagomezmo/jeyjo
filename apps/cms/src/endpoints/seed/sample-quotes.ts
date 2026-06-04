import type { Payload, PayloadRequest } from 'payload'

const REQUESTED_LINES = [
  {
    lineId: 'q-1',
    skuErp: 'REF-QUOTE-001',
    name: 'Cuaderno A4 80h',
    qty: 24,
    unitPrice: 1.2,
    lineTotal: 28.8,
  },
  {
    lineId: 'q-2',
    skuErp: 'REF-QUOTE-002',
    name: 'Bolígrafo negro',
    qty: 12,
    unitPrice: 0.65,
    lineTotal: 7.8,
  },
]

const ACCEPTED_LINES = [
  {
    lineId: 'q-3',
    skuErp: 'REF-QUOTE-003',
    name: 'Archivador A4',
    qty: 6,
    unitPrice: 3.5,
    lineTotal: 21,
  },
]

export async function seedSampleQuotes({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  const existing = await payload.find({
    collection: 'quotes',
    where: { quoteNumber: { equals: 'P-2026-00001' } },
    limit: 1,
    depth: 0,
    req,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    payload.logger.info('— Sample quotes already exist')
    return
  }

  const requestedTotal = REQUESTED_LINES.reduce((s, l) => s + l.lineTotal, 0)
  const acceptedTotal = ACCEPTED_LINES.reduce((s, l) => s + l.lineTotal, 0)

  await payload.create({
    collection: 'quotes',
    data: {
      quoteNumber: 'P-2026-00001',
      status: 'requested',
      segment: 'b2c',
      guestEmail: 'cliente.presupuesto@test.com',
      subtotal: requestedTotal,
      shippingCost: 5,
      amount: requestedTotal + 5,
      deliveryMethod: 'home',
      lineSnapshots: REQUESTED_LINES,
      customerNotes: 'Presupuesto seed — estado Solicitado',
    },
    req,
    overrideAccess: true,
  })

  await payload.create({
    collection: 'quotes',
    data: {
      quoteNumber: 'P-2026-00002',
      status: 'accepted',
      segment: 'b2b',
      guestEmail: 'empresa@test.com',
      subtotal: acceptedTotal,
      shippingCost: 0,
      amount: acceptedTotal,
      deliveryMethod: 'pickup_alfaro',
      pickupStoreLabel: 'Recogida en tienda — Alfaro',
      lineSnapshots: ACCEPTED_LINES,
      customerNotes: 'Presupuesto seed — listo para convertir',
    },
    req,
    overrideAccess: true,
  })

  payload.logger.info('— Sample quotes P-2026-00001 and P-2026-00002 created')
}
