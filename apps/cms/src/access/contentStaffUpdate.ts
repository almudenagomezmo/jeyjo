import type { Access } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'

/** Content globals and marketing collections (pages, header, footer). */
export const contentStaffUpdate: Access = ({ req: { user } }) =>
  hasStaffRole(user, ['superadmin', 'personalizacion'])
