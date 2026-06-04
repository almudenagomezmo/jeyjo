import type { PriceMode } from '@/lib/types'

export const SHIPPING_RULES = {
  b2c: { threshold: 39, cost: 5 },
  b2b: { threshold: 10, cost: 2.5 },
} as const

export function computeShippingPreview(subtotal: number, mode: PriceMode) {
  const { threshold, cost } = SHIPPING_RULES[mode]
  const shippingCost = subtotal >= threshold || subtotal === 0 ? 0 : cost
  const amountToFreeShipping = Math.max(0, Math.round((threshold - subtotal) * 100) / 100)
  return { shippingThreshold: threshold, shippingCost, amountToFreeShipping }
}
