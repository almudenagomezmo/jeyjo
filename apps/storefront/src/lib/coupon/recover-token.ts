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
    null
  )
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
