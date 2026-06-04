import type { PayloadRequest } from 'payload'
import { describe, it, expect } from 'vitest'

import { guardStockProductFields } from '@/stock/guardStockFields'

describe('stock field guard (beforeChange)', () => {
  it('reverts distrisantiagoStock when stockSync is not set', () => {
    const req = { context: {} } as PayloadRequest
    const data = guardStockProductFields({
      data: { distrisantiagoStock: 999, title: 'Test' },
      originalDoc: { distrisantiagoStock: 10, title: 'Test' },
      req,
    })
    expect(data?.distrisantiagoStock).toBe(10)
  })

  it('allows stock field change when stockSync is true', () => {
    const req = { context: { stockSync: true } } as PayloadRequest
    const data = guardStockProductFields({
      data: { stockIndicator: 'low' },
      originalDoc: { stockIndicator: 'available' },
      req,
    })
    expect(data?.stockIndicator).toBe('low')
  })
})
