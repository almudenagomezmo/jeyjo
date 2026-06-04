import type { Access } from 'payload'

import { logAccessDenied } from '@/access/logAccessDenied'
import { canReadCollection, canWriteCollection, isStaff } from '@/access/staffRoles'
import { hasValidMfaSession } from '@/lib/mfa-session'

function staffWithMfa(req: Parameters<Access>[0]['req']): boolean {
  if (!req.user || !isStaff(req.user)) return false
  return hasValidMfaSession(req)
}

export function staffReadAccess(collection: string): Access {
  return async ({ req }) => {
    if (!staffWithMfa(req)) {
      if (req.user && isStaff(req.user)) {
        await logAccessDenied(req, collection, 'read')
      }
      return false
    }
    const allowed = canReadCollection(req.user, collection)
    if (!allowed && req.user) {
      await logAccessDenied(req, collection, 'read')
    }
    return allowed
  }
}

export function staffCreateAccess(collection: string): Access {
  return async ({ req }) => {
    if (!staffWithMfa(req)) {
      if (req.user && isStaff(req.user)) {
        await logAccessDenied(req, collection, 'create')
      }
      return false
    }
    const allowed = canWriteCollection(req.user, collection, 'create')
    if (!allowed && req.user) {
      await logAccessDenied(req, collection, 'create')
    }
    return allowed
  }
}

export function staffUpdateAccess(collection: string): Access {
  return async ({ req }) => {
    if (!staffWithMfa(req)) {
      if (req.user && isStaff(req.user)) {
        await logAccessDenied(req, collection, 'update')
      }
      return false
    }
    const allowed = canWriteCollection(req.user, collection, 'update')
    if (!allowed && req.user) {
      await logAccessDenied(req, collection, 'update')
    }
    return allowed
  }
}

export function staffDeleteAccess(collection: string): Access {
  return async ({ req }) => {
    if (!staffWithMfa(req)) {
      if (req.user && isStaff(req.user)) {
        await logAccessDenied(req, collection, 'delete')
      }
      return false
    }
    const allowed = canWriteCollection(req.user, collection, 'delete')
    if (!allowed && req.user) {
      await logAccessDenied(req, collection, 'delete')
    }
    return allowed
  }
}

export const staffAdminAccess: Access = ({ req: { user } }) => isStaff(user)
