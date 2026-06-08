import { NextResponse } from 'next/server'

import { getCustomerContext } from '@/lib/auth/customer-context'
import { assertCustomerPurchasedSku } from '@/lib/reviews/assert-customer-purchased-sku'
import {
  createProductReview,
  fetchCustomerProductReview,
  listApprovedProductReviews,
  updateProductReview,
} from '@/lib/reviews/payload-product-reviews'
import { resolveProductForReviews } from '@/lib/reviews/resolve-product-for-reviews'
import { validateReviewInput } from '@/lib/reviews/validate-review-input'

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params
  const target = await resolveProductForReviews(slug)
  if (!target) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const url = new URL(request.url)
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '10', 10) || 10),
  )

  const result = await listApprovedProductReviews(target.productId, page, pageSize)
  if (!result) {
    return NextResponse.json({ error: 'Reviews unavailable' }, { status: 503 })
  }

  return NextResponse.json(result)
}

export async function POST(request: Request, context: RouteContext) {
  const ctx = await getCustomerContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const displayName = ctx.displayName?.trim()
  if (!displayName) {
    return NextResponse.json(
      { error: 'Completa tu nombre personal en el perfil antes de valorar' },
      { status: 422 },
    )
  }

  const { slug } = await context.params
  const target = await resolveProductForReviews(slug)
  if (!target) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const purchased = await assertCustomerPurchasedSku(ctx.customerId, target.sku)
  if (!purchased) {
    return NextResponse.json(
      { error: 'Solo los clientes que han comprado este producto pueden valorarlo' },
      { status: 403 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validated = validateReviewInput(body as { rating: unknown; comment: unknown })
  if (!validated) {
    return NextResponse.json({ error: 'Invalid review input' }, { status: 422 })
  }

  const existing = await fetchCustomerProductReview(target.productId, ctx.userId)
  if (existing) {
    return NextResponse.json({ error: 'Review already exists' }, { status: 409 })
  }

  try {
    const doc = await createProductReview({
      productId: target.productId,
      skuErp: target.sku,
      customerId: ctx.customerId,
      webProfileId: ctx.userId,
      authorDisplayName: displayName,
      rating: validated.rating,
      comment: validated.comment,
    })
    return NextResponse.json({ doc }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === 'DUPLICATE_REVIEW') {
      return NextResponse.json({ error: 'Review already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Could not create review' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const ctx = await getCustomerContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const displayName = ctx.displayName?.trim()
  if (!displayName) {
    return NextResponse.json(
      { error: 'Completa tu nombre personal en el perfil antes de valorar' },
      { status: 422 },
    )
  }

  const { slug } = await context.params
  const target = await resolveProductForReviews(slug)
  if (!target) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const purchased = await assertCustomerPurchasedSku(ctx.customerId, target.sku)
  if (!purchased) {
    return NextResponse.json(
      { error: 'Solo los clientes que han comprado este producto pueden valorarlo' },
      { status: 403 },
    )
  }

  const existing = await fetchCustomerProductReview(target.productId, ctx.userId)
  if (!existing) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validated = validateReviewInput(body as { rating: unknown; comment: unknown })
  if (!validated) {
    return NextResponse.json({ error: 'Invalid review input' }, { status: 422 })
  }

  try {
    const doc = await updateProductReview({
      id: existing.id,
      webProfileId: ctx.userId,
      authorDisplayName: displayName,
      rating: validated.rating,
      comment: validated.comment,
    })
    return NextResponse.json({ doc })
  } catch {
    return NextResponse.json({ error: 'Could not update review' }, { status: 500 })
  }
}
