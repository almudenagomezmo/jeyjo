import type { OrderLineSnapshot } from '@jeyjo/order-export'

export function parseOrderLineSnapshots(raw: unknown): OrderLineSnapshot[] {
  if (!Array.isArray(raw)) return []

  const lines: OrderLineSnapshot[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const row = entry as Record<string, unknown>
    const skuErp = String(row.skuErp ?? row.sku ?? '').trim()
    const qty = Number(row.qty ?? row.quantity ?? 0)
    const unitPrice = Number(row.unitPrice ?? row.price ?? 0)
    if (!skuErp || !Number.isFinite(qty) || qty <= 0) continue
    lines.push({
      lineId: row.lineId != null ? String(row.lineId) : undefined,
      skuErp,
      name: row.name != null ? String(row.name) : undefined,
      qty,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      lineTotal: row.lineTotal != null ? Number(row.lineTotal) : undefined,
    })
  }
  return lines
}
