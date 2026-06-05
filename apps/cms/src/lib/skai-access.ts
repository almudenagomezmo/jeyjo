import type { PayloadRequest } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'

export function canAccessSkaiConfig(req: PayloadRequest): boolean {
  return hasStaffRole(req.user, ['superadmin'])
}
