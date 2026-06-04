import { NextResponse } from 'next/server'

import { fetchCartProductsByIds } from '@/lib/catalog/fetch-cart-products'

export async function POST(request: Request) {
  if (process.env.CART_USE_CMS === 'false') {
    return NextResponse.json({ products: [] })
  }

  let body: { slugs?: string[] }
  try {
    body = (await request.json()) as { slugs?: string[] }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const slugs = Array.isArray(body.slugs)
    ? body.slugs.map((s) => String(s).trim()).filter(Boolean)
    : []

  if (slugs.length === 0) {
    return NextResponse.json({ error: 'slugs array is required' }, { status: 400 })
  }
  if (slugs.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 slugs per request' }, { status: 400 })
  }

  const products = await fetchCartProductsByIds(slugs)

  return NextResponse.json(
    { products },
    {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    },
  )
}
