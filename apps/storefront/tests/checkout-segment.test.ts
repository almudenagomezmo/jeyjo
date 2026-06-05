import { describe, expect, it } from 'vitest'

import type { CustomerContext } from '@/lib/auth/customer-context'
import { resolveCheckoutSegment } from '@/lib/checkout/segment'

function ctx(partial: Partial<CustomerContext>): CustomerContext {
  return {
    userId: 'u1',
    customerId: 'c1',
    email: 'a@b.com',
    role: 'b2c',
    commercialName: 'Test',
    taxId: null,
    phone: null,
    customerGroup: 2,
    validatedAt: null,
    mfaEnabled: false,
    isCompany: true,
    billingAddressLine1: null,
    billingCity: null,
    billingPostalCode: null,
    billingCountry: 'ES',
    defaultPaymentMethod: null,
    displayName: null,
    permissionsRaw: {},
    isActive: true,
    parentCustomerId: null,
    ...partial,
  }
}

describe('resolveCheckoutSegment', () => {
  it('returns b2c for guest', () => {
    expect(resolveCheckoutSegment(null)).toBe('b2c')
  })

  it('returns b2c for pending B2B registration', () => {
    expect(
      resolveCheckoutSegment(
        ctx({ customerGroup: 3, validatedAt: null }),
      ),
    ).toBe('b2c')
  })

  it('returns b2b for validated B2B customer', () => {
    expect(
      resolveCheckoutSegment(
        ctx({ customerGroup: 3, validatedAt: '2025-01-01T00:00:00Z' }),
      ),
    ).toBe('b2b')
  })
})
