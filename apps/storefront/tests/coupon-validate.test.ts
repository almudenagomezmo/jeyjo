import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { PriceQuote } from '@jeyjo/pricing'

import { validateCoupon } from '@/lib/coupon/validate'
import type { CartProductSnapshot } from '@/lib/cart/types'
import type { CartLine } from '@/lib/types'

vi.mock('@/lib/coupon/fetch', () => ({
  fetchCouponByCode: vi.fn(),
}))

vi.mock('@/lib/coupon/enabled', () => ({
  isMarketingCouponsEnabled: () => true,
}))

import { fetchCouponByCode } from '@/lib/coupon/fetch'

const products: CartProductSnapshot[] = [
  {
    slug: 'item-a',
    skuErp: 'SKU-A',
    name: 'Item',
    ref: 'R1',
    packUnit: 1,
    imageUrl: null,
    vatRate: 21,
    brand: 'B',
    glyph: 'pen',
  },
]

function quote(net: number): PriceQuote {
  return {
    sku: 'SKU-A',
    netUnit: net,
    grossUnit: net * 1.21,
    vatRate: 21,
    appliedRule: 'p1_retail',
  }
}

describe('validateCoupon', () => {
  beforeEach(() => {
    vi.mocked(fetchCouponByCode).mockReset()
  })

  it('CA-CHECKOUT-004: BLOG5 5% on 100 eligible', async () => {
    vi.mocked(fetchCouponByCode).mockResolvedValue({
      id: 1,
      code: 'BLOG5',
      discountType: 'percent',
      discountValue: 5,
      minimumOrderAmount: 0,
      validFrom: '2020-01-01',
      validUntil: '2099-12-31',
      active: true,
      usesCount: 0,
      maxUses: null,
    })

    const lines: CartLine[] = [{ productId: 'item-a', qty: 100 }]
    const result = await validateCoupon({
      code: 'BLOG5',
      lines,
      products,
      quotes: { 'SKU-A': quote(1 / 1.21) },
      mode: 'b2c',
    })

    expect(result.valid).toBe(true)
    expect(result.discountAmount).toBe(5)
  })

  it('fixed discount caps at eligible subtotal', async () => {
    vi.mocked(fetchCouponByCode).mockResolvedValue({
      id: 2,
      code: 'FIX15',
      discountType: 'fixed',
      discountValue: 15,
      minimumOrderAmount: 0,
      validFrom: '2020-01-01',
      validUntil: '2099-12-31',
      active: true,
      usesCount: 0,
      maxUses: null,
    })

    const lines: CartLine[] = [{ productId: 'item-a', qty: 10 }]
    const result = await validateCoupon({
      code: 'FIX15',
      lines,
      products,
      quotes: { 'SKU-A': quote(1 / 1.21) },
      mode: 'b2c',
    })

    expect(result.valid).toBe(true)
    expect(result.discountAmount).toBe(10)
  })
})
