import type { AppliedPriceRule } from '@jeyjo/pricing'

const LABELS: Record<AppliedPriceRule, string> = {
  special_price: 'Precio especial',
  group_offer: 'Oferta de grupo',
  b2b_discount: 'Descuento B2B',
  p1_retail: 'Tarifa P1',
}

export function appliedRuleLabel(rule: AppliedPriceRule): string {
  return LABELS[rule]
}
