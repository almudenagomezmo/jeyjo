import type { Access } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'

/** Content globals (home merchandising). */
export const contentStaffUpdate: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'personalizacion'])
