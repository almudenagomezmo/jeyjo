export const RMA_STATUS_VALUES = [
  'requested',
  'in_review',
  'authorized',
  'rejected',
] as const

export type RmaStatus = (typeof RMA_STATUS_VALUES)[number]

const STAFF_RMA_TRANSITIONS: Partial<Record<RmaStatus, RmaStatus[]>> = {
  requested: ['in_review'],
  in_review: ['authorized', 'rejected'],
}

export const RMA_OPEN_STATUSES: RmaStatus[] = ['requested', 'in_review']
export const RMA_CLOSED_STATUSES: RmaStatus[] = ['authorized', 'rejected']

export function isRmaStatus(value: string | null | undefined): value is RmaStatus {
  return RMA_STATUS_VALUES.includes(value as RmaStatus)
}

export function isStaffRmaTransition(
  from: RmaStatus | null | undefined,
  to: RmaStatus | null | undefined,
): boolean {
  if (!from || !to || from === to) return true
  const allowed = STAFF_RMA_TRANSITIONS[from]
  return Boolean(allowed?.includes(to))
}

export function assertAllowedRmaTransition(
  from: RmaStatus | null | undefined,
  to: RmaStatus | null | undefined,
): void {
  if (!to || !isRmaStatus(to)) {
    throw new Error(`Invalid RMA status: ${to ?? 'empty'}`)
  }
  if (!from || from === to) return
  if (!isStaffRmaTransition(from, to)) {
    throw new Error(`RMA status transition not allowed: ${from} → ${to}`)
  }
}

export function isTerminalRmaStatus(status: RmaStatus | null | undefined): boolean {
  return status === 'authorized' || status === 'rejected'
}
