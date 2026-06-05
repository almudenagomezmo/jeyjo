import type { RmaReason, RmaStatus } from '@/lib/intranet/rma/types'

export const RMA_REASON_OPTIONS: { value: RmaReason; label: string }[] = [
  { value: 'wrong_item', label: 'Artículo incorrecto' },
  { value: 'defective', label: 'Artículo defectuoso' },
  { value: 'wrong_qty', label: 'Cantidad incorrecta' },
  { value: 'other', label: 'Otro' },
]

export const RMA_STATUS_LABELS: Record<RmaStatus, string> = {
  requested: 'Solicitada',
  in_review: 'En revisión',
  authorized: 'Autorizada',
  rejected: 'Rechazada',
}

export function rmaReasonLabel(reason: string): string {
  return RMA_REASON_OPTIONS.find((o) => o.value === reason)?.label ?? reason
}

export function rmaStatusLabel(status: string): string {
  if (status in RMA_STATUS_LABELS) {
    return RMA_STATUS_LABELS[status as RmaStatus]
  }
  return status
}

export const RMA_OPEN_STATUSES: RmaStatus[] = ['requested', 'in_review']
export const RMA_CLOSED_STATUSES: RmaStatus[] = ['authorized', 'rejected']

export function isOpenRmaStatus(status: string): boolean {
  return RMA_OPEN_STATUSES.includes(status as RmaStatus)
}
