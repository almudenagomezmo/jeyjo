import type { PriceQuote } from '@jeyjo/pricing'

import type { CartProductSnapshot } from '@/lib/cart/types'
import type { CartLine, PriceMode } from '@/lib/types'

import { computeEligibleSubtotal } from './eligible'
import { isMarketingCouponsEnabled } from './enabled'
import { fetchCouponByCode } from './fetch'
import type { CouponErrorCode, CouponValidationResult } from './types'

const round2 = (n: number): number => Math.round(n * 100) / 100

function invalid(errors: CouponErrorCode[]): CouponValidationResult {
  return {
    valid: false,
    couponCode: null,
    discountAmount: 0,
    eligibleSubtotal: 0,
    ineligibleOfferLines: [],
    showOfferExclusionWarning: false,
    label: null,
    errors,
  }
}

function couponLabel(_code: string, type: 'percent' | 'fixed', value: number): string {
  if (type === 'percent') return `${value}% de descuento`
  return `${value.toFixed(2)} € de descuento`
}

export function formatCheckoutDiscountLine(
  couponCode: string | null,
  couponLabel: string | null,
): string {
  if (!couponCode) return 'Descuento'
  if (!couponLabel) return `Descuento (${couponCode})`
  const shortLabel = couponLabel.replace(/ de descuento$/i, '')
  return `Descuento (${couponCode} · ${shortLabel})`
}

export async function validateCoupon(args: {
  code: string | null | undefined
  lines: CartLine[]
  products: CartProductSnapshot[]
  quotes: Record<string, PriceQuote>
  mode: PriceMode
}): Promise<CouponValidationResult> {
  const code = args.code?.trim().toUpperCase() ?? ''
  if (!code) return invalid([])

  if (!isMarketingCouponsEnabled()) {
    return invalid(['disabled'])
  }

  const coupon = await fetchCouponByCode(code)
  if (!coupon) return invalid(['not_found'])

  if (coupon.active === false) return invalid(['inactive'])

  const { eligibleSubtotal, ineligibleOfferLines } = computeEligibleSubtotal(
    args.lines,
    args.products,
    args.quotes,
    args.mode,
  )

  const minimum = coupon.minimumOrderAmount ?? 0
  if (eligibleSubtotal < minimum) {
    return { ...invalid(['minimum_not_met']), eligibleSubtotal }
  }

  const maxUses = coupon.maxUses
  const usesCount = coupon.usesCount ?? 0
  if (maxUses != null && usesCount >= maxUses) {
    return invalid(['max_uses_reached'])
  }

  let discountAmount = 0
  if (coupon.discountType === 'percent') {
    discountAmount = round2(eligibleSubtotal * (coupon.discountValue / 100))
  } else {
    discountAmount = round2(Math.min(coupon.discountValue, eligibleSubtotal))
  }

  return {
    valid: true,
    couponCode: coupon.code,
    discountAmount,
    eligibleSubtotal,
    ineligibleOfferLines,
    showOfferExclusionWarning: ineligibleOfferLines.length > 0,
    label: couponLabel(coupon.code, coupon.discountType, coupon.discountValue),
    errors: [],
  }
}
