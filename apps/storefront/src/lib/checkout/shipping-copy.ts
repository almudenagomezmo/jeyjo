import { SHIPPING_RULES } from '@/lib/cart/shipping'
import type { CheckoutSegment } from '@/lib/checkout/segment'
import { formatMoney } from '@/lib/utils/format'

export function formatShippingLine(segment: CheckoutSegment, shippingCost: number): string {
  if (shippingCost === 0) {
    return segment === 'b2c' ? 'Envío gratuito' : 'Envío gratuito (B2B)'
  }

  if (segment === 'b2c') {
    // Normative copy CA-CHECKOUT-001 (fixed B2C rate v1)
    return 'Gastos de envío: 5,00 € (IVA incluido)'
  }

  return `Gastos de gestión: ${formatMoney(SHIPPING_RULES.b2b.cost)} (sin IVA)`
}
