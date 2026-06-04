import { describe, expect, it } from 'vitest'

import {
  isAccountLocked,
  isLoginAttemptBlocked,
  lockoutMessage,
  lockedUntilFromNow,
  MAX_FAILED_LOGIN_ATTEMPTS,
  nextFailedCount,
  resetLockoutFields,
  shouldLockAccount,
} from '@/lib/auth/lockout'

describe('auth lockout', () => {
  it('blocks sixth attempt after five failures', () => {
    expect(isLoginAttemptBlocked(5, null)).toBe(true)
    expect(isLoginAttemptBlocked(4, null)).toBe(false)
  })

  it('respects locked_until', () => {
    const future = lockedUntilFromNow()
    expect(isAccountLocked(future)).toBe(true)
    expect(isAccountLocked(null)).toBe(false)
  })

  it('increments and locks at threshold', () => {
    const afterFive = nextFailedCount(4)
    expect(afterFive).toBe(5)
    expect(shouldLockAccount(afterFive)).toBe(true)
    expect(lockoutMessage()).toContain(String(15))
    expect(MAX_FAILED_LOGIN_ATTEMPTS).toBe(5)
    expect(resetLockoutFields()).toEqual({ failed_login_count: 0, locked_until: null })
  })
})
