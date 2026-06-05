import type { PayloadRequest } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'

export function canAccessCatalogImport(req: PayloadRequest): boolean {
  return hasStaffRole(req.user, ['superadmin', 'catalogo'])
}
