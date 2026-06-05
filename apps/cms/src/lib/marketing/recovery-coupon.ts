import type { Payload } from 'payload'

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function createRecoveryCoupon(
  payload: Payload,
  args: { snapshotId: string; percent: number },
): Promise<string> {
  const code = `RECOVER-${randomSuffix()}`
  const validFrom = new Date()
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 7)

  await payload.create({
    collection: 'coupons',
    data: {
      code,
      discountType: 'percent',
      discountValue: args.percent,
      minimumOrderAmount: 0,
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      maxUses: 1,
      usesCount: 0,
      active: true,
      source: 'recovery',
      recoveryCartId: args.snapshotId,
    },
    depth: 0,
  })

  return code
}
