import type { Payload } from 'payload'

export async function seedMarketingCoupons(payload: Payload): Promise<void> {
  const existing = await payload.find({
    collection: 'coupons',
    where: { code: { equals: 'BLOG5' } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length > 0) return

  const validFrom = new Date()
  const validUntil = new Date()
  validUntil.setFullYear(validUntil.getFullYear() + 2)

  await payload.create({
    collection: 'coupons',
    data: {
      code: 'BLOG5',
      discountType: 'percent',
      discountValue: 5,
      minimumOrderAmount: 0,
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      maxUses: null,
      usesCount: 0,
      active: true,
      source: 'manual',
    },
    depth: 0,
  })

  await payload.create({
    collection: 'coupons',
    data: {
      code: 'MAYO10',
      discountType: 'percent',
      discountValue: 10,
      minimumOrderAmount: 0,
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      maxUses: null,
      usesCount: 0,
      active: true,
      source: 'manual',
    },
    depth: 0,
  })

  payload.logger.info('— Seeded marketing coupons BLOG5 and MAYO10')
}
