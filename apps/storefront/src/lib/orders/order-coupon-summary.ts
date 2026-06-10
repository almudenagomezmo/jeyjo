import { fetchCouponByCode } from '@/lib/coupon/fetch'
import type { PayloadCouponDoc } from '@/lib/coupon/types'

export type OrderCouponSummary = {
  couponCode: string | null
  couponLabel: string | null
  couponDiscount: number
}

export function couponLabelFromDoc(coupon: PayloadCouponDoc): string {
  return coupon.discountType === 'percent'
    ? `${coupon.discountValue}% de descuento`
    : `${coupon.discountValue.toFixed(2)} € de descuento`
}

export function deriveOrderCouponDiscount(args: {
  linesSubtotal: number
  shippingCost: number
  orderTotal: number
}): number {
  return Math.max(
    0,
    Math.round((args.linesSubtotal + args.shippingCost - args.orderTotal) * 100) / 100,
  )
}

export async function resolveOrderCouponSummary(args: {
  couponCode: string | null | undefined
  linesSubtotal: number
  shippingCost: number
  orderTotal: number
}): Promise<OrderCouponSummary> {
  const couponCode = args.couponCode?.trim() || null
  if (!couponCode) {
    return { couponCode: null, couponLabel: null, couponDiscount: 0 }
  }

  const coupon = await fetchCouponByCode(couponCode)
  const couponLabel = coupon ? couponLabelFromDoc(coupon) : null
  const couponDiscount = deriveOrderCouponDiscount({
    linesSubtotal: args.linesSubtotal,
    shippingCost: args.shippingCost,
    orderTotal: args.orderTotal,
  })

  return { couponCode, couponLabel, couponDiscount }
}
