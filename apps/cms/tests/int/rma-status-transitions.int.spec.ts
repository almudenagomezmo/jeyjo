import { describe, expect, it } from 'vitest'

import {
  assertAllowedRmaTransition,
  isStaffRmaTransition,
  isTerminalRmaStatus,
} from '@/collections/RmaIncidents/status-transitions'

describe('RMA status transitions', () => {
  it('allows requested to in_review', () => {
    expect(isStaffRmaTransition('requested', 'in_review')).toBe(true)
    expect(() => assertAllowedRmaTransition('requested', 'in_review')).not.toThrow()
  })

  it('rejects requested to authorized', () => {
    expect(isStaffRmaTransition('requested', 'authorized')).toBe(false)
    expect(() => assertAllowedRmaTransition('requested', 'authorized')).toThrow()
  })

  it('allows in_review to authorized or rejected', () => {
    expect(isStaffRmaTransition('in_review', 'authorized')).toBe(true)
    expect(isStaffRmaTransition('in_review', 'rejected')).toBe(true)
  })

  it('terminal statuses are authorized and rejected', () => {
    expect(isTerminalRmaStatus('authorized')).toBe(true)
    expect(isTerminalRmaStatus('rejected')).toBe(true)
    expect(isTerminalRmaStatus('requested')).toBe(false)
  })
})
