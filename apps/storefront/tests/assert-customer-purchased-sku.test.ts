import { afterEach, describe, expect, it, vi } from 'vitest'

import * as ordersModule from '@/lib/orders/fetch-customer-orders'
import * as adminModule from '@/lib/supabase/admin'

const { assertCustomerPurchasedSku } = await import(
  '@/lib/reviews/assert-customer-purchased-sku'
)

describe('assertCustomerPurchasedSku', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when web order contains SKU (case-insensitive)', async () => {
    vi.spyOn(ordersModule, 'fetchWebPurchaseHistoryLines').mockResolvedValue([
      {
        sku: 'ref-001',
        quantity: 2,
        purchasedAt: '2025-01-01T00:00:00.000Z',
        historicalUnitPrice: 10,
        department: null,
      },
    ])
    vi.spyOn(adminModule, 'getSupabaseAdminClient').mockReturnValue(null)

    const result = await assertCustomerPurchasedSku('cust-1', 'REF-001')
    expect(result).toBe(true)
  })

  it('returns false when no matching SKU in history', async () => {
    vi.spyOn(ordersModule, 'fetchWebPurchaseHistoryLines').mockResolvedValue([
      {
        sku: 'OTHER-SKU',
        quantity: 1,
        purchasedAt: '2025-01-01T00:00:00.000Z',
        historicalUnitPrice: 5,
        department: null,
      },
    ])
    vi.spyOn(adminModule, 'getSupabaseAdminClient').mockReturnValue(null)

    const result = await assertCustomerPurchasedSku('cust-1', 'REF-001')
    expect(result).toBe(false)
  })
})
