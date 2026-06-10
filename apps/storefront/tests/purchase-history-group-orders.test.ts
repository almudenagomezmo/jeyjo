import { describe, expect, it } from 'vitest'

import { filterOrderGroups, groupRawLinesIntoOrders } from '@/lib/intranet/purchase-history/group-orders'

describe('groupRawLinesIntoOrders', () => {
  it('groups web lines by order id', () => {
    const orders = groupRawLinesIntoOrders([
      {
        sku: 'REF-A',
        quantity: 2,
        purchasedAt: '2026-06-10',
        historicalUnitPrice: 5,
        orderStatus: 'confirmed',
        orderNumber: 'JW-1',
        orderId: 1,
      },
      {
        sku: 'REF-B',
        quantity: 1,
        purchasedAt: '2026-06-10',
        historicalUnitPrice: 3,
        orderStatus: 'confirmed',
        orderNumber: 'JW-1',
        orderId: 1,
      },
      {
        sku: 'REF-C',
        quantity: 4,
        purchasedAt: '2026-06-09',
        historicalUnitPrice: 2,
        orderStatus: 'confirmed',
        orderNumber: 'JW-2',
        orderId: 2,
      },
    ])

    expect(orders).toHaveLength(2)
    expect(orders[0]?.orderId).toBe(1)
    expect(orders[0]?.lines).toHaveLength(2)
    expect(orders[1]?.orderId).toBe(2)
  })

  it('groups ERP lines by date and department', () => {
    const orders = groupRawLinesIntoOrders([
      {
        sku: 'REF-A',
        quantity: 2,
        purchasedAt: '2026-01-15',
        historicalUnitPrice: 5,
        department: 'Sede central',
      },
      {
        sku: 'REF-B',
        quantity: 1,
        purchasedAt: '2026-01-15',
        historicalUnitPrice: 3,
        department: 'Sede central',
      },
    ])

    expect(orders).toHaveLength(1)
    expect(orders[0]?.orderStatus).toBeNull()
    expect(orders[0]?.lines).toHaveLength(2)
  })
})

describe('filterOrderGroups', () => {
  const orders = groupRawLinesIntoOrders([
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
      department: 'Sede central',
    },
  ])

  it('filters orders by status', () => {
    const filtered = filterOrderGroups(orders, { status: 'confirmed' })
    expect(filtered.map((o) => o.orderId)).toEqual([2])
  })

  it('filters lines within orders by sku', () => {
    const filtered = filterOrderGroups(orders, { sku: 'REF-A' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.lines.map((l) => l.sku)).toEqual(['REF-A'])
  })

  it('filters orders by date when purchasedAt includes time', () => {
    const withTime = groupRawLinesIntoOrders([
      {
        sku: 'REF-A',
        quantity: 1,
        purchasedAt: '2026-06-10T15:30:00.000Z',
        historicalUnitPrice: 5,
        orderStatus: 'confirmed',
        orderNumber: 'JW-3',
        orderId: 3,
      },
    ])

    expect(filterOrderGroups(withTime, { from: '2026-06-10', to: '2026-06-10' })).toHaveLength(1)
    expect(filterOrderGroups(withTime, { to: '2026-06-09' })).toHaveLength(0)
  })
})
