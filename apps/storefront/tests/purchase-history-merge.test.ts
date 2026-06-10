import { describe, expect, it } from 'vitest'

import { mergePurchaseHistoryLines } from '@/lib/intranet/purchase-history/merge'
import { filterNonWildcardLines } from '@/lib/intranet/purchase-history/wildcard'

describe('purchase history merge', () => {
  it('aggregates by SKU keeping latest purchase qty', () => {
    const merged = mergePurchaseHistoryLines([
      { sku: 'REF-010', quantity: 6, purchasedAt: '2025-06-01', historicalUnitPrice: 4 },
      { sku: 'REF-010', quantity: 12, purchasedAt: '2026-01-15', historicalUnitPrice: 5 },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0]?.usualQty).toBe(12)
    expect(merged[0]?.historicalUnitPrice).toBe(5)
  })

  it('keeps order status from the most recent web purchase', () => {
    const merged = mergePurchaseHistoryLines([
      {
        sku: 'REF-010',
        quantity: 6,
        purchasedAt: '2025-06-01',
        historicalUnitPrice: 4,
        orderStatus: 'confirmed',
        orderNumber: 'JW-OLD',
        orderId: 1,
      },
      {
        sku: 'REF-010',
        quantity: 12,
        purchasedAt: '2026-01-15',
        historicalUnitPrice: 5,
        orderStatus: 'pending_confirmation',
        orderNumber: 'JW-NEW',
        orderId: 2,
      },
    ])
    expect(merged[0]?.lastOrderStatus).toBe('pending_confirmation')
    expect(merged[0]?.lastOrderNumber).toBe('JW-NEW')
    expect(merged[0]?.lastOrderId).toBe(2)
  })

  it('excludes wildcard SKU', () => {
    const filtered = filterNonWildcardLines([
      { sku: 'REF-001' },
      { sku: '9000000001' },
    ])
    expect(filtered.map((l) => l.sku)).toEqual(['REF-001'])
  })
})
