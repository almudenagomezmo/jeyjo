import type { Payload } from 'payload'
import { APIError } from 'payload'

export type OrderLineForIva = {
  product?: number | { id: number } | null
  ivaRateSnapshot?: number | null
}

export function isOrderConfirming(
  nextStatus: string | null | undefined,
  previousStatus: string | null | undefined,
): boolean {
  return nextStatus === 'confirmed' && previousStatus !== 'confirmed'
}

export async function applyIvaSnapshotToOrderLines({
  items,
  payload,
  requireAll,
}: {
  items: OrderLineForIva[] | undefined
  payload: Payload
  requireAll: boolean
}): Promise<void> {
  if (!items?.length) {
    if (requireAll) {
      throw new APIError('Order must have line items before confirmation', 400)
    }
    return
  }

  for (const item of items) {
    if (!item.product) {
      if (requireAll) {
        throw new APIError('Order line missing product at confirmation', 400)
      }
      continue
    }

    const productId = typeof item.product === 'object' ? item.product.id : item.product
    const product = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 0,
      overrideAccess: true,
    })

    const vatRate =
      product && 'vatRate' in product && product.vatRate != null
        ? (product.vatRate as number)
        : null

    if (vatRate == null) {
      if (requireAll) {
        throw new APIError(`Product ${productId} has no VAT rate for IVA snapshot`, 400)
      }
      continue
    }

    if (requireAll || item.ivaRateSnapshot == null) {
      item.ivaRateSnapshot = vatRate
    }
  }
}

export function mergeOrderItemIvaSnapshotField(
  fields: import('payload').Field[],
): import('payload').Field[] {
  return fields.map((field) => {
    if (!('name' in field) || field.name !== 'items' || field.type !== 'array') {
      return field
    }
    const subfields = 'fields' in field && Array.isArray(field.fields) ? field.fields : []
    if (subfields.some((f) => 'name' in f && f.name === 'ivaRateSnapshot')) {
      return field
    }
    return {
      ...field,
      fields: [
        ...subfields,
        {
          name: 'ivaRateSnapshot',
          type: 'number',
          label: 'IVA snapshot (%)',
          admin: {
            readOnly: true,
            description: 'Tipo de IVA vigente al confirmar el pedido (inmutable)',
          },
        },
      ],
    }
  })
}
