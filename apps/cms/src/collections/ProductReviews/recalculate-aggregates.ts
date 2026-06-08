import type { Payload } from 'payload'

export async function recalculateProductReviewAggregates(
  payload: Payload,
  productId: number | string,
): Promise<void> {
  const id = typeof productId === 'string' ? Number.parseInt(productId, 10) : productId
  if (!Number.isFinite(id)) return

  const found = await payload.find({
    collection: 'product-reviews',
    where: {
      and: [{ product: { equals: id } }, { status: { equals: 'approved' } }],
    },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })

  const reviewCount = found.totalDocs
  let ratingAverage: number | null = null
  if (reviewCount > 0) {
    const sum = found.docs.reduce((acc, doc) => acc + (Number(doc.rating) || 0), 0)
    ratingAverage = Math.round((sum / reviewCount) * 10) / 10
  }

  await payload.update({
    collection: 'products',
    id,
    data: { reviewCount, ratingAverage },
    overrideAccess: true,
  })
}
