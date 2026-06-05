import type { WebProfileRow } from '@/lib/customers/types'

export type WebProfileRole = 'b2c' | 'b2b_superadmin' | 'b2b_subuser' | 'pending'

export type ProfileRoleAssignment = {
  profileId: string
  role: string
}

const VALID_ROLES: WebProfileRole[] = ['b2c', 'b2b_superadmin', 'b2b_subuser', 'pending']

export function isValidWebProfileRole(role: string): role is WebProfileRole {
  return VALID_ROLES.includes(role as WebProfileRole)
}

export function validateReclassifyInput(input: {
  customerGroup: number
  profileRoles: ProfileRoleAssignment[]
  profiles: WebProfileRow[]
  validatedAt: string | null
}): { ok: true; assignments: Array<{ profileId: string; role: WebProfileRole }> } | {
  ok: false
  status: number
  message: string
} {
  const { customerGroup, profileRoles, profiles, validatedAt } = input

  if (!validatedAt) {
    return {
      ok: false,
      status: 409,
      message: 'Customer is pending validation. Use the validate action instead.',
    }
  }

  if (customerGroup < 1 || customerGroup > 4) {
    return { ok: false, status: 400, message: 'customerGroup must be 1–4' }
  }

  if (!profiles.length) {
    return { ok: false, status: 400, message: 'Customer has no web profiles to reclassify' }
  }

  if (profileRoles.length !== profiles.length) {
    return {
      ok: false,
      status: 400,
      message: 'profileRoles must include every linked web profile',
    }
  }

  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const assignments: Array<{ profileId: string; role: WebProfileRole }> = []

  for (const row of profileRoles) {
    const profile = profileById.get(row.profileId)
    if (!profile) {
      return { ok: false, status: 400, message: `Unknown profile id: ${row.profileId}` }
    }
    if (!isValidWebProfileRole(row.role)) {
      return { ok: false, status: 400, message: `Invalid role: ${row.role}` }
    }
    if (row.role === 'pending') {
      return {
        ok: false,
        status: 400,
        message: 'Cannot assign pending role to a validated customer',
      }
    }
    assignments.push({ profileId: row.profileId, role: row.role })
  }

  const seen = new Set(assignments.map((a) => a.profileId))
  if (seen.size !== profiles.length) {
    return {
      ok: false,
      status: 400,
      message: 'profileRoles must include each profile exactly once',
    }
  }

  if (customerGroup === 1) {
    const activeSubusers = profiles.filter(
      (p) => p.role === 'b2b_subuser' && p.is_active,
    )
    if (activeSubusers.length > 0) {
      return {
        ok: false,
        status: 409,
        message:
          'Cannot downgrade to B2C while active subusers exist. Deactivate subusers first.',
      }
    }
  }

  for (const { profileId, role } of assignments) {
    const profile = profileById.get(profileId)!
    const roleError = validateProfileRoleForGroup(customerGroup, role, profile)
    if (roleError) return roleError
  }

  return { ok: true, assignments }
}

function validateProfileRoleForGroup(
  customerGroup: number,
  role: WebProfileRole,
  profile: WebProfileRow,
): { ok: false; status: number; message: string } | null {
  if (customerGroup === 1) {
    if (role === 'b2b_subuser') {
      return {
        ok: false,
        status: 400,
        message: 'B2C customers cannot have b2b_subuser profiles',
      }
    }
    if (role !== 'b2c') {
      return {
        ok: false,
        status: 400,
        message: 'B2C customers must use b2c role on all profiles',
      }
    }
    return null
  }

  if (role === 'b2b_subuser') {
    return null
  }

  if (role === 'b2c' || role === 'pending') {
    return {
      ok: false,
      status: 400,
      message: `Titular profile ${profile.email} cannot use role ${role} for B2B groups`,
    }
  }

  if (role !== 'b2b_superadmin') {
    return {
      ok: false,
      status: 400,
      message: `Titular profile ${profile.email} must use b2b_superadmin for B2B groups`,
    }
  }

  return null
}

export function reclassifyImpactCopy(customerGroup: number): string {
  if (customerGroup === 1) {
    return 'El cliente usará precios B2C (P1) y el área /cuenta. No tendrá acceso al portal B2B ni a Contabilidad.'
  }
  return 'El cliente usará precios B2B (P2–P4 según grupo), accederá a /intranet y podrá ver Contabilidad si es superadmin de empresa.'
}
