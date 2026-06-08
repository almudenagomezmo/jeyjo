import { describe, expect, it } from 'vitest'

import { buildIntranetBreadcrumbs } from '@/lib/intranet/breadcrumbs'
import { isIntranetNavItemActive } from '@/lib/intranet/nav-active'
import {
  CONTABILIDAD_SUBNAV,
  EMPRESA_PRIMARY_NAV,
  getScaffoldForPath,
} from '@/lib/intranet/navigation'
import { isEmpresaPath, isPortalModeFromHeaders } from '@/lib/intranet/portal-mode'
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
  displayName: null,
  permissionsRaw: {},
  isActive: true,
  parentCustomerId: null,
}

describe('empresa navigation config', () => {
  it('defines eight primary empresa sections', () => {
    expect(EMPRESA_PRIMARY_NAV).toHaveLength(8)
  })

  it('defines five contabilidad subsections', () => {
    expect(CONTABILIDAD_SUBNAV).toHaveLength(5)
  })

  it('contabilidad routes are operational without scaffolds', () => {
    expect(getScaffoldForPath('/cuenta/empresa/pedidos')).toBeFalsy()
    expect(getScaffoldForPath('/cuenta/empresa/pedido-rapido')).toBeFalsy()
    expect(getScaffoldForPath('/cuenta/empresa/contabilidad/facturas')).toBeFalsy()
    expect(getScaffoldForPath('/cuenta/empresa/contacto')?.roadmapRef).toContain('#28')
  })
})

describe('isIntranetNavItemActive', () => {
  it('activates pedidos section only on pedidos path', () => {
    expect(isIntranetNavItemActive('/cuenta/empresa/pedidos', '/cuenta/empresa/pedidos')).toBe(true)
    expect(isIntranetNavItemActive('/cuenta/empresa/pedidos', '/cuenta/empresa/pedido-rapido')).toBe(false)
    expect(isIntranetNavItemActive('/cuenta', '/cuenta/empresa/pedidos')).toBe(false)
  })

  it('activates contabilidad parent for nested routes', () => {
    expect(
      isIntranetNavItemActive('/cuenta/empresa/contabilidad/vencimientos', '/cuenta/empresa/contabilidad'),
    ).toBe(true)
  })
})

describe('buildIntranetBreadcrumbs', () => {
  it('builds contabilidad vencimientos trail', () => {
    expect(buildIntranetBreadcrumbs('/cuenta/empresa/contabilidad/vencimientos')).toEqual([
      { label: 'Mi cuenta', href: '/cuenta' },
      { label: 'Contabilidad', href: '/cuenta/empresa/contabilidad' },
      { label: 'Vencimientos', href: '/cuenta/empresa/contabilidad/vencimientos' },
    ])
  })

  it('returns only account crumb on dashboard', () => {
    expect(buildIntranetBreadcrumbs('/cuenta')).toEqual([{ label: 'Mi cuenta', href: '/cuenta' }])
  })
})

describe('portal mode helpers', () => {
  it('detects portal header', () => {
    const headers = new Headers({ 'x-jeyjo-portal': '1' })
    expect(isPortalModeFromHeaders(headers)).toBe(true)
  })

  it('matches empresa paths', () => {
    expect(isEmpresaPath('/cuenta/empresa')).toBe(true)
    expect(isEmpresaPath('/cuenta/empresa/pedidos')).toBe(true)
    expect(isEmpresaPath('/cuenta')).toBe(false)
  })
})

describe('B2B cuenta guards', () => {
  it('redirects validated B2B login to cuenta', () => {
    expect(loginRedirectPath(validatedB2b)).toBe('/cuenta')
    expect(isB2bValidated(validatedB2b)).toBe(true)
  })

  it('blocks B2C from empresa access check', () => {
    const b2c = { ...validatedB2b, customerGroup: 1, validatedAt: '2026-01-01T00:00:00.000Z', role: 'b2c' as const }
    expect(isB2bValidated(b2c)).toBe(false)
  })
})
