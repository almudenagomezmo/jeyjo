import { describe, it, expect } from 'vitest'

import { isQuotesEnabled } from '@/lib/quotes/enabled'

describe('quotes prepare validation', () => {
  it('isQuotesEnabled respects env flag', () => {
    const prev = process.env.QUOTES_ENABLED
    process.env.QUOTES_ENABLED = 'true'
    expect(isQuotesEnabled()).toBe(true)
    process.env.QUOTES_ENABLED = 'false'
    process.env.NEXT_PUBLIC_QUOTES_ENABLED = undefined
    expect(isQuotesEnabled()).toBe(false)
    process.env.QUOTES_ENABLED = prev
  })
})

describe('POST /api/quotes/prepare empty cart', () => {
  it('returns 400 for empty lines', async () => {
    process.env.QUOTES_ENABLED = 'true'
    const { POST } = await import('@/app/api/quotes/prepare/route')
    const res = await POST(
      new Request('http://local/api/quotes/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: [] }),
      }),
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error?: string }
    expect(body.error).toMatch(/empty/i)
  })
})
