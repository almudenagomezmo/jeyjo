import { describe, expect, it, vi } from 'vitest'

import {
  isConfirmTokenExpired,
  isValidNewsletterEmail,
  normalizeNewsletterEmail,
} from '@/lib/newsletter/repository'
import { buildRateLimitKey } from '@/lib/newsletter/rate-limit'

vi.mock('@/lib/newsletter/settings', () => ({
  getNewsletterSettings: vi.fn(async () => ({
    enabled: true,
    headline: 'Newsletter',
    description: 'Desc',
    privacyPolicyUrl: '/privacidad',
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: vi.fn(() => null),
}))

describe('newsletter validation', () => {
  it('validates email format', () => {
    expect(isValidNewsletterEmail('a@b.co')).toBe(true)
    expect(isValidNewsletterEmail('not-an-email')).toBe(false)
  })

  it('normalizes email', () => {
    expect(normalizeNewsletterEmail(' A@B.COM ')).toBe('a@b.com')
  })

  it('expires old confirm tokens', () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    expect(isConfirmTokenExpired(old)).toBe(true)
  })

  it('builds rate limit key', () => {
    expect(buildRateLimitKey('1.2.3.4', 'a@b.com')).toBe('1.2.3.4:a@b.com')
  })
})

describe('newsletter subscribe API', () => {
  it('returns 503 when supabase admin is unavailable', async () => {
    const { POST } = await import('@/app/api/newsletter/subscribe/route')
    const res = await POST(
      new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', consent: true }),
      }),
    )
    expect(res.status).toBe(503)
  })

  it('returns 400 without consent', async () => {
    const { getSupabaseAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(getSupabaseAdminClient).mockReturnValue({
      from: vi.fn(),
    } as never)

    const { POST } = await import('@/app/api/newsletter/subscribe/route')
    const res = await POST(
      new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', consent: false }),
      }),
    )
    expect(res.status).toBe(400)
  })
})

describe('newsletter settings API', () => {
  it('returns settings payload', async () => {
    const { GET } = await import('@/app/api/newsletter/settings/route')
    const res = await GET()
    const data = await res.json()
    expect(data.enabled).toBe(true)
    expect(data.headline).toBe('Newsletter')
  })
})
