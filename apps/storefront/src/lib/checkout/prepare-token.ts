import { createHmac, timingSafeEqual } from 'node:crypto'

import type { CheckoutTotals } from '@/lib/checkout/totals'
import type { CartLine } from '@/lib/types'

export type CheckoutPreparePayload = {
  exp: number
  lines: CartLine[]
  totals: CheckoutTotals
  lineSnapshots: {
    lineId: string
    skuErp: string
    name: string
    qty: number
    unitPrice: number
    lineTotal: number
  }[]
}

function signingSecret(): string | null {
  return (
    process.env.CHECKOUT_SIGNING_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) ??
    null
  )
}

export function signCheckoutPrepare(payload: CheckoutPreparePayload): string | null {
  const secret = signingSecret()
  if (!secret) return null
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyCheckoutPrepare(token: string): CheckoutPreparePayload | null {
  const secret = signingSecret()
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
    ) as CheckoutPreparePayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
