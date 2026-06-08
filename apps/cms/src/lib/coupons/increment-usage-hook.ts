import type { CollectionAfterChangeHook, Payload } from 'payload'

const COMMITTED_STATUSES = new Set([
  'pending_payment',
  'pending_confirmation',
  'confirmed',
])

type CouponUsageJob = {
  orderId: number | string
  orderNumber: string
  couponCode: string
}

async function recordCouponUsage(payload: Payload, job: CouponUsageJob): Promise<void> {
  const { orderId, orderNumber, couponCode } = job

  const found = await payload.find({
    collection: 'coupons',
    where: { code: { equals: couponCode } },
    limit: 1,
    depth: 0,
  })
  const coupon = found.docs[0]
  if (!coupon) return

  await payload.update({
    collection: 'coupons',
    id: coupon.id,
    data: { usesCount: (coupon.usesCount ?? 0) + 1 },
    depth: 0,
  })

  await payload.update({
    collection: 'orders',
    id: orderId,
    data: { couponUsageRecorded: true },
    depth: 0,
    context: { skipCouponUsageHook: true },
  })

  payload.logger.info(`Coupon ${couponCode} usage recorded for order ${orderNumber}`)
}

export const incrementCouponUsage: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if (context?.skipCouponUsageHook) return doc

  const couponCode =
    typeof doc.couponCode === 'string' ? doc.couponCode.trim().toUpperCase() : ''
  if (!couponCode) return doc

  const status = String(doc.jeyjoStatus ?? '')
  if (!COMMITTED_STATUSES.has(status)) return doc

  if (doc.couponUsageRecorded === true) return doc

  const prevStatus =
    previousDoc?.jeyjoStatus != null ? String(previousDoc.jeyjoStatus) : null
  if (
    operation === 'update' &&
    prevStatus &&
    COMMITTED_STATUSES.has(prevStatus)
  ) {
    return doc
  }

  if (!doc.id) return doc

  const orderNumber = String(doc.orderNumber ?? doc.id)
  const payload = req.payload
  const job: CouponUsageJob = {
    orderId: doc.id,
    orderNumber,
    couponCode,
  }

  // Defer DB work so order create/update can release its pool connection first.
  // Nested payload calls here were exhausting the small Supabase session pooler.
  queueMicrotask(() => {
    void recordCouponUsage(payload, job).catch((err) => {
      payload.logger.error({
        msg: 'Failed to increment coupon usage',
        couponCode,
        orderNumber,
        err,
      })
    })
  })

  return doc
}
