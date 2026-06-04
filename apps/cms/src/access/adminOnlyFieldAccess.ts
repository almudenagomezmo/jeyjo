import type { FieldAccess } from 'payload'

import { hasStaffRole, isStaff } from '@/access/staffRoles'

export const adminOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  return isStaff(user)
}

export const superadminFieldAccess: FieldAccess = ({ req: { user } }) => {
  return hasStaffRole(user, ['superadmin'])
}
