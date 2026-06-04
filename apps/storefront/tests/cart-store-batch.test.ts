import { beforeEach, describe, expect, it } from 'vitest'

import { useCartStore } from '@/lib/store/cart-store'

describe('cart-store addItems', () => {
  beforeEach(() => {
    useCartStore.setState({ lines: [{ productId: 'ref-001', qty: 2 }] })
  })

  it('merges quantities for existing product', () => {
    useCartStore.getState().addItems([
      { productId: 'ref-001', qty: 12 },
      { productId: 'ref-002', qty: 1 },
    ])
    const lines = useCartStore.getState().lines
    expect(lines.find((l) => l.productId === 'ref-001')?.qty).toBe(14)
    expect(lines.find((l) => l.productId === 'ref-002')?.qty).toBe(1)
  })
})
