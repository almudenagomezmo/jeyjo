import { TOTP, Secret } from 'otpauth'

const ISSUER = 'Jeyjo Backoffice'

export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32
}

export function buildTotp(secret: string, label: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  })
}

export function verifyTotpCode(secret: string, code: string, label = 'staff'): boolean {
  const totp = buildTotp(secret, label)
  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}

export function getTotpUri(secret: string, email: string): string {
  return buildTotp(secret, email).toString()
}

/** Fixed secret for e2e / local dev (RFC 6238 test vector). */
export const E2E_TOTP_SECRET = 'JBSWY3DPEHPK3PXP'

export function generateCurrentTotpCode(secret: string, label = 'staff'): string {
  return buildTotp(secret, label).generate()
}
