import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET, POST } from '@/app/api/intranet/rma-incidents/route'

const requireB2bApiSession = vi.fn()
const buildRmaListPage = vi.fn()
const submitRmaRequest = vi.fn()

vi.mock('@/lib/intranet/b2b-api-guard', () => ({
  requireB2bApiSession: (...args: unknown[]) => requireB2bApiSession(...args),
}))

vi.mock('@/lib/intranet/rma/service', () => ({
  buildRmaListPage: (...args: unknown[]) => buildRmaListPage(...args),
  submitRmaRequest: (...args: unknown[]) => submitRmaRequest(...args),
}))

describe('RMA incidents API', () => {
  beforeEach(() => {
    requireB2bApiSession.mockReset()
    buildRmaListPage.mockReset()
    submitRmaRequest.mockReset()
  })

  it('GET returns 401 without B2B session', async () => {
    requireB2bApiSession.mockResolvedValue({
      error: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await GET(new Request('http://localhost/api/intranet/rma-incidents'))
    expect(res.status).toBe(401)
  })

  it('GET lists incidents for customer', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: { email: 'empresa@test.com' },
      customerId: 'cust-uuid',
    })
    buildRmaListPage.mockResolvedValue({
      incidents: [{ id: 1, rmaNumber: 'RMA-2026-0001', status: 'requested' }],
      total: 1,
      page: 1,
      pageSize: 25,
    })

    const res = await GET(new Request('http://localhost/api/intranet/rma-incidents?status=open'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.incidents).toHaveLength(1)
    expect(buildRmaListPage).toHaveBeenCalledWith('cust-uuid', expect.objectContaining({ status: 'open' }))
  })

  it('POST returns rmaNumber on success', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: { email: 'empresa@test.com' },
      customerId: 'cust-uuid',
    })
    submitRmaRequest.mockResolvedValue({
      result: { id: 1, rmaNumber: 'RMA-2026-0042', status: 'requested' },
    })

    const res = await POST(
      new Request('http://localhost/api/intranet/rma-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleSku: 'REF-011',
          deliveryNoteNumber: 'ALB-2026-001',
          reason: 'wrong_item',
          observations: 'Pedí azul, me enviaron rojo',
        }),
      }),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.rmaNumber).toBe('RMA-2026-0042')
  })

  it('POST returns 400 on validation error', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: { email: 'empresa@test.com' },
      customerId: 'cust-uuid',
    })
    submitRmaRequest.mockResolvedValue({
      error: { field: 'observations', message: 'Describe el motivo' },
    })

    const res = await POST(
      new Request('http://localhost/api/intranet/rma-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleSku: 'REF-011',
          deliveryNoteNumber: 'ALB-2026-001',
          reason: 'other',
        }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('POST returns 409 on duplicate', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: { email: 'empresa@test.com' },
      customerId: 'cust-uuid',
    })
    submitRmaRequest.mockResolvedValue({
      error: {
        field: 'articleSku',
        code: 'DUPLICATE',
        message: 'Ya existe una solicitud reciente',
      },
    })

    const res = await POST(
      new Request('http://localhost/api/intranet/rma-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleSku: 'REF-011',
          deliveryNoteNumber: 'ALB-2026-001',
          reason: 'wrong_item',
        }),
      }),
    )
    expect(res.status).toBe(409)
  })
})
