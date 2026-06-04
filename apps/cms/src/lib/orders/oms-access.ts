import { APIError, type PayloadRequest } from 'payload'

import { canAccessOms, isStaff } from '@/access/staffRoles'
import { logAccessDenied } from '@/access/logAccessDenied'
import { hasValidMfaSession } from '@/lib/mfa-session'

export async function requireOmsStaff(req: PayloadRequest): Promise<void> {
  if (!req.user || !isStaff(req.user) || !hasValidMfaSession(req)) {
    throw new APIError('Unauthorized', 401)
  }
  if (!canAccessOms(req.user)) {
    await logAccessDenied(req, 'oms', 'read')
    throw new APIError('Forbidden', 403)
  }
}

export function isOrderExportable(order: {
  origin?: string | null
  jeyjoStatus?: string | null
  validatedEva?: boolean | null
}): boolean {
  const status = order.jeyjoStatus
  const exportableStatuses = ['confirmed', 'preparing', 'shipped', 'delivered']
  if (!status || !exportableStatuses.includes(status)) return false
  if (order.origin === 'eva' && !order.validatedEva) return false
  return true
}
