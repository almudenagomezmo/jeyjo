import { createHmac, timingSafeEqual } from 'node:crypto'

import type { CheckoutPreparePayload } from '@/lib/checkout/prepare-token'
import type { CheckoutSegment } from '@/lib/checkout/segment'

export type QuotePreparePayload = CheckoutPreparePayload & {
  segment: CheckoutSegment
}

function signingSecret(): string | null {
  return (
    process.env.QUOTE_PREPARE_SECRET ??
    process.env.CHECKOUT_SIGNING_SECRET ??
    process.env.STOREFRONT_PAYLOAD_API_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) ??
    null
  )
}

export function signQuotePrepare(payload: QuotePreparePayload): string | null {
  const secret = signingSecret()
  if (!secret) return null
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyQuotePrepare(token: string): QuotePreparePayload | null {
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
    ) as QuotePreparePayload
    if (payload.exp < Date.now()) return null
    if (!payload.segment) return null
    return payload
  } catch {
    return null
  }
}
