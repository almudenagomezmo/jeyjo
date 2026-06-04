import { hasStaffRole, type StaffUserLike } from '@/access/staffRoles'

export function canValidateCustomers(user: StaffUserLike | null | undefined): boolean {
  return hasStaffRole(user, ['superadmin', 'administracion'])
}
