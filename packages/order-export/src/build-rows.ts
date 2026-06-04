import type { AvansuiteRow, OrderExportInput } from './types.js'

function formatOrderDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

export function buildAvansuiteOrderRows(order: OrderExportInput): AvansuiteRow[] {
  const customerErpCode = order.customerErpCode?.trim() ?? ''
  const customerTaxId = order.customerTaxId?.trim() ?? ''
  const orderDate = formatOrderDate(order.createdAt)

  return order.lines.map((line) => ({
    webOrderNumber: order.orderNumber,
    orderDate,
    customerErpCode,
    customerTaxId,
    skuErp: line.skuErp.trim(),
    quantity: line.qty,
    unitPrice: line.unitPrice,
    lineDiscount: 0,
  }))
}

export function buildAvansuiteRowsForOrders(orders: OrderExportInput[]): AvansuiteRow[] {
  return orders.flatMap((order) => buildAvansuiteOrderRows(order))
}
