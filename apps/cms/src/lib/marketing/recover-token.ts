import { createHmac, timingSafeEqual } from 'node:crypto'

export type CartRecoverPayload = {
  snapshotId: string
  lines: { productId: string; qty: number }[]
  exp: number
}

function recoverSecret(): string | null {
  return (
    process.env.CART_RECOVER_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) ??
    process.env.PAYLOAD_SECRET ??
    null
  )
}

export function signCartRecoverToken(args: {
  snapshotId: string
  lines: { productId: string; qty: number }[]
  ttlDays?: number
}): string {
  const secret = recoverSecret()
  if (!secret) throw new Error('CART_RECOVER_SECRET not configured')

  const payload: CartRecoverPayload = {
    snapshotId: args.snapshotId,
    lines: args.lines,
    exp: Date.now() + (args.ttlDays ?? 7) * 24 * 60 * 60 * 1000,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyCartRecoverToken(token: string): CartRecoverPayload | null {
  const secret = recoverSecret()
  if (!secret) return null

  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', secret).update(body).digest('base64url')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as CartRecoverPayload
    if (payload.exp < Date.now()) return null
    if (!payload.snapshotId || !Array.isArray(payload.lines)) return null
    return payload
  } catch {
    return null
  }
}
