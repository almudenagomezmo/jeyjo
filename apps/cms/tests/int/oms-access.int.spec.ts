import { describe, it, expect } from 'vitest'

import { canAccessOms, canReadCollection } from '@/access/staffRoles'

describe('OMS access (CA-BACKEND-006)', () => {
  it('administracion can access OMS', () => {
    expect(canAccessOms({ staffRoles: ['administracion'] })).toBe(true)
    expect(canReadCollection({ staffRoles: ['administracion'] }, 'orders')).toBe(true)
  })

  it('catalog role cannot access OMS or orders', () => {
    expect(canAccessOms({ staffRoles: ['catalogo'] })).toBe(false)
    expect(canReadCollection({ staffRoles: ['catalogo'] }, 'orders')).toBe(false)
  })
})
