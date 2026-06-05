import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/wishlist/sync', () => ({
  requireWishlistSession: vi.fn(async () => ({ error: 'guest' as const })),
  listWishlistSkus: vi.fn(),
  upsertWishlistWatch: vi.fn(),
  removeWishlistWatch: vi.fn(),
  replaceWishlistSkus: vi.fn(),
}))

describe('wishlist API auth', () => {
  it('GET returns 401 without session', async () => {
    const { GET } = await import('@/app/api/wishlist/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })
})

vi.mock('@/lib/intranet/b2b-api-guard', () => ({
  requireB2bApiSession: vi.fn(async () => ({
    error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
  })),
}))

describe('stock-watches API auth', () => {
  it('GET returns 401 without B2B session', async () => {
    const { GET } = await import('@/app/api/intranet/stock-watches/route')
    const res = await GET()
    expect(res).toBeDefined()
    expect(res!.status).toBe(401)
  })
})
