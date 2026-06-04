import type { Payload, PayloadRequest } from 'payload'

const EVA_LINES = [
  { lineId: 'eva-1', skuErp: 'REF-EVA-001', name: 'Bolígrafo azul', qty: 10, unitPrice: 0.85, lineTotal: 8.5 },
  { lineId: 'eva-2', skuErp: 'REF-EVA-002', name: 'Bloc notas A4', qty: 5, unitPrice: 2.4, lineTotal: 12 },
  { lineId: 'eva-3', skuErp: 'REF-EVA-003', name: 'Carpeta archivador', qty: 2, unitPrice: 4.15, lineTotal: 8.3 },
]

export async function seedEvaPendingOrder({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  const existing = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: 'EVA-2026-0015' } },
    limit: 1,
    depth: 0,
    req,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    payload.logger.info('— EVA sample order already exists')
    return
  }

  const total = EVA_LINES.reduce((sum, line) => sum + line.lineTotal, 0)

  await payload.create({
    collection: 'orders',
    data: {
      orderNumber: 'EVA-2026-0015',
      origin: 'eva',
      jeyjoStatus: 'pending_confirmation',
      validatedEva: false,
      guestEmail: 'empresa@test.com',
      customerNotes: 'Pedido generado por EVA (seed OMS)',
      amount: total,
      orderLineSnapshots: EVA_LINES,
      items: [],
    },
    req,
    overrideAccess: true,
  })

  payload.logger.info('— EVA sample order EVA-2026-0015 created')
}
