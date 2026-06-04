export const QUOTE_STATUS_VALUES = [
  'requested',
  'in_review',
  'sent',
  'accepted',
  'ordered',
  'cancelled',
] as const

export type QuoteStatus = (typeof QUOTE_STATUS_VALUES)[number]

const STAFF_QUOTE_TRANSITIONS: Partial<Record<QuoteStatus, QuoteStatus[]>> = {
  requested: ['in_review', 'cancelled'],
  in_review: ['sent', 'cancelled'],
  sent: ['accepted', 'cancelled'],
  accepted: ['cancelled'],
}

export function isQuoteStatus(value: string | null | undefined): value is QuoteStatus {
  return QUOTE_STATUS_VALUES.includes(value as QuoteStatus)
}

export function isStaffQuoteTransition(
  from: QuoteStatus | null | undefined,
  to: QuoteStatus | null | undefined,
): boolean {
  if (!from || !to || from === to) return true
  const allowed = STAFF_QUOTE_TRANSITIONS[from]
  return Boolean(allowed?.includes(to))
}

export function assertAllowedQuoteTransition(
  from: QuoteStatus | null | undefined,
  to: QuoteStatus | null | undefined,
): void {
  if (!to || !isQuoteStatus(to)) {
    throw new Error(`Invalid quote status: ${to ?? 'empty'}`)
  }
  if (!from || from === to) return
  if (!isStaffQuoteTransition(from, to)) {
    throw new Error(`Quote status transition not allowed: ${from} → ${to}`)
  }
}

export function canConvertQuoteToOrder(status: QuoteStatus | null | undefined): boolean {
  return status === 'accepted'
}
