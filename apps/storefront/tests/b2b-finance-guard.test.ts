import { describe, expect, it } from 'vitest'

import type { CustomerContext } from '@/lib/auth/customer-context'
import { canAccessSection, sectionForIntranetPath } from '@/lib/b2b/permissions'

const subuserNoFinance: CustomerContext = {
  userId: 'u2',
  customerId: 'c1',
  email: 'compras@empresa.com',
  role: 'b2b_subuser',
  commercialName: 'Empresa',
  taxId: 'B123',
  phone: null,
  customerGroup: 2,
  validatedAt: '2026-01-01T00:00:00.000Z',
  mfaEnabled: false,
  isCompany: true,
  billingAddressLine1: null,
  billingCity: null,
  billingPostalCode: null,
  billingCountry: 'ES',
  defaultPaymentMethod: null,
  displayName: 'Compras',
  permissionsRaw: { finance: false, orders: true, account: false },
  isActive: true,
  parentCustomerId: 'c1',
}

describe('RF-003 finance access guard', () => {
  it('maps facturas to finance section', () => {
    expect(sectionForIntranetPath('/intranet/contabilidad/facturas')).toBe('finance')
  })

  it('denies finance section for subuser without permission', () => {
    expect(canAccessSection(subuserNoFinance, 'finance')).toBe(false)
  })
})
