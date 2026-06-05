import { createHmac, timingSafeEqual } from 'crypto'

export function getSkaiWebhookSecret(): string | null {
  return process.env.SKAI_WEBHOOK_SECRET?.trim() || null
}

export function signSkaiWebhookBody(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

export function verifySkaiWebhookSignature(body: string, signature: string | null): boolean {
  const secret = getSkaiWebhookSecret()
  if (!secret || !signature?.trim()) return false

  const expected = signSkaiWebhookBody(body, secret)
  const provided = signature.trim()

  try {
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(provided, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
