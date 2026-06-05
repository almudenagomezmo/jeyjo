import type { Ga4Item } from '@/lib/analytics/ga4'

export type OrderPurchaseSnapshot = {
  orderNumber: string
  total: number
  tax?: number
  shipping?: number
  items: Ga4Item[]
  paid: boolean
}

export type OrderLineSnapshot = {
  lineId?: string
  skuErp?: string
  name?: string
  qty?: number
  unitPrice?: number
  lineTotal?: number
}

export function mapOrderLineSnapshots(
  orderNumber: string,
  amount: number | undefined,
  shippingCost: number | undefined,
  lines: unknown,
  paid: boolean,
): OrderPurchaseSnapshot | null {
  if (!Array.isArray(lines) || lines.length === 0) return null

  const items: Ga4Item[] = []
  for (const raw of lines) {
    if (!raw || typeof raw !== 'object') continue
    const line = raw as OrderLineSnapshot
    const sku = line.skuErp?.trim()
    if (!sku) continue
    items.push({
      item_id: sku,
      item_name: line.name,
      price: line.unitPrice,
      quantity: line.qty ?? 1,
    })
  }

  if (items.length === 0) return null

  const subtotal = items.reduce(
    (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1),
    0,
  )
  const shipping = shippingCost ?? 0
  const total = amount ?? subtotal + shipping
  const tax = Math.max(0, total - subtotal - shipping)

  return {
    orderNumber,
    total,
    tax: tax > 0 ? tax : undefined,
    shipping: shipping > 0 ? shipping : undefined,
    items,
    paid,
  }
}
