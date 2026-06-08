import type { PriceQuote } from '@jeyjo/pricing'

import { getCustomerContext } from '@/lib/auth/customer-context'
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
import { assertCustomerPurchasedSku } from '@/lib/reviews/assert-customer-purchased-sku'
import {
  fetchCustomerProductReview,
  listApprovedProductReviews,
} from '@/lib/reviews/payload-product-reviews'
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

  const rawId = fetched.doc.id
  const productId =
    typeof rawId === 'number'
      ? rawId
      : rawId != null
        ? Number.parseInt(String(rawId), 10)
        : null

  const ctx = await getCustomerContext()
  const [approvedReviews, customerReview, canReview] = await Promise.all([
    productId != null && Number.isFinite(productId)
      ? listApprovedProductReviews(productId, 1, 10)
      : Promise.resolve(null),
    productId != null && Number.isFinite(productId) && ctx
      ? fetchCustomerProductReview(productId, ctx.userId)
      : Promise.resolve(null),
    ctx
      ? assertCustomerPurchasedSku(ctx.customerId, product.sku)
      : Promise.resolve(false),
  ])

  return {
    product,
    quote,
    stock,
    relatedRows,
    quotesBySku,
    stockBySku,
    redirectToSlug,
    productId: productId != null && Number.isFinite(productId) ? productId : null,
    approvedReviews,
    customerReview,
    canReview,
  }
}
