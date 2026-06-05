/** En desarrollo usamos código por email; en producción, TOTP (Google Authenticator). */
export function isEmailMfaMode(): boolean {
  return process.env.NODE_ENV !== 'production'
}

export type MfaMode = 'email' | 'totp'

export function getMfaMode(): MfaMode {
  return isEmailMfaMode() ? 'email' : 'totp'
}
