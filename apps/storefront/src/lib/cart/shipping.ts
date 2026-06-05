import type { PriceMode } from '@/lib/types'
import { DEFAULT_SHIPPING_RULES, type ShippingRules } from '@/lib/system-config/defaults'
import { getShippingRules } from '@/lib/system-config/fetch'

export { DEFAULT_SHIPPING_RULES as SHIPPING_RULES, type ShippingRules }

export function computeShippingPreview(
  subtotal: number,
  mode: PriceMode,
  rules: ShippingRules = DEFAULT_SHIPPING_RULES,
) {
  const { threshold, cost } = rules[mode]
  const shippingCost = subtotal >= threshold || subtotal === 0 ? 0 : cost
  const amountToFreeShipping = Math.max(0, Math.round((threshold - subtotal) * 100) / 100)
  return { shippingThreshold: threshold, shippingCost, amountToFreeShipping }
}

export async function resolveShippingRules(): Promise<ShippingRules> {
  return getShippingRules()
}
