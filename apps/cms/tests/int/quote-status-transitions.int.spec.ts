import { describe, it, expect } from 'vitest'

import {
  assertAllowedQuoteTransition,
  canConvertQuoteToOrder,
  isStaffQuoteTransition,
} from '@/collections/Quotes/status-transitions'
import {
  mapQuoteToOrderCreateData,
  parseQuoteLineSnapshots,
} from '@/lib/quotes/map-quote-input'

describe('quote status transitions', () => {
  it('allows requested to in_review', () => {
    expect(isStaffQuoteTransition('requested', 'in_review')).toBe(true)
    expect(() => assertAllowedQuoteTransition('requested', 'in_review')).not.toThrow()
  })

  it('rejects requested to sent', () => {
    expect(isStaffQuoteTransition('requested', 'sent')).toBe(false)
    expect(() => assertAllowedQuoteTransition('requested', 'sent')).toThrow()
  })

  it('only accepted can convert to order', () => {
    expect(canConvertQuoteToOrder('accepted')).toBe(true)
    expect(canConvertQuoteToOrder('sent')).toBe(false)
  })
})

describe('mapQuoteToOrderCreateData', () => {
  it('maps line snapshots to order payload', () => {
    const lines = [
      { lineId: '1', skuErp: 'SKU-A', name: 'Product A', qty: 2, unitPrice: 10, lineTotal: 20 },
    ]
    const data = mapQuoteToOrderCreateData({
      quoteNumber: 'P-2026-00001',
      segment: 'b2c',
      customerRef: null,
      guestEmail: 'test@example.com',
      deliveryMethod: 'home',
      pickupStoreLabel: null,
      shippingAddressSnapshot: null,
      billingAddressSnapshot: null,
      customerNotes: 'Note',
      shippingCost: 5,
      amount: 25,
      lineSnapshots: lines,
    })

    expect(data.jeyjoStatus).toBe('pending_payment')
    expect(data.origin).toBe('b2c')
    expect(parseQuoteLineSnapshots(data.orderLineSnapshots)).toHaveLength(1)
  })

  it('uses pending_confirmation for b2b', () => {
    const data = mapQuoteToOrderCreateData({
      quoteNumber: 'P-2026-00002',
      segment: 'b2b',
      customerRef: 'uuid',
      guestEmail: null,
      deliveryMethod: 'pickup_alfaro',
      pickupStoreLabel: 'Alfaro',
      shippingAddressSnapshot: null,
      billingAddressSnapshot: null,
      customerNotes: null,
      shippingCost: 0,
      amount: 100,
      lineSnapshots: [],
    })

    expect(data.jeyjoStatus).toBe('pending_confirmation')
    expect(data.origin).toBe('b2b')
  })
})
