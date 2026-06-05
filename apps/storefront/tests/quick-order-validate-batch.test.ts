import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/intranet/quick-order/validate-batch/route'

const requireB2bApiSession = vi.fn()
const validateQuickOrderRefs = vi.fn()

vi.mock('@/lib/intranet/b2b-api-guard', () => ({
  requireB2bApiSession: () => requireB2bApiSession(),
}))

vi.mock('@/lib/intranet/quick-order/validate-rows', () => ({
  validateQuickOrderRefs: (...args: unknown[]) => validateQuickOrderRefs(...args),
}))

describe('quick order validate-batch', () => {
  beforeEach(() => {
    requireB2bApiSession.mockReset()
    validateQuickOrderRefs.mockReset()
    vi.stubEnv('QUICK_ORDER_ENABLED', 'true')
  })

  it('returns validated rows for JSON items (US-11 CA3 flow)', async () => {
    requireB2bApiSession.mockResolvedValue({ ctx: {}, customerId: 'cust-1' })
    const rows = Array.from({ length: 10 }, (_, i) => ({
      ref: `REF-${i}`,
      qty: 2,
      status: 'ok' as const,
      sku: `REF-${i}`,
      slug: `ref-${i}`,
      name: `Product ${i}`,
    }))
    validateQuickOrderRefs.mockResolvedValue(rows)

    const res = await POST(
      new Request('http://localhost/api/intranet/quick-order/validate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: rows.map((r) => ({ ref: r.ref, qty: r.qty })),
        }),
      }),
    )
    expect(res?.status).toBe(200)
    const body = (await res!.json()) as { okCount: number; total: number }
    expect(body.okCount).toBe(10)
    expect(body.total).toBe(10)
  })
})
