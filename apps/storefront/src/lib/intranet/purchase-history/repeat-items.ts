import { NextResponse } from 'next/server'

import { fetchPublicProductsBySkus } from '@/lib/catalog/fetch-public-products-by-skus'
import { isPublicCatalogProduct } from '@/lib/catalog/public-product-filter'
import { isWildcardPurchaseSku } from '@/lib/intranet/purchase-history/wildcard'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'

type RepeatBody = {
  items?: Array<{ sku?: string; qty?: number }>
}

export async function repeatPurchaseHistoryItems(customerId: string, request: Request) {
  let body: RepeatBody
  try {
    body = (await request.json()) as RepeatBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const items = (body.items ?? [])
    .map((item) => ({
      sku: item.sku?.trim() ?? '',
      qty: Math.max(1, Math.floor(Number(item.qty ?? 1))),
    }))
    .filter((item) => item.sku)

  if (items.length === 0) {
    return NextResponse.json({ error: 'No items' }, { status: 400 })
  }

  for (const item of items) {
    if (isWildcardPurchaseSku(item.sku)) {
      return NextResponse.json({ error: `SKU not allowed: ${item.sku}` }, { status: 400 })
    }
  }

  const skus = items.map((i) => i.sku)
  const products = await fetchPublicProductsBySkus(skus)
  const bySku = new Map(
    products.filter(isPublicCatalogProduct).map((p) => [p.skuErp?.trim() ?? '', p]),
  )

  const additions: Array<{
    productId: string
    sku: string
    qty: number
    quote: { netUnit: number; grossUnit: number; appliedRule: string; label?: string }
  }> = []

  const missing: string[] = []
  const quotes = await resolvePriceQuotesBatch(skus, customerId)

  for (const item of items) {
    const product = bySku.get(item.sku)
    const slug = product?.slug?.trim()
    if (!slug) {
      missing.push(item.sku)
      continue
    }
    const quote = quotes[item.sku]
    if (!quote) {
      missing.push(item.sku)
      continue
    }
    additions.push({
      productId: slug,
      sku: item.sku,
      qty: item.qty,
      quote: {
        netUnit: quote.netUnit,
        grossUnit: quote.grossUnit,
        appliedRule: quote.appliedRule,
        label: quote.label,
      },
    })
  }

  if (additions.length === 0) {
    return NextResponse.json({ error: 'No valid catalog items', missing }, { status: 400 })
  }

  return NextResponse.json({ additions, missing })
}
