import type { CollectionConfig } from 'payload'

import { hasStaffRole, isStaff } from '@/access/staffRoles'
import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { adminOrSelf } from '@/access/adminOrSelf'
import { createAuditHooks } from '@/hooks/auditLogHooks'
import { loginFailedAfterError, staffSecurityAfterChange, staffSecurityBeforeChange } from '@/hooks/securityAuditHooks'
import { mfaEndpoints } from '@/endpoints/mfa'

import {
  ensureFirstUserIsSuperadmin,
  staffRoleOptions,
} from './hooks/ensureFirstUserIsAdmin'
import {
  staffUsersBaseFilter,
  superadminOnlyStaffRolesField,
  validateStaffPassword,
} from './hooks/staffSecurity'

const userAuditHooks = createAuditHooks({ collection: 'users' })

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => isStaff(user),
    create: staffCreateAccess('users'),
    delete: staffDeleteAccess('users'),
    read: (args) => {
      const { user } = args.req
      const { id } = args
      // Permite cargar la vista Account durante enrolamiento MFA (sin cookie MFA aún).
      if (user && id != null && String(id) === String(user.id)) {
        return true
      }
      if (user && (hasStaffRole(user, ['superadmin']) || hasStaffRole(user, ['mantenimiento']))) {
        return staffReadAccess('users')(args)
      }
      return adminOrSelf(args)
    },
    unlock: ({ req: { user } }) => Boolean(user && hasStaffRole(user, ['superadmin'])),
    update: (args) => {
      const { user } = args.req
      if (user && hasStaffRole(user, ['superadmin'])) return true
      return adminOrSelf(args)
    },
  },
  admin: {
    group: 'Mantenimiento',
    defaultColumns: ['name', 'email', 'staffRoles', 'twoFactorEnabled'],
    useAsTitle: 'name',
    baseListFilter: staffUsersBaseFilter,
    hidden: ({ user }) => !isStaff(user),
  },
  auth: {
    tokenExpiration: 1209600,
    maxLoginAttempts: 5,
    lockTime: 900000,
  },
  endpoints: mfaEndpoints,
  hooks: {
    beforeValidate: [validateStaffPassword],
    beforeChange: [...userAuditHooks.beforeChange, staffSecurityBeforeChange],
    afterChange: [...userAuditHooks.afterChange, staffSecurityAfterChange],
    afterDelete: userAuditHooks.afterDelete,
    afterError: [loginFailedAfterError],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'staffRoles',
      type: 'select',
      label: 'Roles staff',
      hasMany: true,
      saveToJWT: true,
      options: staffRoleOptions,
      access: {
        create: ({ req: { user } }) => hasStaffRole(user, ['superadmin']),
        read: ({ req: { user } }) => isStaff(user) || hasStaffRole(user, ['superadmin']),
        update: ({ req: { user } }) => hasStaffRole(user, ['superadmin']),
      },
      hooks: {
        beforeChange: [ensureFirstUserIsSuperadmin, superadminOnlyStaffRolesField],
      },
      admin: {
        description: 'Al menos un rol staff es necesario para acceder al backoffice.',
      },
    },
    {
      name: 'twoFactorEnabled',
      type: 'checkbox',
      label: 'MFA TOTP activo',
      defaultValue: false,
      saveToJWT: true,
      access: {
        read: ({ req: { user } }) => isStaff(user),
        update: () => false,
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'totpSecret',
      type: 'text',
      access: {
        read: () => false,
        update: () => false,
        create: () => false,
      },
      admin: {
        hidden: true,
      },
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: ({ req: { user } }) => hasStaffRole(user, ['superadmin']),
        read: ({ req: { user } }) => hasStaffRole(user, ['superadmin']),
        update: ({ req: { user } }) => hasStaffRole(user, ['superadmin']),
      },
      defaultValue: ['customer'],
      hasMany: true,
      options: [
        { label: 'admin', value: 'admin' },
        { label: 'customer', value: 'customer' },
      ],
      admin: {
        condition: () => false,
        description: 'Legacy template — usar staffRoles para backoffice.',
      },
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
        condition: (data) => !data?.staffRoles?.length,
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
        condition: (data) => !data?.staffRoles?.length,
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id'],
        condition: (data) => !data?.staffRoles?.length,
      },
    },
  ],
}
