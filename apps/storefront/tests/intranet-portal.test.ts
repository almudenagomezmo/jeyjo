import { describe, expect, it } from 'vitest'

import { buildIntranetBreadcrumbs } from '@/lib/intranet/breadcrumbs'
import { isIntranetNavItemActive } from '@/lib/intranet/nav-active'
import {
  CONTABILIDAD_SUBNAV,
  INTRANET_PRIMARY_NAV,
  getScaffoldForPath,
} from '@/lib/intranet/navigation'
import { isPortalModeFromHeaders, isIntranetPath } from '@/lib/intranet/portal-mode'
import { isB2bValidated, loginRedirectPath } from '@/lib/auth/redirect'
import type { CustomerContext } from '@/lib/auth/customer-context'

const validatedB2b: CustomerContext = {
  userId: 'u1',
  customerId: 'c1',
  email: 'b2b@test.com',
  role: 'b2b_superadmin',
  commercialName: 'Empresa Test SL',
  taxId: 'B12345678',
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
}

describe('intranet navigation config', () => {
  it('defines nine primary sections', () => {
    expect(INTRANET_PRIMARY_NAV).toHaveLength(9)
  })

  it('defines five contabilidad subsections', () => {
    expect(CONTABILIDAD_SUBNAV).toHaveLength(5)
  })

  it('provides scaffolds for pending leaf routes', () => {
    expect(getScaffoldForPath('/intranet/pedidos')).toBeFalsy()
    expect(getScaffoldForPath('/intranet/pedido-rapido')?.roadmapRef).toContain('#24')
    expect(getScaffoldForPath('/intranet/contabilidad/facturas')?.roadmapRef).toContain('#37')
  })
})

describe('isIntranetNavItemActive', () => {
  it('activates pedidos section only on pedidos path', () => {
    expect(isIntranetNavItemActive('/intranet/pedidos', '/intranet/pedidos')).toBe(true)
    expect(isIntranetNavItemActive('/intranet/pedidos', '/intranet/pedido-rapido')).toBe(false)
    expect(isIntranetNavItemActive('/intranet', '/intranet/pedidos')).toBe(false)
  })

  it('activates contabilidad parent for nested routes', () => {
    expect(isIntranetNavItemActive('/intranet/contabilidad/vencimientos', '/intranet/contabilidad')).toBe(
      true,
    )
  })
})

describe('buildIntranetBreadcrumbs', () => {
  it('builds contabilidad vencimientos trail', () => {
    expect(buildIntranetBreadcrumbs('/intranet/contabilidad/vencimientos')).toEqual([
      { label: 'Portal', href: '/intranet' },
      { label: 'Contabilidad', href: '/intranet/contabilidad' },
      { label: 'Vencimientos', href: '/intranet/contabilidad/vencimientos' },
    ])
  })

  it('returns only portal crumb on dashboard', () => {
    expect(buildIntranetBreadcrumbs('/intranet')).toEqual([{ label: 'Portal', href: '/intranet' }])
  })
})

describe('portal mode helpers', () => {
  it('detects portal header', () => {
    const headers = new Headers({ 'x-jeyjo-portal': '1' })
    expect(isPortalModeFromHeaders(headers)).toBe(true)
  })

  it('matches intranet paths', () => {
    expect(isIntranetPath('/intranet')).toBe(true)
    expect(isIntranetPath('/intranet/pedidos')).toBe(true)
    expect(isIntranetPath('/cuenta')).toBe(false)
  })
})

describe('B2B intranet guards', () => {
  it('redirects validated B2B login to intranet', () => {
    expect(loginRedirectPath(validatedB2b)).toBe('/intranet')
    expect(isB2bValidated(validatedB2b)).toBe(true)
  })

  it('blocks B2C from intranet access check', () => {
    const b2c = { ...validatedB2b, customerGroup: 1, validatedAt: '2026-01-01T00:00:00.000Z', role: 'b2c' as const }
    expect(isB2bValidated(b2c)).toBe(false)
  })
})
