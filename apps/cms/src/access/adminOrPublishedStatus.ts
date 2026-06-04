import type { Access } from 'payload'

import { isStaff } from '@/access/staffRoles'

export const adminOrPublishedStatus: Access = ({ req: { user } }) => {
  if (user && isStaff(user)) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
