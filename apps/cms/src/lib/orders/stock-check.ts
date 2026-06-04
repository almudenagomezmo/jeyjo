import type { Payload } from 'payload'

import { parseOrderLineSnapshots } from '@/lib/orders/parse-line-snapshots'

export async function computeStockValidationPending(
  payload: Payload,
  orderLineSnapshots: unknown,
): Promise<boolean> {
  const lines = parseOrderLineSnapshots(orderLineSnapshots)
  if (!lines.length) return false

  const skus = [...new Set(lines.map((l) => l.skuErp))]
  const found = await payload.find({
    collection: 'products',
    where: { skuErp: { in: skus } },
    limit: skus.length,
    depth: 0,
    overrideAccess: true,
  })

  const stockBySku = new Map<string, number>()
  for (const doc of found.docs) {
    const sku = doc.skuErp?.trim()
    if (!sku) continue
    const erpStock = typeof doc.erpStock === 'number' ? doc.erpStock : 0
    stockBySku.set(sku, erpStock)
  }

  for (const line of lines) {
    const available = stockBySku.get(line.skuErp)
    if (available === undefined) continue
    if (line.qty > available) return true
  }

  return false
}
