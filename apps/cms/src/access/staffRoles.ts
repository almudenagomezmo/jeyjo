export const STAFF_ROLES = [
  'superadmin',
  'administracion',
  'catalogo',
  'personalizacion',
  'mantenimiento',
  'marketing',
] as const

export type StaffRole = (typeof STAFF_ROLES)[number]

export type StaffUserLike = {
  id?: number | string
  staffRoles?: StaffRole[] | null
  twoFactorEnabled?: boolean | null
  roles?: string[] | null
  email?: string | null
}

/** Collections / areas each staff role may access (read at minimum). */
export const COLLECTION_ACCESS: Record<string, StaffRole[]> = {
  products: ['superadmin', 'catalogo'],
  categories: ['superadmin', 'catalogo'],
  suppliers: ['superadmin', 'catalogo'],
  media: ['superadmin', 'catalogo', 'personalizacion'],
  orders: ['superadmin', 'administracion'],
  quotes: ['superadmin', 'administracion'],
  'rma-incidents': ['superadmin', 'administracion'],
  users: ['superadmin', 'mantenimiento'],
  transactions: ['superadmin', 'administracion'],
  addresses: ['superadmin', 'administracion'],
  carts: ['superadmin', 'administracion'],
  coupons: ['superadmin', 'marketing'],
  'b2b-catalog-downloads': ['superadmin', 'marketing', 'personalizacion'],
}

const CATALOG_WRITE_COLLECTIONS = new Set(['products', 'categories', 'suppliers'])

export function isStaff(user?: StaffUserLike | null): boolean {
  return Boolean(user?.staffRoles?.length)
}

export function hasStaffRole(user: StaffUserLike | null | undefined, roles: StaffRole[]): boolean {
  if (!user?.staffRoles?.length) return false
  if (user.staffRoles.includes('superadmin')) return true
  return roles.some((role) => user.staffRoles?.includes(role))
}

export function canReadCollection(user: StaffUserLike | null | undefined, collection: string): boolean {
  if (!isStaff(user)) return false
  const allowed = COLLECTION_ACCESS[collection]
  if (!allowed) return hasStaffRole(user, ['superadmin'])
  return hasStaffRole(user, allowed)
}

export function canWriteCollection(
  user: StaffUserLike | null | undefined,
  collection: string,
  operation: 'create' | 'update' | 'delete',
): boolean {
  if (!canReadCollection(user, collection)) return false
  if (!user) return false

  if (collection === 'users') {
    if (hasStaffRole(user, ['mantenimiento']) && !hasStaffRole(user, ['superadmin'])) {
      return false
    }
    return hasStaffRole(user, ['superadmin'])
  }

  if (CATALOG_WRITE_COLLECTIONS.has(collection)) {
    if (
      hasStaffRole(user, ['administracion']) &&
      !hasStaffRole(user, ['catalogo', 'superadmin'])
    ) {
      return false
    }
  }

  if (collection === 'orders' || collection === 'quotes' || collection === 'rma-incidents') {
    return hasStaffRole(user, ['superadmin', 'administracion'])
  }

  if (collection === 'coupons') {
    return hasStaffRole(user, ['superadmin', 'marketing'])
  }

  if (collection === 'b2b-catalog-downloads') {
    return hasStaffRole(user, ['superadmin', 'marketing', 'personalizacion'])
  }

  if (collection === 'media') {
    return hasStaffRole(user, ['superadmin', 'personalizacion', 'catalogo'])
  }

  if (CATALOG_WRITE_COLLECTIONS.has(collection)) {
    return hasStaffRole(user, ['superadmin', 'catalogo'])
  }

  return hasStaffRole(user, ['superadmin'])
}

export function canAccessAuditConsole(user: StaffUserLike | null | undefined): boolean {
  return hasStaffRole(user, ['superadmin', 'mantenimiento'])
}

export function canAccessOms(user: StaffUserLike | null | undefined): boolean {
  return hasStaffRole(user, ['superadmin', 'administracion'])
}

export function isCollectionHidden(user: StaffUserLike | null | undefined, collection: string): boolean {
  if (!isStaff(user)) return true
  return !canReadCollection(user, collection)
}
