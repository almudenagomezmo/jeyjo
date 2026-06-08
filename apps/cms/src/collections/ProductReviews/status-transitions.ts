export const REVIEW_STATUS_VALUES = ['pending', 'approved', 'rejected'] as const

export type ReviewStatus = (typeof REVIEW_STATUS_VALUES)[number]

const STAFF_REVIEW_TRANSITIONS: Partial<Record<ReviewStatus, ReviewStatus[]>> = {
  pending: ['approved', 'rejected'],
  approved: ['rejected'],
  rejected: ['approved'],
}

export function isReviewStatus(value: string | null | undefined): value is ReviewStatus {
  return REVIEW_STATUS_VALUES.includes(value as ReviewStatus)
}

export function isStaffReviewTransition(
  from: ReviewStatus | null | undefined,
  to: ReviewStatus | null | undefined,
): boolean {
  if (!from || !to || from === to) return true
  const allowed = STAFF_REVIEW_TRANSITIONS[from]
  return Boolean(allowed?.includes(to))
}

export function assertAllowedReviewTransition(
  from: ReviewStatus | null | undefined,
  to: ReviewStatus | null | undefined,
): void {
  if (!to || !isReviewStatus(to)) {
    throw new Error(`Invalid review status: ${to ?? 'empty'}`)
  }
  if (!from || from === to) return
  if (!isStaffReviewTransition(from, to)) {
    throw new Error(`Review status transition not allowed: ${from} → ${to}`)
  }
}
