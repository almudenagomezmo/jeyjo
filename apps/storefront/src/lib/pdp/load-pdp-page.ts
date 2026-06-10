import type { PriceQuote } from '@jeyjo/pricing'

import { getCustomerContext } from '@/lib/auth/customer-context'
import {
  fetchPublicProductPdpBySlug,
  mapPdpDocToView,
  resolveRelatedProductRows,
} from '@/lib/catalog/fetch-product-pdp'
import type { PdpPagePayload } from '@/lib/pdp/types'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import { getSessionPricingCustomerId } from '@/lib/pricing/session-customer-id'
import { assertCustomerPurchasedSku } from '@/lib/reviews/assert-customer-purchased-sku'
import {
  fetchCustomerProductReview,
  listApprovedProductReviews,
} from '@/lib/reviews/payload-product-reviews'
import { getStockIndicator } from '@/lib/stock/get-stock-indicator'
import { stockIndicatorsFromRows } from '@/lib/stock/get-stock-indicators-batch'

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

  const pricingCustomerId = await getSessionPricingCustomerId()
  const allSkus = [product.sku, ...relatedSkus]

  const [quotesBySku, stock, ctx] = await Promise.all([
    resolvePriceQuotesBatch(allSkus, pricingCustomerId),
    getStockIndicator(product.sku),
    getCustomerContext(),
  ])

  const quote: PriceQuote | undefined = quotesBySku[product.sku]
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
