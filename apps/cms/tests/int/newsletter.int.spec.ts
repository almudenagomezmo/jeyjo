import { describe, expect, it, vi } from 'vitest'

import { createNoopEspAdapter } from '@/lib/newsletter/esp/noop'
import { isConfirmTokenExpired } from '@/lib/newsletter/tokens'
import { normalizeNewsletterEmail } from '@/lib/newsletter/repository'

describe('newsletter tokens', () => {
  it('expires confirm token after seven days', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    expect(isConfirmTokenExpired(eightDaysAgo)).toBe(true)
  })

  it('accepts fresh confirm token', () => {
    const now = new Date().toISOString()
    expect(isConfirmTokenExpired(now)).toBe(false)
  })
})

describe('newsletter repository helpers', () => {
  it('normalizes email to lowercase', () => {
    expect(normalizeNewsletterEmail('Cliente@Example.com')).toBe('cliente@example.com')
  })
})

describe('newsletter noop esp', () => {
  it('logs upsert without throwing', async () => {
    const logs: unknown[] = []
    const esp = createNoopEspAdapter({ info: (msg) => logs.push(msg) })
    const result = await esp.upsertContact({
      email: 'test@example.com',
      attributes: { source: 'footer', segment: 'b2c' },
    })
    expect(result.contactId).toBeNull()
    expect(logs.length).toBe(1)
  })
})

describe('newsletter brevo adapter', () => {
  it('posts contact create payload', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 42 }), { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    const { createBrevoEspAdapter } = await import('@/lib/newsletter/esp/brevo')
    const esp = createBrevoEspAdapter({ apiKey: 'test-key', listId: 9 })
    const result = await esp.upsertContact({
      email: 'user@example.com',
      attributes: { source: 'footer', segment: 'b2b' },
    })

    expect(result.contactId).toBe('42')
    expect(fetchMock).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
