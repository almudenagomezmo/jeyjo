import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/intranet/purchase-history/route'
import { POST } from '@/app/api/intranet/purchase-history/repeat/route'

const requireB2bApiSession = vi.fn()
const buildPurchaseHistoryPage = vi.fn()
const fetchPublicProductsBySkus = vi.fn()
const resolvePriceQuotesBatch = vi.fn()

vi.mock('@/lib/intranet/b2b-api-guard', () => ({
  requireB2bApiSession: () => requireB2bApiSession(),
}))

vi.mock('@/lib/intranet/purchase-history/service', () => ({
  buildPurchaseHistoryPage: (...args: unknown[]) => buildPurchaseHistoryPage(...args),
}))

vi.mock('@/lib/catalog/fetch-public-products-by-skus', () => ({
  fetchPublicProductsBySkus: (...args: unknown[]) => fetchPublicProductsBySkus(...args),
}))

vi.mock('@/lib/pricing/resolve-batch', () => ({
  resolvePriceQuotesBatch: (...args: unknown[]) => resolvePriceQuotesBatch(...args),
}))

vi.mock('@/lib/catalog/public-product-filter', () => ({
  isPublicCatalogProduct: () => true,
}))

describe('purchase history API', () => {
  beforeEach(() => {
    requireB2bApiSession.mockReset()
    buildPurchaseHistoryPage.mockReset()
    fetchPublicProductsBySkus.mockReset()
    resolvePriceQuotesBatch.mockReset()
  })

  it('GET returns 401 without B2B session', async () => {
    requireB2bApiSession.mockResolvedValue({
      error: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await GET(new Request('http://localhost/api/intranet/purchase-history'))
    expect(res?.status).toBe(401)
  })

  it('GET returns 403 without orders permission', async () => {
    requireB2bApiSession.mockResolvedValue({
      error: Response.json({ error: 'Forbidden' }, { status: 403 }),
    })
    const res = await GET(new Request('http://localhost/api/intranet/purchase-history'))
    expect(res?.status).toBe(403)
  })

  it('GET returns REF-010 with current price not equal to historical (CA-B2B-004)', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: {},
      customerId: 'a0000001-0001-4001-8001-000000000001',
    })
    buildPurchaseHistoryPage.mockResolvedValue({
      orders: [
        {
          orderKey: 'erp-2026-01-15-Sede central',
          orderId: null,
          orderNumber: null,
          orderStatus: null,
          purchasedAt: '2026-01-15',
          department: 'Sede central',
          lines: [
            {
              sku: 'REF-010',
              qty: 12,
              historicalUnitPrice: 5,
              currentQuote: { netUnit: 5.5, grossUnit: 6.66, appliedRule: 'b2b_discount' },
              canRepeat: true,
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
      departments: ['Sede central'],
    })

    const res = await GET(new Request('http://localhost/api/intranet/purchase-history'))
    expect(res?.status).toBe(200)
    const body = (await res!.json()) as {
      orders: Array<{
        lines: Array<{ historicalUnitPrice: number; currentQuote: { netUnit: number } }>
      }>
    }
    const line = body.orders[0]?.lines[0]
    expect(line?.currentQuote.netUnit).toBe(5.5)
    expect(line?.historicalUnitPrice).toBe(5)
    expect(line?.currentQuote.netUnit).not.toBe(line?.historicalUnitPrice)
  })

  it('POST repeat rejects wildcard SKU', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: {},
      customerId: 'cust-1',
    })
    const res = await POST(
      new Request('http://localhost/api/intranet/purchase-history/repeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ sku: '9000000001', qty: 1 }] }),
      }),
    )
    expect(res?.status).toBe(400)
  })
})
