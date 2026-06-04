export type PaymentMethodCode =
  | 'card'
  | 'bizum'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay'
  | 'transfer'

export type PaymentSettings = {
  cardEnabled: boolean
  bizumEnabled: boolean
  paypalEnabled: boolean
  applePayEnabled: boolean
  googlePayEnabled: boolean
  transferEnabled: boolean
  transferInstructions: {
    iban?: string | null
    beneficiary?: string | null
    conceptTemplate?: string | null
  }
}

const DEFAULT_SETTINGS: PaymentSettings = {
  cardEnabled: true,
  bizumEnabled: true,
  paypalEnabled: true,
  applePayEnabled: false,
  googlePayEnabled: false,
  transferEnabled: true,
  transferInstructions: {
    iban: null,
    beneficiary: null,
    conceptTemplate: 'Pedido {orderNumber}',
  },
}

let cached: { at: number; value: PaymentSettings } | null = null
const CACHE_MS = 60_000

function payloadBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.value
  }

  const base = payloadBaseUrl()
  const apiKey = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!base || !apiKey) {
    return DEFAULT_SETTINGS
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/globals/paymentSettings`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) {
      return DEFAULT_SETTINGS
    }
    const doc = (await res.json()) as Partial<PaymentSettings>
    const value: PaymentSettings = {
      cardEnabled: doc.cardEnabled ?? DEFAULT_SETTINGS.cardEnabled,
      bizumEnabled: doc.bizumEnabled ?? DEFAULT_SETTINGS.bizumEnabled,
      paypalEnabled: doc.paypalEnabled ?? DEFAULT_SETTINGS.paypalEnabled,
      applePayEnabled: doc.applePayEnabled ?? DEFAULT_SETTINGS.applePayEnabled,
      googlePayEnabled: doc.googlePayEnabled ?? DEFAULT_SETTINGS.googlePayEnabled,
      transferEnabled: doc.transferEnabled ?? DEFAULT_SETTINGS.transferEnabled,
      transferInstructions: {
        iban: doc.transferInstructions?.iban ?? null,
        beneficiary: doc.transferInstructions?.beneficiary ?? null,
        conceptTemplate:
          doc.transferInstructions?.conceptTemplate ??
          DEFAULT_SETTINGS.transferInstructions.conceptTemplate,
      },
    }
    cached = { at: Date.now(), value }
    return value
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function listEnabledPaymentMethods(settings: PaymentSettings): PaymentMethodCode[] {
  const methods: PaymentMethodCode[] = []
  if (settings.cardEnabled) methods.push('card')
  if (settings.bizumEnabled) methods.push('bizum')
  if (settings.paypalEnabled) methods.push('paypal')
  if (settings.applePayEnabled) methods.push('apple_pay')
  if (settings.googlePayEnabled) methods.push('google_pay')
  if (settings.transferEnabled) methods.push('transfer')
  return methods
}

export function isPaymentMethodEnabled(
  settings: PaymentSettings,
  code: string,
): code is PaymentMethodCode {
  return listEnabledPaymentMethods(settings).includes(code as PaymentMethodCode)
}

export function gatewayForMethod(code: string): 'redsys' | 'paypal' | 'transfer' | 'erp' {
  if (code === 'paypal') return 'paypal'
  if (code === 'transfer') return 'transfer'
  if (code === 'erp_default') return 'erp'
  return 'redsys'
}
