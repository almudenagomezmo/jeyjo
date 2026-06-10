import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchWebPurchaseHistoryLines, fetchWebConfirmedPurchaseHistoryLines } =
  await import('@/lib/orders/fetch-customer-orders')

describe('fetchWebPurchaseHistoryLines', () => {
  beforeEach(() => {
    process.env.CMS_URL = 'http://cms.test'
    process.env.STOREFRONT_PAYLOAD_API_KEY = 'test-key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.CMS_URL
    delete process.env.STOREFRONT_PAYLOAD_API_KEY
  })

  const baseOrder = {
    id: 1,
    orderNumber: 'JW-TEST',
    createdAt: '2026-06-10T10:00:00.000Z',
    origin: 'b2b',
    amount: 10,
    deliveryMethod: 'home',
    pickupStoreLabel: null,
    orderLineSnapshots: [{ skuErp: 'REF-010', qty: 2, unitPrice: 5 }],
  }

  function mockOrders(docs: Array<typeof baseOrder & { jeyjoStatus: string | null }>) {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ docs }), { status: 200 }),
    )
  }

  it('includes pending_confirmation orders in purchase history', async () => {
    mockOrders([{ ...baseOrder, jeyjoStatus: 'pending_confirmation' }])

    const lines = await fetchWebPurchaseHistoryLines('cust-1')
    expect(lines).toEqual([
      {
        sku: 'REF-010',
        quantity: 2,
        purchasedAt: '2026-06-10',
        historicalUnitPrice: 5,
        orderStatus: 'pending_confirmation',
        orderNumber: 'JW-TEST',
        orderId: 1,
      },
    ])
  })

  it('includes pending_company_approval orders in purchase history', async () => {
    mockOrders([{ ...baseOrder, jeyjoStatus: 'pending_company_approval' }])

    const lines = await fetchWebPurchaseHistoryLines('cust-1')
    expect(lines).toHaveLength(1)
    expect(lines[0]?.sku).toBe('REF-010')
  })

  it('excludes pending_payment orders from purchase history', async () => {
    mockOrders([{ ...baseOrder, jeyjoStatus: 'pending_payment' }])

    const lines = await fetchWebPurchaseHistoryLines('cust-1')
    expect(lines).toEqual([])
  })

  it('confirmed-only helper excludes pending B2B orders', async () => {
    mockOrders([
      { ...baseOrder, jeyjoStatus: 'pending_confirmation' },
      { ...baseOrder, id: 2, jeyjoStatus: 'confirmed' },
    ])

    const lines = await fetchWebConfirmedPurchaseHistoryLines('cust-1')
    expect(lines).toHaveLength(1)
    expect(lines[0]?.sku).toBe('REF-010')
  })
})
