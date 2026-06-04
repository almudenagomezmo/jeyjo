import { buildRedsysRedirectForm } from '@/lib/payments/redsys/build-redirect'
import {
  fetchPaymentSettings,
  gatewayForMethod,
  isPaymentMethodEnabled,
  type PaymentMethodCode,
} from '@/lib/payments/settings'

export type PaymentNextStep =
  | {
      type: 'redirect'
      provider: 'redsys' | 'paypal'
      url?: string
      form?: {
        action: string
        fields: Record<string, string>
      }
    }
  | { type: 'instructions'; path: string }
  | { type: 'wallet'; method: 'apple_pay' | 'google_pay' }

export class PaymentMethodDisabledError extends Error {
  constructor(code: string) {
    super(`Payment method disabled: ${code}`)
    this.name = 'PaymentMethodDisabledError'
  }
}

export async function resolvePaymentNextStep(input: {
  orderNumber: string
  orderId: number
  paymentMethodCode: string
  amountEuros: number
}): Promise<PaymentNextStep | null> {
  const settings = await fetchPaymentSettings()
  const code = input.paymentMethodCode

  if (!isPaymentMethodEnabled(settings, code)) {
    throw new PaymentMethodDisabledError(code)
  }

  const amountCents = Math.round(input.amountEuros * 100)

  if (code === 'card' || code === 'bizum') {
    const form = buildRedsysRedirectForm({
      orderNumber: input.orderNumber,
      amountCents,
      method: code,
    })
    if (!form) return null
    return {
      type: 'redirect',
      provider: 'redsys',
      form: {
        action: form.tpvUrl,
        fields: {
          Ds_SignatureVersion: form.signatureVersion,
          Ds_MerchantParameters: form.merchantParameters,
          Ds_Signature: form.signature,
        },
      },
    }
  }

  if (code === 'paypal') {
    return {
      type: 'redirect',
      provider: 'paypal',
      url: `/api/payments/paypal/create?orderId=${input.orderId}`,
    }
  }

  if (code === 'transfer') {
    return {
      type: 'instructions',
      path: `/checkout/transferencia?order=${encodeURIComponent(input.orderNumber)}`,
    }
  }

  if (code === 'apple_pay' || code === 'google_pay') {
    return { type: 'wallet', method: code }
  }

  return null
}

export function initialGatewayForMethod(code: string): ReturnType<typeof gatewayForMethod> {
  return gatewayForMethod(code)
}

export function isRedsysMethod(code: string): code is PaymentMethodCode {
  return code === 'card' || code === 'bizum' || code === 'apple_pay' || code === 'google_pay'
}
