import crypto from 'crypto'

import type { PayloadRequest } from 'payload'

const MFA_COOKIE = 'jeyjo-mfa-verified'
const MAX_AGE_MS = 12 * 60 * 60 * 1000

function getSecret(): string {
  return process.env.PAYLOAD_SECRET || 'dev-mfa-secret'
}

function sign(userId: string | number, issuedAt: number): string {
  return crypto.createHmac('sha256', getSecret()).update(`${userId}:${issuedAt}`).digest('hex')
}

export function createMfaCookieValue(userId: string | number): string {
  const issuedAt = Date.now()
  return `${userId}.${issuedAt}.${sign(userId, issuedAt)}`
}

export function parseMfaCookieValue(value: string | undefined | null): boolean {
  if (!value) return false
  const [userId, issuedAtStr, sig] = value.split('.')
  if (!userId || !issuedAtStr || !sig) return false

  const issuedAt = Number(issuedAtStr)
  if (Number.isNaN(issuedAt) || Date.now() - issuedAt > MAX_AGE_MS) return false

  const expected = sign(userId, issuedAt)
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

export function hasValidMfaSession(req: PayloadRequest): boolean {
  if (!req.user?.id) return false

  const graceDays = Number(process.env.MFA_GRACE_DAYS || '0')
  if (graceDays > 0 && process.env.NODE_ENV !== 'production') {
    return true
  }

  const user = req.user as { twoFactorEnabled?: boolean | null; staffRoles?: string[] | null }
  if (!user.staffRoles?.length) return true
  if (!user.twoFactorEnabled) return false

  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`${MFA_COOKIE}=([^;]+)`))
  const cookieValue = match?.[1] ? decodeURIComponent(match[1]) : null

  if (!parseMfaCookieValue(cookieValue)) return false

  const [cookieUserId] = (cookieValue || '').split('.')
  return String(req.user.id) === cookieUserId
}

export function mfaCookieHeader(userId: string | number): string {
  const value = createMfaCookieValue(userId)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${MFA_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_MS / 1000}${secure}`
}

export function clearMfaCookieHeader(): string {
  return `${MFA_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export { MFA_COOKIE }
