import { describe, expect, it } from 'vitest'

import type { CustomerContext } from '@/lib/auth/customer-context'
import {
  canAccessSection,
  filterEmpresaNav,
  parseB2bPermissions,
  requiresOrderCompanyApproval,
  resolveEffectivePermissions,
  sectionForEmpresaPath,
} from '@/lib/b2b/permissions'
import { EMPRESA_PRIMARY_NAV } from '@/lib/intranet/navigation'

const superadmin: CustomerContext = {
  userId: 'u1',
  customerId: 'c1',
  email: 'admin@empresa.com',
  role: 'b2b_superadmin',
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
  displayName: 'Admin',
  permissionsRaw: {},
  isActive: true,
  parentCustomerId: null,
}

const subuserNoFinance: CustomerContext = {
  ...superadmin,
  userId: 'u2',
  email: 'compras@empresa.com',
  role: 'b2b_subuser',
  displayName: 'Compras',
  permissionsRaw: { finance: false, orders: true, account: false, ordersRequireApproval: true },
}

describe('b2b permissions', () => {
  it('superadmin has full effective permissions', () => {
    const perms = resolveEffectivePermissions(superadmin)
    expect(perms.finance).toBe(true)
    expect(perms.orders).toBe(true)
    expect(perms.isSuperadmin).toBe(true)
  })

  it('subuser respects finance flag (RF-003)', () => {
    expect(canAccessSection(subuserNoFinance, 'finance')).toBe(false)
    expect(canAccessSection(subuserNoFinance, 'orders')).toBe(true)
  })

  it('maps contabilidad path to finance section', () => {
    expect(sectionForEmpresaPath('/cuenta/empresa/contabilidad/facturas')).toBe('finance')
  })

  it('filters navigation for subuser without finance', () => {
    const nav = filterEmpresaNav(EMPRESA_PRIMARY_NAV, subuserNoFinance)
    expect(nav.some((item) => item.href === '/cuenta/empresa/contabilidad')).toBe(false)
    expect(nav.some((item) => item.href === '/cuenta/empresa/pedidos')).toBe(true)
  })

  it('parseB2bPermissions applies defaults', () => {
    expect(parseB2bPermissions({})).toEqual({
      finance: false,
      orders: true,
      account: false,
      ordersRequireApproval: false,
    })
  })

  it('requiresOrderCompanyApproval only for flagged subusers', () => {
    expect(requiresOrderCompanyApproval(superadmin)).toBe(false)
    expect(requiresOrderCompanyApproval(subuserNoFinance)).toBe(true)
  })

  it('validated B2B owner with legacy pending role gets full nav', () => {
    const legacyOwner: CustomerContext = {
      ...superadmin,
      role: 'pending',
    }
    const nav = filterEmpresaNav(EMPRESA_PRIMARY_NAV, legacyOwner)
    expect(nav.length).toBe(EMPRESA_PRIMARY_NAV.length)
    expect(canAccessSection(legacyOwner, 'finance')).toBe(true)
  })
})
