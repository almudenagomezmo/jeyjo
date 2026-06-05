import { describe, expect, it } from 'vitest'

import { roundQtyToPack } from '@/lib/intranet/quick-order/pack-qty'

describe('roundQtyToPack (quick order)', () => {
  it('rounds 3 up to 6 when pack is 6', () => {
    expect(roundQtyToPack(3, 6)).toBe(6)
  })
})
