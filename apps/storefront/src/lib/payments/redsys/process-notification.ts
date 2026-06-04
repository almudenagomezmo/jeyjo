import { getRedsysConfig } from '@/lib/payments/redsys/config'
import { parseRedsysNotification } from '@/lib/payments/redsys/parse-notification'
import {
  decodeMerchantParameters,
  verifyNotificationSignature,
  type RedsysNotificationFields,
} from '@/lib/payments/redsys/sign'
import { insertPaymentNotification } from '@/lib/payments/notifications'
import {
  findPayloadOrderByNumber,
  updateOrderPaymentStatus,
} from '@/lib/payments/payload-orders'

export async function processRedsysNotification(input: {
  merchantParameters: string
  signature: string
}): Promise<{ ok: boolean; duplicate?: boolean; orderNumber?: string }> {
  const cfg = getRedsysConfig()
  if (!cfg.secretKey) return { ok: false }

  const fields = decodeMerchantParameters<RedsysNotificationFields>(input.merchantParameters)
  if (!verifyNotificationSignature(fields, input.signature, cfg.secretKey)) {
    return { ok: false }
  }

  const parsed = parseRedsysNotification(input.merchantParameters)
  const order = await findPayloadOrderByNumber(parsed.order)
  if (!order?.id) return { ok: false }

  const insertResult = await insertPaymentNotification({
    orderReference: parsed.order,
    signature: input.signature,
    responseCode: parsed.responseCode,
    rawParameters: parsed.raw,
  })

  if (insertResult === 'duplicate') {
    return { ok: true, duplicate: true, orderNumber: order.orderNumber }
  }

  if (parsed.authorized) {
    await updateOrderPaymentStatus({
      orderId: order.id,
      jeyjoStatus: 'confirmed',
      paymentStatus: 'authorized',
      gateway: 'redsys',
      gatewayAuthCode: parsed.authCode,
      gatewayTransactionId: parsed.transactionId,
      paidAmount: parsed.amountCents / 100,
      paidAt: new Date().toISOString(),
      paymentFailureReason: null,
    })
  } else {
    await updateOrderPaymentStatus({
      orderId: order.id,
      paymentStatus: 'failed',
      paymentFailureReason: parsed.responseDescription,
    })
  }

  return { ok: true, orderNumber: order.orderNumber }
}
