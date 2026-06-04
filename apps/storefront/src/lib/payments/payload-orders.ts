export type PayloadOrderDoc = {
  id: number
  orderNumber?: string
  jeyjoStatus?: string
  paymentStatus?: string
  paymentMethodCode?: string
  amount?: number
  total?: number
  gateway?: string
}

function payloadBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

function payloadHeaders(): HeadersInit | null {
  const apiKey = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!apiKey) return null
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
}

export async function findPayloadOrderByNumber(
  orderNumber: string,
): Promise<PayloadOrderDoc | null> {
  const base = payloadBaseUrl()
  const headers = payloadHeaders()
  if (!base || !headers) return null

  const params = new URLSearchParams({
    'where[orderNumber][equals]': orderNumber,
    limit: '1',
    depth: '0',
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/orders?${params}`, {
    headers,
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return null

  const data = (await res.json()) as { docs?: PayloadOrderDoc[] }
  return data.docs?.[0] ?? null
}

export async function findPayloadOrderById(id: number): Promise<PayloadOrderDoc | null> {
  const base = payloadBaseUrl()
  const headers = payloadHeaders()
  if (!base || !headers) return null

  const res = await fetch(`${base.replace(/\/$/, '')}/api/orders/${id}`, {
    headers,
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return null
  const data = (await res.json()) as PayloadOrderDoc
  return data
}

export type UpdateOrderPaymentInput = {
  orderId: number
  jeyjoStatus?: string
  paymentStatus?: string
  gateway?: string
  gatewayTransactionId?: string | null
  gatewayAuthCode?: string | null
  paidAmount?: number | null
  paidAt?: string | null
  paymentFailureReason?: string | null
}

export async function updateOrderPaymentStatus(
  input: UpdateOrderPaymentInput,
): Promise<boolean> {
  const base = payloadBaseUrl()
  const headers = payloadHeaders()
  if (!base || !headers) return false

  const body: Record<string, unknown> = {}
  if (input.jeyjoStatus) body.jeyjoStatus = input.jeyjoStatus
  if (input.paymentStatus) body.paymentStatus = input.paymentStatus
  if (input.gateway) body.gateway = input.gateway
  if (input.gatewayTransactionId !== undefined) {
    body.gatewayTransactionId = input.gatewayTransactionId
  }
  if (input.gatewayAuthCode !== undefined) body.gatewayAuthCode = input.gatewayAuthCode
  if (input.paidAmount !== undefined) body.paidAmount = input.paidAmount
  if (input.paidAt !== undefined) body.paidAt = input.paidAt
  if (input.paymentFailureReason !== undefined) {
    body.paymentFailureReason = input.paymentFailureReason
  }

  const res = await fetch(`${base.replace(/\/$/, '')}/api/orders/${input.orderId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  })
  return res.ok
}
