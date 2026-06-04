import type { OrderExportInput, ValidationIssue, ValidationResult } from './types.js'

function hasCustomerIdentifier(order: OrderExportInput): boolean {
  return Boolean(order.customerErpCode?.trim() || order.customerTaxId?.trim())
}

export function validateAvansuiteOrder(order: OrderExportInput): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const num = order.orderNumber

  if (!order.orderNumber?.trim()) {
    issues.push({ orderNumber: num || '?', field: 'orderNumber', message: 'Missing order number' })
  }

  if (!hasCustomerIdentifier(order)) {
    issues.push({
      orderNumber: num,
      field: 'customer',
      message: 'Missing customer ERP code and tax id (CIF)',
    })
  }

  if (!order.lines.length) {
    issues.push({ orderNumber: num, field: 'lines', message: 'Order has no line items' })
  }

  for (const line of order.lines) {
    if (!line.skuErp?.trim()) {
      issues.push({ orderNumber: num, field: 'skuErp', message: 'Line missing ERP reference' })
    }
    if (!Number.isFinite(line.qty) || line.qty <= 0) {
      issues.push({
        orderNumber: num,
        field: 'quantity',
        message: `Invalid quantity for SKU ${line.skuErp || '?'}`,
      })
    }
    if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
      issues.push({
        orderNumber: num,
        field: 'unitPrice',
        message: `Invalid unit price for SKU ${line.skuErp || '?'}`,
      })
    }
  }

  return issues
}

export function validateAvansuiteOrders(orders: OrderExportInput[]): ValidationResult {
  const issues = orders.flatMap((order) => validateAvansuiteOrder(order))
  return { ok: issues.length === 0, issues }
}
