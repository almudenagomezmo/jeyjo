import type { Payload } from 'payload'

export async function deactivateExpiredCoupons(payload: Payload): Promise<{ updated: number }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expired = await payload.find({
    collection: 'coupons',
    where: {
      and: [
        { active: { equals: true } },
        { validUntil: { less_than: today.toISOString() } },
      ],
    },
    limit: 500,
    depth: 0,
  })

  let updated = 0
  for (const doc of expired.docs) {
    await payload.update({
      collection: 'coupons',
      id: doc.id,
      data: { active: false },
      depth: 0,
    })
    updated += 1
  }

  return { updated }
}
