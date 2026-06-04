import { describe, it, expect } from 'vitest'

import {
  canReadCollection,
  canWriteCollection,
  hasStaffRole,
  isStaff,
} from '@/access/staffRoles'
import type { User } from '@/payload-types'

const catalogUser = {
  id: 1,
  staffRoles: ['catalogo'],
} as unknown as import('@/payload-types').User

const adminUser = {
  id: 2,
  staffRoles: ['administracion'],
} as unknown as import('@/payload-types').User

const superadmin = {
  id: 3,
  staffRoles: ['superadmin'],
} as unknown as import('@/payload-types').User

describe('staffRoles access matrix', () => {
  it('identifies staff membership', () => {
    expect(isStaff(catalogUser)).toBe(true)
    expect(isStaff({ id: 4, staffRoles: [] } as unknown as import('@/payload-types').User)).toBe(false)
  })

  it('catalog role cannot read orders', () => {
    expect(canReadCollection(catalogUser, 'orders')).toBe(false)
    expect(canReadCollection(catalogUser, 'products')).toBe(true)
  })

  it('administracion can read orders but not write products', () => {
    expect(canReadCollection(adminUser, 'orders')).toBe(true)
    expect(canWriteCollection(adminUser, 'products', 'update')).toBe(false)
  })

  it('superadmin has full access', () => {
    expect(hasStaffRole(superadmin, ['catalogo'])).toBe(true)
    expect(canWriteCollection(superadmin, 'orders', 'update')).toBe(true)
  })
})

describe('mfa session cookie', () => {
  it('creates and validates signed cookie', async () => {
    const { createMfaCookieValue, parseMfaCookieValue } = await import('@/lib/mfa-session')
    process.env.PAYLOAD_SECRET = 'test-secret'

    const value = createMfaCookieValue(42)
    expect(parseMfaCookieValue(value)).toBe(true)
    expect(parseMfaCookieValue('tampered')).toBe(false)
  })
})

describe('totp verification', () => {
  it('validates RFC6238 test secret', async () => {
    const { E2E_TOTP_SECRET, generateCurrentTotpCode, verifyTotpCode } = await import('@/lib/totp')
    const code = generateCurrentTotpCode(E2E_TOTP_SECRET)
    expect(verifyTotpCode(E2E_TOTP_SECRET, code)).toBe(true)
    expect(verifyTotpCode(E2E_TOTP_SECRET, '000000')).toBe(false)
  })
})
