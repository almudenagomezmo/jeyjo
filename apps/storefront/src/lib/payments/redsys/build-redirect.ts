import { getRedsysConfig, normalizeRedsysOrderRef } from '@/lib/payments/redsys/config'
import {
  encodeMerchantParameters,
  signMerchantParameters,
} from '@/lib/payments/redsys/sign'

export type RedsysPayMethod = 'card' | 'bizum'

export type RedsysRedirectForm = {
  tpvUrl: string
  signatureVersion: string
  merchantParameters: string
  signature: string
  orderRef: string
}

export type BuildRedirectInput = {
  orderNumber: string
  amountCents: number
  method: RedsysPayMethod
  description?: string
}

export function buildRedsysRedirectForm(input: BuildRedirectInput): RedsysRedirectForm | null {
  const cfg = getRedsysConfig()
  if (!cfg.isConfigured || !cfg.merchantCode || !cfg.secretKey || !cfg.storefrontUrl) {
    return null
  }

  const orderRef = normalizeRedsysOrderRef(input.orderNumber)
  const payMethods = input.method === 'bizum' ? 'z' : 'T'

  const params: Record<string, string> = {
    DS_MERCHANT_AMOUNT: String(input.amountCents),
    DS_MERCHANT_ORDER: orderRef,
    DS_MERCHANT_MERCHANTCODE: cfg.merchantCode,
    DS_MERCHANT_CURRENCY: '978',
    DS_MERCHANT_TRANSACTIONTYPE: '0',
    DS_MERCHANT_TERMINAL: cfg.terminal,
    DS_MERCHANT_MERCHANTURL: `${cfg.storefrontUrl}/api/payments/redsys/notify`,
    DS_MERCHANT_URLOK: `${cfg.storefrontUrl}/api/payments/redsys/return-ok`,
    DS_MERCHANT_URLKO: `${cfg.storefrontUrl}/api/payments/redsys/return-ko`,
    DS_MERCHANT_PRODUCTDESCRIPTION: input.description?.slice(0, 125) ?? `Pedido ${input.orderNumber}`,
    DS_MERCHANT_PAYMETHODS: payMethods,
  }

  const merchantParameters = encodeMerchantParameters(params)
  const signature = signMerchantParameters(merchantParameters, orderRef, cfg.secretKey)

  return {
    tpvUrl: cfg.tpvUrl,
    signatureVersion: 'HMAC_SHA256_V1',
    merchantParameters,
    signature,
    orderRef,
  }
}
