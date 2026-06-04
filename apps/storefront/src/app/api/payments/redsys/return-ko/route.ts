import { NextResponse } from 'next/server'

import { parseRedsysNotification } from '@/lib/payments/redsys/parse-notification'
import { getRedsysConfig } from '@/lib/payments/redsys/config'
import {
  decodeMerchantParameters,
  verifyNotificationSignature,
  type RedsysNotificationFields,
} from '@/lib/payments/redsys/sign'
import { findPayloadOrderByNumber, updateOrderPaymentStatus } from '@/lib/payments/payload-orders'

const storefrontUrl = () => process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, '') ?? ''

export async function POST(request: Request) {
  const form = await request.formData()
  const merchantParameters = form.get('Ds_MerchantParameters')?.toString()
  const signature = form.get('Ds_Signature')?.toString()
  const base = storefrontUrl()

  if (!merchantParameters || !signature || !base) {
    return NextResponse.redirect(`${base}/checkout/retorno/ko?error=invalid`)
  }

  const cfg = getRedsysConfig()
  const fields = decodeMerchantParameters<RedsysNotificationFields>(merchantParameters)
  const valid =
    cfg.secretKey && verifyNotificationSignature(fields, signature, cfg.secretKey)

  const parsed = parseRedsysNotification(merchantParameters)
  const order = await findPayloadOrderByNumber(parsed.order)

  if (order?.id && valid && !parsed.authorized) {
    await updateOrderPaymentStatus({
      orderId: order.id,
      paymentStatus: 'failed',
      paymentFailureReason: parsed.responseDescription,
    })
  }

  const q = new URLSearchParams({
    order: parsed.order,
    code: parsed.responseCode,
    ...(valid ? {} : { error: 'signature' }),
  })

  return NextResponse.redirect(`${base}/checkout/retorno/ko?${q}`)
}
