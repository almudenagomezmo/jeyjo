import { decodeMerchantParameters } from '@/lib/payments/redsys/sign'

export type ParsedRedsysNotification = {
  order: string
  amountCents: number
  responseCode: string
  authCode: string | null
  transactionId: string | null
  authorized: boolean
  responseDescription: string
  raw: Record<string, string>
}

const AUTHORIZED_RESPONSE_MAX = 99

/** Map Redsys Ds_Response: 0000–0099 typically authorized. */
export function isRedsysResponseAuthorized(responseCode: string): boolean {
  const code = parseInt(responseCode, 10)
  if (Number.isNaN(code)) return false
  return code >= 0 && code <= AUTHORIZED_RESPONSE_MAX
}

export function responseCodeDescription(code: string): string {
  const n = parseInt(code, 10)
  if (n >= 0 && n <= AUTHORIZED_RESPONSE_MAX) return 'Pago autorizado'
  if (code === '101') return 'Tarjeta caducada'
  if (code === '116') return 'Fondos insuficientes'
  if (code === '180') return 'Tarjeta no válida'
  if (code === '190') return 'Denegación sin especificar'
  return `Código de respuesta Redsys: ${code}`
}

export function parseRedsysNotification(
  merchantParametersBase64: string,
): ParsedRedsysNotification {
  const raw = decodeMerchantParameters<Record<string, string>>(merchantParametersBase64)
  const responseCode = raw.Ds_Response ?? raw.DS_RESPONSE ?? ''
  const order = raw.Ds_Order ?? raw.DS_ORDER ?? ''
  const amountRaw = raw.Ds_Amount ?? raw.DS_AMOUNT ?? '0'
  const amountCents = parseInt(amountRaw, 10) || 0

  return {
    order,
    amountCents,
    responseCode,
    authCode: raw.Ds_AuthorisationCode ?? raw.DS_AUTHORISATIONCODE ?? null,
    transactionId: raw.Ds_MerchantData ?? raw.Ds_AuthorisationCode ?? null,
    authorized: isRedsysResponseAuthorized(responseCode),
    responseDescription: responseCodeDescription(responseCode),
    raw,
  }
}
