import { describe, it, expect } from 'vitest'

import {
  assertAllowedStatusTransition,
  isStaffStatusTransition,
  isStorefrontStatusTransition,
} from '@/collections/Orders/status-transitions'
import { isOrderExportable } from '@/lib/orders/oms-access'

describe('order status transitions', () => {
  it('allows staff B2B confirmation path', () => {
    expect(isStaffStatusTransition('pending_confirmation', 'confirmed')).toBe(true)
    expect(() =>
      assertAllowedStatusTransition('pending_confirmation', 'confirmed', { storefrontApi: false }),
    ).not.toThrow()
  })

  it('rejects invalid staff jump', () => {
    expect(isStaffStatusTransition('pending_payment', 'shipped')).toBe(false)
    expect(() =>
      assertAllowedStatusTransition('pending_payment', 'shipped', { storefrontApi: false }),
    ).toThrow()
  })

  it('allows storefront payment confirmation', () => {
    expect(isStorefrontStatusTransition('pending_payment', 'confirmed')).toBe(true)
    expect(() =>
      assertAllowedStatusTransition('pending_payment', 'confirmed', { storefrontApi: true }),
    ).not.toThrow()
  })
})

describe('isOrderExportable', () => {
  it('requires validated EVA', () => {
    expect(
      isOrderExportable({ origin: 'eva', jeyjoStatus: 'confirmed', validatedEva: false }),
    ).toBe(false)
    expect(
      isOrderExportable({ origin: 'eva', jeyjoStatus: 'confirmed', validatedEva: true }),
    ).toBe(true)
  })

  it('blocks pending payment', () => {
    expect(isOrderExportable({ origin: 'b2c', jeyjoStatus: 'pending_payment' })).toBe(false)
  })
})
