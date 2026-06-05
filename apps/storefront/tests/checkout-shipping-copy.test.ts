import { describe, expect, it } from 'vitest'

import { formatShippingLine } from '@/lib/checkout/shipping-copy'
import { formatMoney } from '@/lib/utils/format'

describe('formatShippingLine', () => {
  it('CA-CHECKOUT-001 B2C below threshold copy', () => {
    expect(formatShippingLine('b2c', 5)).toBe(
      `Gastos de envío: ${formatMoney(5)} (IVA incluido)`,
    )
  })

  it('CA-CHECKOUT-002 B2C free shipping copy', () => {
    expect(formatShippingLine('b2c', 0)).toBe('Envío gratuito')
  })
})
