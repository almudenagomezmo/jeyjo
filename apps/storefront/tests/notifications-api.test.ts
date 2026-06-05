import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/intranet/b2b-api-guard', () => ({
  requireB2bApiSession: vi.fn(async () => ({
    error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
  })),
}))

describe('notifications API auth', () => {
  it('GET returns 401 without B2B session', async () => {
    const { GET } = await import('@/app/api/intranet/notifications/route')
    const res = await GET(new Request('http://localhost/api/intranet/notifications'))
    expect(res).toBeDefined()
    expect(res!.status).toBe(401)
  })
})
