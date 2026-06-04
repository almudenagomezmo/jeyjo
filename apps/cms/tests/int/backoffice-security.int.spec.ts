import { describe, it, expect } from 'vitest'

import { canReadCollection, type StaffUserLike } from '@/access/staffRoles'

/**
 * CA-BACKEND-006: catalog-only staff must not read orders.
 * CA-AUTH-005: MFA helpers validated in staff-access.int.spec.ts.
 */
describe('backoffice security acceptance', () => {
  it('catalog role is denied orders (CA-BACKEND-006)', () => {
    const catalogUser: StaffUserLike = { staffRoles: ['catalogo'] }
    expect(canReadCollection(catalogUser, 'orders')).toBe(false)
    expect(canReadCollection(catalogUser, 'products')).toBe(true)
  })
})
