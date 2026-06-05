import type { CheckoutSegment } from '@/lib/checkout/segment'
import { formatMoney } from '@/lib/utils/format'

export function formatShippingLine(segment: CheckoutSegment, shippingCost: number): string {
  if (shippingCost === 0) {
    return segment === 'b2c' ? 'Envío gratuito' : 'Envío gratuito (B2B)'
  }

  if (segment === 'b2c') {
    return `Gastos de envío: ${formatMoney(shippingCost)} (IVA incluido)`
  }

  return `Gastos de gestión: ${formatMoney(shippingCost)} (sin IVA)`
}
