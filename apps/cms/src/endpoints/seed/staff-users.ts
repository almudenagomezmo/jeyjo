import type { Payload } from 'payload'

import { E2E_TOTP_SECRET, generateCurrentTotpCode } from '@/lib/totp'

const STAFF_PASSWORD = 'JeyjoStaff2026!'

export const STAFF_TEST_USERS = {
  superadmin: {
    email: 'superadmin@jeyjo.local',
    name: 'Super Admin',
    staffRoles: ['superadmin'] as const,
  },
  catalogo: {
    email: 'catalogo@jeyjo.local',
    name: 'Catálogo',
    staffRoles: ['catalogo'] as const,
  },
  administracion: {
    email: 'administracion@jeyjo.local',
    name: 'Administración',
    staffRoles: ['administracion'] as const,
  },
}

/**
 * Seeds staff users for local dev / e2e.
 * TOTP test secret (all users when MFA enabled): JBSWY3DPEHPK3PXP
 * Generate code: `otpauth` RFC6238 vector — see README.
 */
export async function seedStaffUsers(payload: Payload): Promise<void> {
  for (const profile of Object.values(STAFF_TEST_USERS)) {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: profile.email } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'users',
        id: existing.docs[0].id,
        data: {
          staffRoles: [...profile.staffRoles],
          twoFactorEnabled: true,
          totpSecret: E2E_TOTP_SECRET,
          password: STAFF_PASSWORD,
        },
        overrideAccess: true,
      })
      continue
    }

    await payload.create({
      collection: 'users',
      data: {
        email: profile.email,
        name: profile.name,
        password: STAFF_PASSWORD,
        staffRoles: [...profile.staffRoles],
        twoFactorEnabled: true,
        totpSecret: E2E_TOTP_SECRET,
      },
      overrideAccess: true,
    })
  }
}

export function getE2eTotpCode(): string {
  return generateCurrentTotpCode(E2E_TOTP_SECRET, 'staff')
}
