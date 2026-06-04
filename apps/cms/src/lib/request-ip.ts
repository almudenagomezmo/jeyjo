/**
 * Extract client IP from request headers (Vercel / reverse proxy aware).
 */
export function extractSourceIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return null
}
