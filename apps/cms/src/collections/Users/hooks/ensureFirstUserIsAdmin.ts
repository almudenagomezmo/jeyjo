import type { FieldHook } from 'payload'

import type { User } from '@/payload-types'

import { STAFF_ROLES } from '@/access/staffRoles'

export const ensureFirstUserIsSuperadmin: FieldHook<User> = async ({ operation, req, value }) => {
  if (operation === 'create') {
    const users = await req.payload.find({ collection: 'users', depth: 0, limit: 0 })
    if (users.totalDocs === 0) {
      return ['superadmin' as const]
    }
  }

  return value
}

/** @deprecated Use ensureFirstUserIsSuperadmin */
export { ensureFirstUserIsSuperadmin as ensureFirstUserIsAdmin }

export const staffRoleOptions = STAFF_ROLES.map((role) => ({
  label: role,
  value: role,
}))
