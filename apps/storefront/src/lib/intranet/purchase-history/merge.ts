import type { MergedPurchaseHistoryLine, RawPurchaseHistoryLine } from './types'

function pickLatest(
  existing: MergedPurchaseHistoryLine,
  incoming: RawPurchaseHistoryLine,
): MergedPurchaseHistoryLine {
  if (incoming.purchasedAt > existing.lastPurchasedAt) {
    return {
      sku: existing.sku,
      usualQty: incoming.quantity,
      lastPurchasedAt: incoming.purchasedAt,
      historicalUnitPrice: incoming.historicalUnitPrice,
      department: incoming.department ?? existing.department,
      lastOrderStatus: incoming.orderStatus ?? null,
      lastOrderNumber: incoming.orderNumber ?? null,
      lastOrderId: incoming.orderId ?? null,
    }
  }
  return existing
}

export function mergePurchaseHistoryLines(
  sources: RawPurchaseHistoryLine[],
): MergedPurchaseHistoryLine[] {
  const bySku = new Map<string, MergedPurchaseHistoryLine>()

  for (const line of sources) {
    const sku = line.sku.trim()
    if (!sku) continue

    const existing = bySku.get(sku)
    if (!existing) {
      bySku.set(sku, {
        sku,
        usualQty: line.quantity,
        lastPurchasedAt: line.purchasedAt,
        historicalUnitPrice: line.historicalUnitPrice,
        department: line.department ?? null,
        lastOrderStatus: line.orderStatus ?? null,
        lastOrderNumber: line.orderNumber ?? null,
        lastOrderId: line.orderId ?? null,
      })
      continue
    }
    bySku.set(sku, pickLatest(existing, line))
  }

  return [...bySku.values()].sort((a, b) => b.lastPurchasedAt.localeCompare(a.lastPurchasedAt))
}
