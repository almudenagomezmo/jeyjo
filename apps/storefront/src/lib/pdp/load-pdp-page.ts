import type { PriceQuote } from '@jeyjo/pricing'

import {
  fetchPublicProductPdpBySlug,
  mapPdpDocToView,
  resolveRelatedProductRows,
} from '@/lib/catalog/fetch-product-pdp'
import type { PdpPagePayload } from '@/lib/pdp/types'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import { getProductPriceBase } from '@/lib/pricing/product-catalog'
import { getStorefrontPricingRepository } from '@/lib/pricing/repository'
import { resolvePrice } from '@jeyjo/pricing'
import { getStockIndicator } from '@/lib/stock/get-stock-indicator'
import { stockIndicatorsFromRows } from '@/lib/stock/get-stock-indicators-batch'

async function resolvePrimaryQuote(sku: string): Promise<PriceQuote | null> {
  const productBase = await getProductPriceBase(sku)
  if (!productBase) return null
  try {
    const repo = getStorefrontPricingRepository()
    return await resolvePrice({ sku, customerId: null }, repo)
  } catch {
    return null
  }
}

export async function loadPdpPage(slugOrSku: string): Promise<PdpPagePayload | null> {
  const key = slugOrSku.trim()
  if (!key) return null

  const fetched = await fetchPublicProductPdpBySlug(key)
  if (!fetched) return null

  const product = mapPdpDocToView(fetched.doc)
  if (!product) return null

  const relatedRows = await resolveRelatedProductRows(fetched.doc.relatedProducts, {
    productId: fetched.doc.id,
  })
  const relatedSkus = relatedRows.map((r) => r.sku)

  const [quote, stock, quotesBySku] = await Promise.all([
    resolvePrimaryQuote(product.sku),
    getStockIndicator(product.sku),
    resolvePriceQuotesBatch([product.sku, ...relatedSkus]),
  ])

  if (!quote || !stock) return null

  const stockBySku = stockIndicatorsFromRows(relatedRows)

  const redirectToSlug =
    fetched.matchedBySku && product.slug && product.slug !== key ? product.slug : null

  return {
    product,
    quote,
    stock,
    relatedRows,
    quotesBySku,
    stockBySku,
    redirectToSlug,
  }
}
