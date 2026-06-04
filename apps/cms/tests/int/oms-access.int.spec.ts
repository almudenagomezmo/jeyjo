import { describe, it, expect } from 'vitest'

import { canAccessOms, canReadCollection } from '@/access/staffRoles'

describe('OMS access (CA-BACKEND-006)', () => {
  it('administracion can access OMS and quotes', () => {
    expect(canAccessOms({ staffRoles: ['administracion'] })).toBe(true)
    expect(canReadCollection({ staffRoles: ['administracion'] }, 'orders')).toBe(true)
    expect(canReadCollection({ staffRoles: ['administracion'] }, 'quotes')).toBe(true)
  })

  it('catalog role cannot access OMS, orders or quotes', () => {
    expect(canAccessOms({ staffRoles: ['catalogo'] })).toBe(false)
    expect(canReadCollection({ staffRoles: ['catalogo'] }, 'orders')).toBe(false)
    expect(canReadCollection({ staffRoles: ['catalogo'] }, 'quotes')).toBe(false)
  })
})
