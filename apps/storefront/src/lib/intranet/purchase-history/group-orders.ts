import type {
  PurchaseHistoryFilters,
  PurchaseHistoryOrderGroup,
  RawPurchaseHistoryLine,
} from './types'

function purchasedDate(value: string): string {
  return value.slice(0, 10)
}

export function orderKeyFromLine(line: RawPurchaseHistoryLine): string {
  if (line.orderId != null) return `web-${line.orderId}`
  return `erp-${line.purchasedAt}-${line.department ?? ''}`
}

export function groupRawLinesIntoOrders(lines: RawPurchaseHistoryLine[]): PurchaseHistoryOrderGroup[] {
  const byKey = new Map<string, PurchaseHistoryOrderGroup>()

  for (const line of lines) {
    const sku = line.sku.trim()
    if (!sku) continue

    const key = orderKeyFromLine(line)
    let group = byKey.get(key)
    if (!group) {
      group = {
        orderKey: key,
        orderId: line.orderId ?? null,
        orderNumber: line.orderNumber ?? null,
        orderStatus: line.orderStatus ?? null,
        purchasedAt: line.purchasedAt,
        department: line.department ?? null,
        lines: [],
      }
      byKey.set(key, group)
    }

    group.lines.push({
      sku,
      qty: line.quantity,
      historicalUnitPrice: line.historicalUnitPrice,
    })
  }

  return [...byKey.values()].sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
}

export function filterOrderGroups(
  groups: PurchaseHistoryOrderGroup[],
  filters: PurchaseHistoryFilters,
): PurchaseHistoryOrderGroup[] {
  const skuNeedle = filters.sku?.trim().toLowerCase()
  const dept = filters.department?.trim()
  const status = filters.status?.trim()

  return groups
    .map((group) => {
      let lines = group.lines
      if (skuNeedle) {
        lines = lines.filter((line) => line.sku.toLowerCase().includes(skuNeedle))
      }
      return { ...group, lines }
    })
    .filter((group) => {
      if (group.lines.length === 0) return false
      if (filters.from && purchasedDate(group.purchasedAt) < filters.from) return false
      if (filters.to && purchasedDate(group.purchasedAt) > filters.to) return false
      if (dept && (group.department ?? '').toLowerCase() !== dept.toLowerCase()) return false
      if (status && group.orderStatus !== status) return false
      return true
    })
}
