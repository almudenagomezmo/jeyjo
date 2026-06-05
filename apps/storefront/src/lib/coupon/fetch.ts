import type { PayloadCouponDoc } from './types'

const CACHE_MS = 60_000
const cache = new Map<string, { at: number; doc: PayloadCouponDoc | null }>()

function payloadBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

function isCouponExpired(validUntil: string): boolean {
  const end = new Date(validUntil)
  end.setHours(23, 59, 59, 999)
  return end.getTime() < Date.now()
}

function isCouponNotStarted(validFrom: string): boolean {
  const start = new Date(validFrom)
  start.setHours(0, 0, 0, 0)
  return start.getTime() > Date.now()
}

export function invalidateCouponCache(code?: string): void {
  if (code) {
    cache.delete(code.trim().toUpperCase())
    return
  }
  cache.clear()
}

export async function fetchCouponByCode(code: string): Promise<PayloadCouponDoc | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null

  const hit = cache.get(normalized)
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return hit.doc
  }

  const base = payloadBaseUrl()
  const apiKey = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!base || !apiKey) return null

  const params = new URLSearchParams({
    'where[code][equals]': normalized,
    limit: '1',
    depth: '0',
  })

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/coupons?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) {
      cache.set(normalized, { at: Date.now(), doc: null })
      return null
    }
    const json = (await res.json()) as { docs?: PayloadCouponDoc[] }
    const doc = json.docs?.[0] ?? null
    if (!doc || doc.active === false || isCouponExpired(doc.validUntil)) {
      cache.set(normalized, { at: Date.now(), doc: null })
      return null
    }
    if (isCouponNotStarted(doc.validFrom)) {
      cache.set(normalized, { at: Date.now(), doc: null })
      return null
    }
    cache.set(normalized, { at: Date.now(), doc })
    return doc
  } catch {
    return null
  }
}
