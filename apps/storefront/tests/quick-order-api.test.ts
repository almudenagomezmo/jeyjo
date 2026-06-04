import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as lookupGet } from '@/app/api/intranet/quick-order/lookup/route'
import { POST as addPost } from '@/app/api/intranet/quick-order/add-to-cart/route'

const requireB2bApiSession = vi.fn()
const resolveProductByReference = vi.fn()
const buildQuickOrderAdditions = vi.fn()

vi.mock('@/lib/intranet/b2b-api-guard', () => ({
  requireB2bApiSession: () => requireB2bApiSession(),
}))

vi.mock('@/lib/catalog/resolve-product-by-reference', () => ({
  resolveProductByReference: (...args: unknown[]) => resolveProductByReference(...args),
}))

vi.mock('@/lib/intranet/quick-order/add-to-cart', () => ({
  buildQuickOrderAdditions: (...args: unknown[]) => buildQuickOrderAdditions(...args),
}))

vi.mock('@/lib/intranet/quick-order/preview', () => ({
  mapQuickOrderPreview: () => ({
    sku: 'REF-001',
    slug: 'ref-001',
    name: 'Product',
    imageUrl: null,
    packUnit: 1,
    matchedField: 'sku',
    quote: { netUnit: 10, grossUnit: 12.1, appliedRule: 'b2b' },
  }),
}))

vi.mock('@/lib/pricing/resolve-batch', () => ({
  resolvePriceQuotesBatch: async () => ({
    'REF-001': { netUnit: 10, grossUnit: 12.1, appliedRule: 'b2b' },
  }),
}))

describe('quick order API', () => {
  beforeEach(() => {
    requireB2bApiSession.mockReset()
    resolveProductByReference.mockReset()
    buildQuickOrderAdditions.mockReset()
    vi.stubEnv('QUICK_ORDER_ENABLED', 'true')
  })

  it('lookup returns 401 without B2B session', async () => {
    requireB2bApiSession.mockResolvedValue({
      error: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await lookupGet(new Request('http://localhost/api/intranet/quick-order/lookup?ref=REF'))
    expect(res?.status).toBe(401)
  })

  it('lookup returns 404 for wildcard', async () => {
    requireB2bApiSession.mockResolvedValue({ ctx: {}, customerId: 'cust-1' })
    const res = await lookupGet(
      new Request('http://localhost/api/intranet/quick-order/lookup?ref=9000000001'),
    )
    expect(res?.status).toBe(404)
  })

  it('add-to-cart returns 10 additions (RF-019)', async () => {
    requireB2bApiSession.mockResolvedValue({ ctx: {}, customerId: 'cust-1' })
    const additions = Array.from({ length: 10 }, (_, i) => ({
      productId: `ref-${i}`,
      sku: `REF-${i}`,
      qty: 1,
      quote: { netUnit: 1, grossUnit: 1.21, appliedRule: 'b2b' },
    }))
    buildQuickOrderAdditions.mockResolvedValue({ ok: true, additions, missing: [] })

    const res = await addPost(
      new Request('http://localhost/api/intranet/quick-order/add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: additions.map((a) => ({ sku: a.sku, qty: 1 })),
        }),
      }),
    )
    expect(res?.status).toBe(200)
    const body = (await res!.json()) as { additions: unknown[] }
    expect(body.additions).toHaveLength(10)
  })
})
