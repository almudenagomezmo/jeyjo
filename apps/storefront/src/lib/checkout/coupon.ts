export const DEMO_COUPONS: Record<string, { label: string; percent: number }> = {
  BLOG5: { label: '5% de descuento', percent: 5 },
  MAYO10: { label: '10% descuento mayo', percent: 10 },
}

export function validateDemoCoupon(code: string | null | undefined) {
  if (!code) return null
  const entry = DEMO_COUPONS[code.trim().toUpperCase()]
  if (!entry) return null
  return { code: code.trim().toUpperCase(), percent: entry.percent, label: entry.label }
}

export const CHECKOUT_COUPON_STORAGE_KEY = 'jeyjo-checkout-coupon'
