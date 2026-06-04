import { describe, expect, it } from 'vitest'

import { pricingCustomerGroup, pricingCustomerId } from '@/lib/auth/customer-context'
import type { CustomerContext } from '@/lib/auth/customer-context'

const base: CustomerContext = {
  userId: 'u1',
  customerId: 'c1',
  email: 'a@b.com',
  role: 'pending',
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
}

describe('pricingCustomerGroup', () => {
  it('returns 1 for null context', () => {
    expect(pricingCustomerGroup(null)).toBe(1)
    expect(pricingCustomerId(null)).toBeNull()
  })

  it('forces B2C pricing for pending B2B', () => {
    expect(pricingCustomerGroup(base)).toBe(1)
    expect(pricingCustomerId(base)).toBeNull()
  })

  it('uses B2B customer id when validated', () => {
    const validated = { ...base, validatedAt: new Date().toISOString(), role: 'b2b_superadmin' as const }
    expect(pricingCustomerGroup(validated)).toBe(2)
    expect(pricingCustomerId(validated)).toBe('c1')
  })
})
