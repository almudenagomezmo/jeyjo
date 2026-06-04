import type { Access } from 'payload'

import { hasStaffRole, isStaff } from '@/access/staffRoles'

export const adminOnly: Access = ({ req: { user } }) => {
  return isStaff(user) && hasStaffRole(user, ['superadmin'])
}

/** @deprecated Use staffAccess helpers — kept for template field access compatibility */
export const adminOnlyLegacy: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true
  return isStaff(user)
}
