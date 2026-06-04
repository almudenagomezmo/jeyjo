import { describe, expect, it } from 'vitest'

import { registerSchema } from '@/lib/auth/register-schema'

describe('registerSchema', () => {
  const base = {
    email: 'test@example.com',
    password: 'password1',
    commercialName: 'Acme',
    phone: '600000000',
    isCompany: false,
    billingAddressLine1: 'Calle 1',
    billingCity: 'Madrid',
    billingPostalCode: '28001',
    billingCountry: 'ES',
  }

  it('accepts consumer registration', () => {
    const result = registerSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it('requires tax_id when isCompany', () => {
    const result = registerSchema.safeParse({ ...base, isCompany: true })
    expect(result.success).toBe(false)
  })

  it('accepts company with tax_id', () => {
    const result = registerSchema.safeParse({ ...base, isCompany: true, taxId: 'B12345678' })
    expect(result.success).toBe(true)
  })
})
