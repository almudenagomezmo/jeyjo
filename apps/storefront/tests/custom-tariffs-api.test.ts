import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/intranet/custom-tariffs/route'
import { POST } from '@/app/api/intranet/custom-tariffs/review-request/route'

const requireB2bApiSession = vi.fn()
const buildCustomTariffsPage = vi.fn()
const submitPriceReviewRequest = vi.fn()

vi.mock('@/lib/intranet/b2b-api-guard', () => ({
  requireB2bApiSession: () => requireB2bApiSession(),
}))

vi.mock('@/lib/intranet/custom-tariffs/service', () => ({
  buildCustomTariffsPage: (...args: unknown[]) => buildCustomTariffsPage(...args),
}))

vi.mock('@/lib/intranet/custom-tariffs/review-request', () => ({
  submitPriceReviewRequest: (...args: unknown[]) => submitPriceReviewRequest(...args),
}))

describe('custom tariffs API', () => {
  beforeEach(() => {
    requireB2bApiSession.mockReset()
    buildCustomTariffsPage.mockReset()
    submitPriceReviewRequest.mockReset()
  })

  it('GET returns 401 without B2B session', async () => {
    requireB2bApiSession.mockResolvedValue({
      error: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await GET(new Request('http://localhost/api/intranet/custom-tariffs'))
    expect(res?.status).toBe(401)
  })

  it('GET returns vigente without review and caducado with review flag', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: {},
      customerId: 'a0000001-0001-4001-8001-000000000002',
    })
    buildCustomTariffsPage.mockResolvedValue({
      specialPrices: [
        {
          sku: 'REF-004',
          statusLabel: 'Vigente',
          canRequestReview: false,
        },
        {
          sku: 'REF-002',
          statusLabel: 'Caducado',
          canRequestReview: true,
        },
      ],
      groupOffers: [{ sku: 'REF-003' }],
      total: 2,
      page: 1,
      pageSize: 25,
    })

    const res = await GET(new Request('http://localhost/api/intranet/custom-tariffs'))
    expect(res?.status).toBe(200)
    const body = (await res!.json()) as {
      specialPrices: Array<{ sku: string; canRequestReview: boolean }>
      groupOffers: Array<{ sku: string }>
    }
    const vigente = body.specialPrices.find((r) => r.sku === 'REF-004')
    const caducado = body.specialPrices.find((r) => r.sku === 'REF-002')
    expect(vigente?.canRequestReview).toBe(false)
    expect(caducado?.canRequestReview).toBe(true)
    expect(body.groupOffers.some((o) => o.sku === 'REF-003')).toBe(true)
  })

  it('POST review returns 409 on duplicate', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: {},
      customerId: 'cust-1',
    })
    submitPriceReviewRequest.mockResolvedValue({
      error: 'duplicate',
      status: 409,
    })

    const res = await POST(
      new Request('http://localhost/api/intranet/custom-tariffs/review-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: 'REF-002' }),
      }),
    )
    expect(res?.status).toBe(409)
  })

  it('POST review succeeds for expired SKU', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: {},
      customerId: 'cust-1',
    })
    submitPriceReviewRequest.mockResolvedValue({ quoteNumber: 'Q-PR-001' })

    const res = await POST(
      new Request('http://localhost/api/intranet/custom-tariffs/review-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: 'REF-002' }),
      }),
    )
    expect(res?.status).toBe(200)
    const body = (await res!.json()) as { quoteNumber: string }
    expect(body.quoteNumber).toBe('Q-PR-001')
  })
})
