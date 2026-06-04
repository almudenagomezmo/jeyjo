function paypalBaseUrl(): string {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim()
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim()
  if (!clientId || !secret) return null

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64')
  const res = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { access_token?: string }
  return data.access_token ?? null
}

export async function createPayPalCheckoutOrder(input: {
  orderNumber: string
  amountEuros: number
  returnUrl: string
  cancelUrl: string
}): Promise<{ id: string; approvalUrl: string } | null> {
  const token = await getPayPalAccessToken()
  if (!token) return null

  const res = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.orderNumber,
          amount: {
            currency_code: 'EUR',
            value: input.amountEuros.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        user_action: 'PAY_NOW',
      },
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return null

  const data = (await res.json()) as {
    id?: string
    links?: { rel: string; href: string }[]
  }
  const approval = data.links?.find((l) => l.rel === 'approve')
  if (!data.id || !approval?.href) return null
  return { id: data.id, approvalUrl: approval.href }
}

export async function capturePayPalOrder(
  paypalOrderId: string,
): Promise<{ captureId: string; status: string } | null> {
  const token = await getPayPalAccessToken()
  if (!token) return null

  const res = await fetch(
    `${paypalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    },
  )
  if (!res.ok) return null

  const data = (await res.json()) as {
    status?: string
    purchase_units?: {
      payments?: { captures?: { id?: string; status?: string }[] }
    }[]
  }
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0]
  if (!capture?.id) return null
  return { captureId: capture.id, status: capture.status ?? data.status ?? 'COMPLETED' }
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
}
