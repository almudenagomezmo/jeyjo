import type { CheckoutSegment } from '@/lib/checkout/segment'
import type { DeliveryMethod } from '@/lib/checkout/totals'
import type { QuotePreparePayload } from '@/lib/quotes/prepare-token'

export type RequestQuoteInput = {
  prepare: QuotePreparePayload
  customerId: string | null
  guestEmail: string | null
  deliveryMethod: DeliveryMethod
  pickupStoreLabel: string | null
  shippingAddressSnapshot: Record<string, unknown> | null
  billingAddressSnapshot: Record<string, unknown> | null
  customerNotes: string | null
}

function payloadBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

export async function createPayloadQuote(
  prepareToken: string,
  input: Omit<RequestQuoteInput, 'prepare'>,
): Promise<{ quoteNumber: string; id: number } | null> {
  const base = payloadBaseUrl()
  const apiKey = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!base || !apiKey) return null

  const body = {
    prepareToken,
    customerRef: input.customerId,
    guestEmail: input.guestEmail,
    deliveryMethod: input.deliveryMethod,
    pickupStoreLabel: input.pickupStoreLabel,
    shippingAddressSnapshot: input.shippingAddressSnapshot,
    billingAddressSnapshot: input.billingAddressSnapshot,
    customerNotes: input.customerNotes,
  }

  const res = await fetch(`${base.replace(/\/$/, '')}/api/quotes/storefront-create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Payload quote create failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as { doc?: { id?: number; quoteNumber?: string } }
  const doc = data.doc
  if (!doc?.quoteNumber) return null
  return { quoteNumber: doc.quoteNumber, id: doc.id ?? 0 }
}

export async function fetchCustomerQuotes(
  customerId: string,
): Promise<
  {
    id: number
    quoteNumber: string | null
    status: string | null
    amount: number | null
    createdAt: string
  }[]
> {
  const base = payloadBaseUrl()
  const apiKey = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!base || !apiKey) return []

  const params = new URLSearchParams({ customerRef: customerId })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/quotes/storefront-mine?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(5000),
  })

  if (!res.ok) return []

  const data = (await res.json()) as {
    docs?: {
      id: number
      quoteNumber?: string | null
      status?: string | null
      amount?: number | null
      createdAt: string
    }[]
  }

  return (data.docs ?? []).map((d) => ({
    id: d.id,
    quoteNumber: d.quoteNumber ?? null,
    status: d.status ?? null,
    amount: d.amount ?? null,
    createdAt: d.createdAt,
  }))
}

export function segmentFromPrepare(prepare: QuotePreparePayload): CheckoutSegment {
  return prepare.segment
}
