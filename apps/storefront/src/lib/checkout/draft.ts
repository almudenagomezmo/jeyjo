import type { DeliveryMethod } from '@/lib/checkout/totals'

export const CHECKOUT_DRAFT_KEY = 'jeyjo-checkout-draft'

export type CheckoutDraft = {
  step: 'delivery' | 'review'
  deliveryMethod: DeliveryMethod
  alternateAddressId: string | null
  guestEmail: string
  customerNotes: string
  paymentMethodCode: string
  updatedAt: number
}

export function loadCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as CheckoutDraft
    if (Date.now() - draft.updatedAt > 30 * 60 * 1000) {
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY)
      return null
    }
    return draft
  } catch {
    return null
  }
}

export function saveCheckoutDraft(draft: CheckoutDraft) {
  sessionStorage.setItem(
    CHECKOUT_DRAFT_KEY,
    JSON.stringify({ ...draft, updatedAt: Date.now() }),
  )
}
