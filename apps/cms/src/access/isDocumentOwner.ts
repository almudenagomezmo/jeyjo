import type { Access } from 'payload'

import { isStaff } from '@/access/staffRoles'
import { checkRole } from '@/access/utilities'

/**
 * Admins/staff have full access; authenticated customers are scoped to their documents.
 */
export const isDocumentOwner: Access = ({ req }) => {
  if (req.user && (isStaff(req.user) || checkRole(['admin'], req.user))) {
    return true
  }

  if (req.user?.id) {
    return {
      customer: {
        equals: req.user.id,
      },
    }
  }

  return false
}
