import { describe, expect, it } from 'vitest'

import {
  assertAllowedReviewTransition,
  isStaffReviewTransition,
} from '@/collections/ProductReviews/status-transitions'

describe('product review status transitions', () => {
  it('allows pending to approved or rejected', () => {
    expect(isStaffReviewTransition('pending', 'approved')).toBe(true)
    expect(isStaffReviewTransition('pending', 'rejected')).toBe(true)
    expect(() => assertAllowedReviewTransition('pending', 'approved')).not.toThrow()
  })

  it('rejects pending to pending as no-op', () => {
    expect(() => assertAllowedReviewTransition('pending', 'pending')).not.toThrow()
  })

  it('allows approved to rejected', () => {
    expect(isStaffReviewTransition('approved', 'rejected')).toBe(true)
  })

  it('allows rejected to approved', () => {
    expect(isStaffReviewTransition('rejected', 'approved')).toBe(true)
  })

  it('rejects invalid status values', () => {
    expect(() => assertAllowedReviewTransition('pending', 'invalid' as 'pending')).toThrow()
  })
})
