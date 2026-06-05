import type { PayloadRequest } from 'payload'

import { canManageCustomers } from '@/access/customerValidation'
import { hasValidMfaSession } from '@/lib/mfa-session'

export type StaffCustomerGuardFailure = {
  status: number
  message: string
}

export function checkStaffCustomerManagementAccess(
  user: unknown,
  req: PayloadRequest,
): StaffCustomerGuardFailure | null {
  if (!user || !canManageCustomers(user as Parameters<typeof canManageCustomers>[0])) {
    return { status: 403, message: 'Action forbidden.' }
  }
  if (!hasValidMfaSession(req)) {
    return {
      status: 403,
      message: 'MFA required. Completa la verificación MFA en el dashboard.',
    }
  }
  return null
}
