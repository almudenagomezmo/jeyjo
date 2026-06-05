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

  it('allows storefront company approval transitions', () => {
    expect(isStorefrontStatusTransition('pending_company_approval', 'pending_confirmation')).toBe(
      true,
    )
    expect(isStorefrontStatusTransition('pending_company_approval', 'cancelled')).toBe(true)
    expect(() =>
      assertAllowedStatusTransition('pending_company_approval', 'pending_confirmation', {
        storefrontApi: true,
      }),
    ).not.toThrow()
  })

  it('rejects skip from company approval to confirmed', () => {
    expect(isStorefrontStatusTransition('pending_company_approval', 'confirmed')).toBe(false)
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
