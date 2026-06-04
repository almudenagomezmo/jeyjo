import { describe, expect, it } from 'vitest'

import { roundUpToPack } from '@/lib/pdp/pack-qty'

describe('roundUpToPack', () => {
  it('rounds 5 up to 12 when packUnit is 12', () => {
    expect(roundUpToPack(5, 12)).toBe(12)
  })

  it('keeps exact multiples', () => {
    expect(roundUpToPack(24, 12)).toBe(24)
  })
})
