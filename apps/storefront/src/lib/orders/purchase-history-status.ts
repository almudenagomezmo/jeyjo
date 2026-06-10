import { orderStatusLabel } from '@/lib/orders/customer-order-labels'

/** Fulfilled web orders — used for verified-purchase checks (e.g. product reviews). */
export const CONFIRMED_PURCHASE_STATUSES = new Set([
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
])

/** B2B orders placed on the web but not yet staff-confirmed still count in purchase history. */
export const PURCHASE_HISTORY_WEB_STATUSES = new Set([
  ...CONFIRMED_PURCHASE_STATUSES,
  'pending_confirmation',
  'pending_company_approval',
])

export type OrderStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export function orderStatusTone(status: string | null | undefined): OrderStatusTone {
  switch (status) {
    case 'pending_company_approval':
    case 'pending_confirmation':
    case 'pending_payment':
      return 'warning'
    case 'confirmed':
    case 'preparing':
      return 'info'
    case 'shipped':
    case 'delivered':
      return 'success'
    case 'cancelled':
      return 'danger'
    default:
      return 'neutral'
  }
}

export const PURCHASE_HISTORY_STATUS_OPTIONS = [...PURCHASE_HISTORY_WEB_STATUSES].map((status) => ({
  value: status,
  label: orderStatusLabel(status),
}))

export function purchaseHistoryInclusionNotice(): string {
  const labels = [...PURCHASE_HISTORY_WEB_STATUSES]
    .map((status) => orderStatusLabel(status))
    .join(', ')

  return `Este histórico muestra artículos de pedidos web con estado: ${labels}. No se incluyen pedidos cancelados ni pendientes de pago. Las compras importadas del ERP aparecen sin estado de pedido web.`
}
