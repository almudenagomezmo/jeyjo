import { NextResponse } from 'next/server'

import { getCustomerContext } from '@/lib/auth/customer-context'
import { fetchCustomerProductReview } from '@/lib/reviews/payload-product-reviews'
import { resolveProductForReviews } from '@/lib/reviews/resolve-product-for-reviews'

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const ctx = await getCustomerContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await context.params
  const target = await resolveProductForReviews(slug)
  if (!target) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const doc = await fetchCustomerProductReview(target.productId, ctx.userId)
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ doc })
}
