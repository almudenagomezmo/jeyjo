import type { PriceQuote } from '@jeyjo/pricing'
import { resolvePrice } from '@jeyjo/pricing'

import {
  fetchPublicProductPdpBySlug,
  mapPdpDocToView,
  mapRelatedDocsToRows,
} from '@/lib/catalog/fetch-product-pdp'
import { isPdpDemoFallback, loadDemoPdpView } from '@/lib/pdp/demo-fallback'
import type { PdpPagePayload } from '@/lib/pdp/types'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import { getProductPriceBase } from '@/lib/pricing/product-catalog'
import { getStorefrontPricingRepository } from '@/lib/pricing/repository'
import { getStockIndicator } from '@/lib/stock/get-stock-indicator'
import { stockIndicatorsFromRows } from '@/lib/stock/get-stock-indicators-batch'
import type { PublicStockIndicator } from '@/lib/stock/types'

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

  if (isPdpDemoFallback()) {
    const demo = loadDemoPdpView(key)
    if (!demo) return null
    const quote = await resolvePrimaryQuote(demo.product.sku)
    if (!quote) return null
    const stock: PublicStockIndicator = {
      level: demo.product.packUnit > 0 ? 'available' : 'limited',
      label: 'Disponible',
      isStale: false,
      allowOrderWithoutStock: false,
    }
    const relatedSkus = demo.relatedRows.map((r) => r.sku)
    const quotesBySku = await resolvePriceQuotesBatch(relatedSkus)
    const stockBySku = stockIndicatorsFromRows(demo.relatedRows)
    return {
      product: demo.product,
      quote,
      stock,
      relatedRows: demo.relatedRows,
      quotesBySku,
      stockBySku,
      redirectToSlug: demo.redirectToSlug,
    }
  }

  const fetched = await fetchPublicProductPdpBySlug(key)
  if (!fetched) return null

  const product = mapPdpDocToView(fetched.doc)
  if (!product) return null

  const relatedRows = mapRelatedDocsToRows(fetched.doc.relatedProducts)
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
