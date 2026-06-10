import { describe, expect, it } from 'vitest'

import { appliedRuleLabel } from '@/lib/intranet/custom-tariffs/applied-rule'

describe('appliedRuleLabel', () => {
  it('maps pricing rules to Spanish labels', () => {
    expect(appliedRuleLabel('special_price')).toBe('Precio especial')
    expect(appliedRuleLabel('group_offer')).toBe('Oferta de grupo')
    expect(appliedRuleLabel('b2b_discount')).toBe('Descuento B2B')
    expect(appliedRuleLabel('p1_retail')).toBe('Tarifa P1')
  })
})
