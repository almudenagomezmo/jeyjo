export const RMA_REASON_VALUES = ['wrong_item', 'defective', 'wrong_qty', 'other'] as const

export type RmaReason = (typeof RMA_REASON_VALUES)[number]

export const RMA_REASON_LABELS: Record<RmaReason, string> = {
  wrong_item: 'Artículo incorrecto',
  defective: 'Artículo defectuoso',
  wrong_qty: 'Cantidad incorrecta',
  other: 'Otro',
}

export function isRmaReason(value: string | null | undefined): value is RmaReason {
  return RMA_REASON_VALUES.includes(value as RmaReason)
}

export function rmaReasonLabel(value: string | null | undefined): string {
  if (value && isRmaReason(value)) return RMA_REASON_LABELS[value]
  return value ?? '—'
}
