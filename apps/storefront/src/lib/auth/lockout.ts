export const MAX_FAILED_LOGIN_ATTEMPTS = 5
export const LOCKOUT_MINUTES = 15

export function isAccountLocked(lockedUntil: string | null | undefined, now = new Date()): boolean {
  if (!lockedUntil) return false
  return new Date(lockedUntil).getTime() > now.getTime()
}

export function lockoutMessage(): string {
  return `Cuenta bloqueada temporalmente. Inténtalo de nuevo en ${LOCKOUT_MINUTES} minutos.`
}

export function nextFailedCount(current: number): number {
  return current + 1
}

export function shouldLockAccount(failedCount: number): boolean {
  return failedCount >= MAX_FAILED_LOGIN_ATTEMPTS
}

/** Blocks the next attempt after five consecutive failures (sixth try). */
export function isLoginAttemptBlocked(
  failedCount: number,
  lockedUntil: string | null | undefined,
  now = new Date(),
): boolean {
  return isAccountLocked(lockedUntil, now) || failedCount >= MAX_FAILED_LOGIN_ATTEMPTS
}

export function lockedUntilFromNow(now = new Date()): string {
  return new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
}

export function resetLockoutFields(): { failed_login_count: number; locked_until: null } {
  return { failed_login_count: 0, locked_until: null }
}
