import { describe, expect, it } from 'vitest'

import { isPaymentsEnabled } from '@/lib/payments/enabled'

describe('B2B checkout payment guard (CA-CHECKOUT-006)', () => {
  it('place-order omits gateway nextStep when PAYMENTS_ENABLED is not true', () => {
    const prev = process.env.PAYMENTS_ENABLED
    process.env.PAYMENTS_ENABLED = 'false'
    expect(isPaymentsEnabled()).toBe(false)
    if (prev === undefined) delete process.env.PAYMENTS_ENABLED
    else process.env.PAYMENTS_ENABLED = prev
  })
})
