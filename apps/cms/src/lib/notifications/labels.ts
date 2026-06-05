import type { JeyjoOrderStatus } from '@/collections/Orders/status-transitions'

const ORDER_STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const QUOTE_STATUS_LABELS: Record<string, string> = {
  sent: 'Enviado',
  accepted: 'Aceptado',
  cancelled: 'Cancelado',
}

export function orderStatusLabel(status: JeyjoOrderStatus | string): string {
  return ORDER_STATUS_LABELS[status] ?? status
}

export function quoteStatusLabel(status: string): string {
  return QUOTE_STATUS_LABELS[status] ?? status
}
