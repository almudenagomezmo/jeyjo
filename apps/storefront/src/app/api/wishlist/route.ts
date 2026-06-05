import { NextResponse } from 'next/server'

import {
  listWishlistSkus,
  removeWishlistWatch,
  replaceWishlistSkus,
  requireWishlistSession,
  upsertWishlistWatch,
} from '@/lib/wishlist/sync'

export async function GET() {
  const session = await requireWishlistSession()
  if ('error' in session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const skus = await listWishlistSkus(session.ctx.userId)
  return NextResponse.json({ skus })
}

export async function POST(request: Request) {
  const session = await requireWishlistSession()
  if ('error' in session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { sku?: string; productTitle?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const sku = body.sku?.trim()
  if (!sku) {
    return NextResponse.json({ error: 'sku is required' }, { status: 400 })
  }

  const result = await upsertWishlistWatch({
    webProfileId: session.ctx.userId,
    sku,
    productTitle: body.productTitle,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? 'Failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sku })
}

export async function PUT(request: Request) {
  const session = await requireWishlistSession()
  if ('error' in session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { skus?: string[] }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const skus = Array.isArray(body.skus) ? body.skus : []
  const result = await replaceWishlistSkus(session.ctx.userId, skus)

  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? 'Failed' }, { status: 500 })
  }

  const merged = await listWishlistSkus(session.ctx.userId)
  return NextResponse.json({ skus: merged })
}

export async function DELETE(request: Request) {
  const session = await requireWishlistSession()
  if ('error' in session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sku = new URL(request.url).searchParams.get('sku')?.trim()
  if (!sku) {
    return NextResponse.json({ error: 'sku query param is required' }, { status: 400 })
  }

  const result = await removeWishlistWatch(session.ctx.userId, sku)
  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? 'Failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
