import type { FieldHook, CollectionBeforeValidateHook } from 'payload'

import type { User } from '@/payload-types'

import { hasStaffRole, type StaffRole } from '@/access/staffRoles'

const STAFF_PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/

export const validateStaffPassword: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
}) => {
  if (!data?.password) return data

  const roles = (data.staffRoles ?? originalDoc?.staffRoles ?? []) as StaffRole[]
  if (!roles.length) return data

  if (!STAFF_PASSWORD_RE.test(String(data.password))) {
    throw new Error(
      'La contraseña staff debe tener al menos 12 caracteres, mayúscula, minúscula, número y carácter especial.',
    )
  }

  return data
}

export const superadminOnlyStaffRolesField: FieldHook<User> = ({ req, value, operation, originalDoc }) => {
  if (!req.user) return value

  if (!hasStaffRole(req.user, ['superadmin'])) {
    if (operation === 'create') {
      return value
    }
    return originalDoc?.staffRoles ?? value
  }

  if (operation === 'update' && originalDoc?.id === req.user.id) {
    const prev = originalDoc.staffRoles ?? []
    const next = (value as StaffRole[] | undefined) ?? []
    if (JSON.stringify(prev.sort()) !== JSON.stringify([...next].sort())) {
      throw new Error('No puedes modificar tus propios roles staff.')
    }
  }

  return value
}

export const staffUsersBaseFilter = () => ({
  staffRoles: { exists: true },
})
