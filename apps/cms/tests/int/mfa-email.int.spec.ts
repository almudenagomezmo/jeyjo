import { describe, expect, it } from 'vitest'

import {
  clearEmailMfaCode,
  storeEmailMfaCode,
  verifyEmailMfaCode,
} from '@/lib/mfa-email-codes'
import { getMfaMode, isEmailMfaMode } from '@/lib/mfa-mode'

describe('mfa email codes', () => {
  it('stores and verifies a 6-digit code', () => {
    const code = storeEmailMfaCode('user-1')
    expect(code).toMatch(/^\d{6}$/)
    expect(verifyEmailMfaCode('user-1', code)).toBe(true)
    expect(verifyEmailMfaCode('user-1', code)).toBe(false)
  })

  it('rejects invalid codes', () => {
    storeEmailMfaCode(42)
    expect(verifyEmailMfaCode(42, '000000')).toBe(false)
  })

  it('clears pending codes', () => {
    const code = storeEmailMfaCode('user-2')
    clearEmailMfaCode('user-2')
    expect(verifyEmailMfaCode('user-2', code)).toBe(false)
  })

  it('can verify without consuming the code', () => {
    const code = storeEmailMfaCode('user-3')
    expect(verifyEmailMfaCode('user-3', code, { consume: false })).toBe(true)
    expect(verifyEmailMfaCode('user-3', code)).toBe(true)
  })
})

describe('mfa mode', () => {
  it('uses email mode outside production', () => {
    expect(isEmailMfaMode()).toBe(process.env.NODE_ENV !== 'production')
    expect(getMfaMode()).toBe(process.env.NODE_ENV === 'production' ? 'totp' : 'email')
  })
})
