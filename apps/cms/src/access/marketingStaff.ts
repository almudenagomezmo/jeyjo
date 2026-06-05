import type { Access } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'

export const marketingStaffUpdate: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'marketing'])

export const marketingStaffRead: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'marketing'])
