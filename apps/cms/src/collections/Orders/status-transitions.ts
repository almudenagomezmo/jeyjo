export const JEYJO_ORDER_STATUS_VALUES = [
  'pending',
  'pending_payment',
  'pending_confirmation',
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
] as const

export type JeyjoOrderStatus = (typeof JEYJO_ORDER_STATUS_VALUES)[number]

export const EXPORTABLE_JEYJO_STATUSES: JeyjoOrderStatus[] = [
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
]

const STAFF_STATUS_TRANSITIONS: Partial<Record<JeyjoOrderStatus, JeyjoOrderStatus[]>> = {
  pending_payment: ['confirmed', 'cancelled'],
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
}

const STOREFRONT_STATUS_TRANSITIONS: Partial<Record<JeyjoOrderStatus, JeyjoOrderStatus[]>> = {
  pending_payment: ['confirmed', 'pending_payment'],
}

export function isJeyjoOrderStatus(value: string | null | undefined): value is JeyjoOrderStatus {
  return JEYJO_ORDER_STATUS_VALUES.includes(value as JeyjoOrderStatus)
}

export function isStaffStatusTransition(
  from: JeyjoOrderStatus | null | undefined,
  to: JeyjoOrderStatus | null | undefined,
): boolean {
  if (!from || !to || from === to) return true
  const allowed = STAFF_STATUS_TRANSITIONS[from]
  return Boolean(allowed?.includes(to))
}

export function isStorefrontStatusTransition(
  from: JeyjoOrderStatus | null | undefined,
  to: JeyjoOrderStatus | null | undefined,
): boolean {
  if (!from || !to || from === to) return true
  const allowed = STOREFRONT_STATUS_TRANSITIONS[from]
  return Boolean(allowed?.includes(to))
}

export function assertAllowedStatusTransition(
  from: JeyjoOrderStatus | null | undefined,
  to: JeyjoOrderStatus | null | undefined,
  options: { storefrontApi: boolean },
): void {
  if (!to || !isJeyjoOrderStatus(to)) {
    throw new Error(`Invalid order status: ${to ?? 'empty'}`)
  }
  if (!from || from === to) return

  const allowed = options.storefrontApi
    ? isStorefrontStatusTransition(from, to)
    : isStaffStatusTransition(from, to)

  if (!allowed) {
    throw new Error(`Status transition not allowed: ${from} → ${to}`)
  }
}
