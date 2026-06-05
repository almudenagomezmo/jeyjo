import { NextResponse } from 'next/server'

import {
  collectDescendantSlugs,
  getNavigationTree,
} from '@/lib/catalog/fetch-navigation-tree'
import { listPublicProducts } from '@/lib/catalog/fetch-product-list'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const tree = await getNavigationTree()
  const node = tree.find((n) => n.slug === slug)
  if (!node) {
    return NextResponse.json({ subcounts: {}, featured: [] })
  }

  const scopeSlugs = collectDescendantSlugs(node)
  const rows = await listPublicProducts({ categorySlugs: scopeSlugs })

  const subcounts: Record<string, number> = {}
  for (const sub of node.children) {
    const subScope = collectDescendantSlugs(sub)
    subcounts[sub.slug] = rows.filter((row) =>
      row.categorySlugs.some((s) => subScope.includes(s)),
    ).length
  }

  const featuredRows = rows.slice(0, 4)
  const quotes = await resolvePriceQuotesBatch(featuredRows.map((r) => r.sku))
  const featured = featuredRows.map((row) => ({
    slug: row.slug,
    title: row.title,
    sku: row.sku,
    imageUrl: row.imageUrl,
    priceWithVat: quotes[row.sku]?.grossUnit ?? 0,
    brand: row.brand,
    glyph: 'box' as const,
    colors: ['#94a3b8', '#64748b'] as [string, string],
    eco: row.ecoLabel,
  }))

  return NextResponse.json({ subcounts, featured })
}
