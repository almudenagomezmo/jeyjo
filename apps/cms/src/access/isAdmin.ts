import type { Access } from 'payload'

import { isStaff } from '@/access/staffRoles'

/**
 * Staff-aware admin check (replaces legacy admin role for backoffice).
 */
export const isAdmin: Access = ({ req: { user } }) => {
  return isStaff(user)
}

export const isLegacyAdmin: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true
  return isStaff(user)
}
