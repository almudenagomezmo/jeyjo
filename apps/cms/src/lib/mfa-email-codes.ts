const CODE_TTL_MS = 10 * 60 * 1000

type PendingCode = {
  code: string
  expiresAt: number
}

const pendingByUser = new Map<string, PendingCode>()

export function generateEmailMfaCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function storeEmailMfaCode(userId: string | number): string {
  const code = generateEmailMfaCode()
  pendingByUser.set(String(userId), {
    code,
    expiresAt: Date.now() + CODE_TTL_MS,
  })
  return code
}

export function verifyEmailMfaCode(
  userId: string | number,
  code: string,
  options?: { consume?: boolean },
): boolean {
  const pending = pendingByUser.get(String(userId))
  if (!pending) return false

  if (Date.now() > pending.expiresAt) {
    pendingByUser.delete(String(userId))
    return false
  }

  const ok = pending.code === code.trim()
  if (ok && options?.consume !== false) {
    pendingByUser.delete(String(userId))
  }
  return ok
}

export function clearEmailMfaCode(userId: string | number): void {
  pendingByUser.delete(String(userId))
}
