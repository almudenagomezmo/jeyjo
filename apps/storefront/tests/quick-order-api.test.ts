import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST as lookupPost } from '@/app/api/intranet/quick-order/lookup/route'
import { POST as addPost } from '@/app/api/intranet/quick-order/add/route'

const requireB2bApiSession = vi.fn()
const buildQuickOrderPreview = vi.fn()
const buildQuickOrderAdditions = vi.fn()

vi.mock('@/lib/intranet/b2b-api-guard', () => ({
  requireB2bApiSession: () => requireB2bApiSession(),
}))

vi.mock('@/lib/intranet/quick-order/build-preview', () => ({
  buildQuickOrderPreview: (...args: unknown[]) => buildQuickOrderPreview(...args),
}))

vi.mock('@/lib/intranet/quick-order/add-lines', () => ({
  buildQuickOrderAdditions: (...args: unknown[]) => buildQuickOrderAdditions(...args),
}))

describe('quick order API', () => {
  beforeEach(() => {
    requireB2bApiSession.mockReset()
    buildQuickOrderPreview.mockReset()
    buildQuickOrderAdditions.mockReset()
  })

  it('lookup returns 401 without B2B session', async () => {
    requireB2bApiSession.mockResolvedValue({
      error: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await lookupPost(
      new Request('http://localhost/api/intranet/quick-order/lookup', {
        method: 'POST',
        body: JSON.stringify({ reference: 'REF-001', qty: 1 }),
      }),
    )
    expect(res?.status).toBe(401)
  })

  it('lookup returns preview for REF-001', async () => {
    requireB2bApiSession.mockResolvedValue({ ctx: {}, customerId: 'cust-1' })
    buildQuickOrderPreview.mockResolvedValue({
      inputReference: 'REF-001',
      sku: 'REF-001',
      status: 'ok',
      quote: { netUnit: 10, grossUnit: 12.1, appliedRule: 'b2b_discount' },
    })
    const res = await lookupPost(
      new Request('http://localhost/api/intranet/quick-order/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: 'REF-001', qty: 1 }),
      }),
    )
    expect(res?.status).toBe(200)
    const body = (await res!.json()) as { preview: { sku: string } }
    expect(body.preview.sku).toBe('REF-001')
  })

  it('add returns 10 additions for RF-019 batch', async () => {
    requireB2bApiSession.mockResolvedValue({ ctx: {}, customerId: 'cust-1' })
    const items = Array.from({ length: 10 }, (_, i) => ({
      reference: `REF-${String(i + 1).padStart(3, '0')}`,
      qty: 1,
    }))
    buildQuickOrderAdditions.mockResolvedValue({
      additions: items.map((item, i) => ({
        productId: `slug-${i}`,
        sku: item.reference,
        qty: 1,
        quote: { netUnit: 1, grossUnit: 1.21, appliedRule: 'b2b_discount' },
      })),
      previews: [],
      missing: [],
    })
    const res = await addPost(
      new Request('http://localhost/api/intranet/quick-order/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }),
    )
    expect(res?.status).toBe(200)
    const body = (await res!.json()) as { additions: unknown[] }
    expect(body.additions).toHaveLength(10)
  })
})
