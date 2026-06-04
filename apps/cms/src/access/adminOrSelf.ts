import type { Access } from 'payload'

import { hasStaffRole, isStaff } from '@/access/staffRoles'

export const adminOrSelf: Access = ({ req: { user } }) => {
  if (user) {
    if (hasStaffRole(user, ['superadmin'])) {
      return true
    }

    return {
      id: {
        equals: user.id,
      },
    }
  }

  return false
}

export const staffOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isStaff(user)) return true
  return { id: { equals: user.id } }
}
