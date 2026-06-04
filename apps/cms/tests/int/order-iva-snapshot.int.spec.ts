import { describe, it, expect } from 'vitest'

import { isOrderConfirming } from '@/collections/Orders/iva-snapshot'

describe('order IVA snapshot', () => {
  it('detects transition to confirmed', () => {
    expect(isOrderConfirming('confirmed', 'pending')).toBe(true)
    expect(isOrderConfirming('confirmed', 'confirmed')).toBe(false)
    expect(isOrderConfirming('pending', 'pending')).toBe(false)
  })

  it('draft orders do not require confirm path', () => {
    expect(isOrderConfirming('pending', undefined)).toBe(false)
  })
})
