import type { CollectionAfterChangeHook } from 'payload'

const COMMITTED_STATUSES = new Set([
  'pending_payment',
  'pending_confirmation',
  'confirmed',
])

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

  const orderNumber = String(doc.orderNumber ?? doc.id)

  try {
    const found = await req.payload.find({
      collection: 'coupons',
      where: { code: { equals: couponCode } },
      limit: 1,
      depth: 0,
    })
    const coupon = found.docs[0]
    if (!coupon) return doc

    await req.payload.update({
      collection: 'coupons',
      id: coupon.id,
      data: { usesCount: (coupon.usesCount ?? 0) + 1 },
      depth: 0,
    })

    await req.payload.update({
      collection: 'orders',
      id: doc.id,
      data: { couponUsageRecorded: true },
      depth: 0,
      context: { skipCouponUsageHook: true },
    })

    req.payload.logger.info(
      `Coupon ${couponCode} usage recorded for order ${orderNumber}`,
    )
  } catch (err) {
    req.payload.logger.error({
      msg: 'Failed to increment coupon usage',
      couponCode,
      orderNumber,
      err,
    })
  }

  return doc
}
