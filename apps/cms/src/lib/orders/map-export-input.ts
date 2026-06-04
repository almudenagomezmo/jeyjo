import type { OrderExportInput } from '@jeyjo/order-export'
import type { Order } from '@/payload-types'

import { parseOrderLineSnapshots } from '@/lib/orders/parse-line-snapshots'

export type CustomerExportFields = {
  erpCode: string | null
  taxId: string | null
  commercialName: string | null
}

export function mapOrderToExportInput(
  order: Order,
  customer?: CustomerExportFields | null,
): OrderExportInput {
  return {
    orderNumber: order.orderNumber?.trim() || String(order.id),
    createdAt: order.createdAt,
    customerErpCode: customer?.erpCode ?? null,
    customerTaxId: customer?.taxId ?? null,
    lines: parseOrderLineSnapshots(order.orderLineSnapshots),
  }
}
