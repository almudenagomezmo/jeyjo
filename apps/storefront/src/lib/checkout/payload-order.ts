import type { CheckoutSegment } from '@/lib/checkout/segment'
import type { DeliveryMethod } from '@/lib/checkout/totals'
import type { CheckoutPreparePayload } from '@/lib/checkout/prepare-token'
import { gatewayForMethod } from '@/lib/payments/settings'

export type PlaceOrderInput = {
  prepare: CheckoutPreparePayload
  segment: CheckoutSegment
  deliveryMethod: DeliveryMethod
  paymentMethodCode: string
  paymentMethodLabel: string
  customerId: string | null
  guestEmail: string | null
  customerNotes: string | null
  couponCode: string | null
  shippingAddressSnapshot: Record<string, unknown> | null
  billingAddressSnapshot: Record<string, unknown> | null
  pickupStoreLabel: string | null
  alternateAddressId: string | null
  jeyjoStatus?: string
  submittedByUserId?: string | null
  submittedByEmail?: string | null
}

function payloadBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

export async function createPayloadCheckoutOrder(
  input: PlaceOrderInput,
): Promise<{ orderNumber: string; id: number } | null> {
  const base = payloadBaseUrl()
  const apiKey = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!base || !apiKey) return null

  const { prepare, segment } = input
  const jeyjoStatus =
    input.jeyjoStatus ?? (segment === 'b2b' ? 'pending_confirmation' : 'pending_payment')

  const body: Record<string, unknown> = {
    origin: segment,
    jeyjoStatus,
    customerRef: input.customerId,
    customerEmail: input.guestEmail ?? undefined,
    guestEmail: input.guestEmail,
    deliveryMethod: input.deliveryMethod,
    shippingCost: prepare.totals.shippingCost,
    pickupStoreLabel: input.pickupStoreLabel,
    shippingAddressSnapshot: input.shippingAddressSnapshot,
    billingAddressSnapshot: input.billingAddressSnapshot,
    couponCode: input.couponCode,
    customerNotes: input.customerNotes,
    paymentMethodCode: input.paymentMethodCode,
    paymentMethodLabel: input.paymentMethodLabel,
    paymentStatus: segment === 'b2b' ? undefined : 'pending',
    gateway: gatewayForMethod(input.paymentMethodCode),
    amount: prepare.totals.total,
    orderLineSnapshots: prepare.lineSnapshots,
    items: [],
  }

  if (input.submittedByUserId) body.submittedByUserId = input.submittedByUserId
  if (input.submittedByEmail) body.submittedByEmail = input.submittedByEmail

  const res = await fetch(`${base.replace(/\/$/, '')}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Payload order create failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const doc = (await res.json()) as { doc?: { id?: number; orderNumber?: string } }
  const order = doc.doc
  if (!order?.orderNumber) return null
  return { orderNumber: order.orderNumber, id: order.id ?? 0 }
}
