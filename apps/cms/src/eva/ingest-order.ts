import type { Payload } from 'payload'

import type { SkaiOrderPayload } from '@/eva/types'

type OrderLineSnapshot = {
  lineId: string
  skuErp: string
  name: string
  qty: number
  unitPrice: number
  lineTotal: number
}

function mapLines(lines: SkaiOrderPayload['lines']): OrderLineSnapshot[] {
  return lines.map((line, index) => {
    const lineTotal = Math.round(line.qty * line.unitPrice * 100) / 100
    return {
      lineId: `eva-${index + 1}`,
      skuErp: line.skuErp,
      name: line.name,
      qty: line.qty,
      unitPrice: line.unitPrice,
      lineTotal,
    }
  })
}

function buildOrderNumber(externalId: string): string {
  const safe = externalId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40)
  return safe.startsWith('EVA-') ? safe : `EVA-${safe}`
}

export async function ingestSkaiOrder(
  payload: Payload,
  input: SkaiOrderPayload,
): Promise<{ id: number; orderNumber: string; created: boolean }> {
  const externalId = input.skaiExternalId.trim()
  if (!externalId) {
    throw new Error('skaiExternalId is required')
  }

  const existing = await payload.find({
    collection: 'orders',
    where: { skaiExternalId: { equals: externalId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    const doc = existing.docs[0]
    return {
      id: doc.id as number,
      orderNumber: (doc.orderNumber as string | null) ?? buildOrderNumber(externalId),
      created: false,
    }
  }

  const snapshots = mapLines(input.lines)
  const amount = snapshots.reduce((sum, line) => sum + line.lineTotal, 0)
  const orderNumber = buildOrderNumber(externalId)

  const created = await payload.create({
    collection: 'orders',
    data: {
      orderNumber,
      skaiExternalId: externalId,
      origin: 'eva',
      jeyjoStatus: 'pending_confirmation',
      validatedEva: false,
      customerRef: input.customerRef ?? null,
      guestEmail: input.guestEmail ?? null,
      customerNotes: input.customerNotes ?? null,
      amount,
      orderLineSnapshots: snapshots,
      items: [],
      paymentMethodCode: 'erp_default',
      paymentMethodLabel: 'Pendiente validación EVA',
      gateway: 'erp',
    } as never,
    overrideAccess: true,
  })

  return {
    id: created.id as number,
    orderNumber,
    created: true,
  }
}
