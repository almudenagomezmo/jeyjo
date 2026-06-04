import { createCipheriv, createHmac } from 'node:crypto'

const BLOCK_SIZE = 8

function zeroPadToBlock(value: string): Buffer {
  const buf = Buffer.from(value, 'utf8')
  const padLen = (BLOCK_SIZE - (buf.length % BLOCK_SIZE)) % BLOCK_SIZE
  if (padLen === 0) return buf
  return Buffer.concat([buf, Buffer.alloc(padLen, 0)])
}

/** Derive per-order 3DES key from Base64 merchant secret and order reference. */
export function deriveRedsysKey(order: string, secretKeyBase64: string): Buffer {
  const key = Buffer.from(secretKeyBase64, 'base64')
  const iv = Buffer.alloc(BLOCK_SIZE, 0)
  const cipher = createCipheriv('des-ede3-cbc', key, iv)
  cipher.setAutoPadding(false)
  const padded = zeroPadToBlock(order)
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()])
  return encrypted.subarray(0, padded.length)
}

/** Sign outbound redirect: HMAC-SHA256 of Base64 merchant parameters JSON. */
export function signMerchantParameters(
  merchantParametersBase64: string,
  order: string,
  secretKeyBase64: string,
): string {
  const derived = deriveRedsysKey(order, secretKeyBase64)
  return createHmac('sha256', derived)
    .update(merchantParametersBase64)
    .digest('base64')
}

export type RedsysNotificationFields = {
  Ds_Amount?: string
  Ds_Order?: string
  Ds_MerchantCode?: string
  Ds_Currency?: string
  Ds_Response?: string
  Ds_TransactionType?: string
  Ds_SecurePayment?: string
}

/** Build notification signature string per Redsys HMAC SHA256 guide. */
export function buildNotificationSignatureString(fields: RedsysNotificationFields): string {
  return [
    fields.Ds_Amount ?? '',
    fields.Ds_Order ?? '',
    fields.Ds_MerchantCode ?? '',
    fields.Ds_Currency ?? '',
    fields.Ds_Response ?? '',
    fields.Ds_TransactionType ?? '',
    fields.Ds_SecurePayment ?? '',
  ].join('')
}

/** Sign inbound notification fields (Redsys server → merchant). */
export function signNotificationFields(
  fields: RedsysNotificationFields,
  secretKeyBase64: string,
): string | null {
  const order = fields.Ds_Order
  if (!order) return null
  const derived = deriveRedsysKey(order, secretKeyBase64)
  return createHmac('sha256', derived)
    .update(buildNotificationSignatureString(fields))
    .digest('base64')
}

/** Verify inbound notification signature. */
export function verifyNotificationSignature(
  fields: RedsysNotificationFields,
  signature: string,
  secretKeyBase64: string,
): boolean {
  const expected = signNotificationFields(fields, secretKeyBase64)
  if (!expected) return false
  return normalizeBase64(signature) === normalizeBase64(expected)
}

function normalizeBase64(value: string): string {
  return value.replace(/-/g, '+').replace(/_/g, '/').trim()
}

export function encodeMerchantParameters(params: Record<string, string>): string {
  return Buffer.from(JSON.stringify(params), 'utf8').toString('base64')
}

export function decodeMerchantParameters<T extends Record<string, string>>(
  merchantParametersBase64: string,
): T {
  const json = Buffer.from(merchantParametersBase64, 'base64').toString('utf8')
  return JSON.parse(json) as T
}
