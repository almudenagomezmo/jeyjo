import { hasStaffRole, type StaffUserLike } from '@/access/staffRoles'

export function canManageCustomers(user: StaffUserLike | null | undefined): boolean {
  return hasStaffRole(user, ['superadmin', 'administracion'])
}

/** @deprecated Use canManageCustomers */
export function canValidateCustomers(user: StaffUserLike | null | undefined): boolean {
  return canManageCustomers(user)
}
