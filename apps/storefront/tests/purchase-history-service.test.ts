import { describe, expect, it } from 'vitest'

import { mergePurchaseHistoryLines } from '@/lib/intranet/purchase-history/merge'

function filterByStatus(
  lines: ReturnType<typeof mergePurchaseHistoryLines>,
  status?: string,
) {
  const needle = status?.trim()
  if (!needle) return lines
  return lines.filter((line) => line.lastOrderStatus === needle)
}

describe('purchase history status filter', () => {
  const merged = mergePurchaseHistoryLines([
    {
      sku: 'REF-A',
      quantity: 1,
      purchasedAt: '2026-06-10',
      historicalUnitPrice: 5,
      orderStatus: 'pending_confirmation',
      orderNumber: 'JW-1',
      orderId: 1,
    },
    {
      sku: 'REF-B',
      quantity: 2,
      purchasedAt: '2026-06-09',
      historicalUnitPrice: 3,
      orderStatus: 'confirmed',
      orderNumber: 'JW-2',
      orderId: 2,
    },
    {
      sku: 'REF-C',
      quantity: 4,
      purchasedAt: '2026-05-01',
      historicalUnitPrice: 2,
    },
  ])

  it('returns all lines when status filter is empty', () => {
    expect(filterByStatus(merged, '')).toHaveLength(3)
  })

  it('filters lines by last order status', () => {
    expect(filterByStatus(merged, 'pending_confirmation').map((l) => l.sku)).toEqual(['REF-A'])
    expect(filterByStatus(merged, 'confirmed').map((l) => l.sku)).toEqual(['REF-B'])
  })

  it('excludes ERP-only lines when a web status is selected', () => {
    expect(filterByStatus(merged, 'confirmed').some((l) => l.sku === 'REF-C')).toBe(false)
  })
})
