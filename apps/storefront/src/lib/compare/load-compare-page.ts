import { fetchPublicProductsBySkus } from '@/lib/catalog/fetch-public-products-by-skus'
import { mapDocToCompareColumn } from '@/lib/compare/map-compare-column'
import type { ComparePageResult } from '@/lib/compare/types'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import { getSessionPricingCustomerId } from '@/lib/pricing/session-customer-id'

export async function loadComparePage(requestedSkus: string[]): Promise<ComparePageResult> {
  const normalized = requestedSkus.map((s) => s.trim()).filter(Boolean).slice(0, 3)
  if (normalized.length === 0) {
    return { columns: [], requestedSkus: [], validSkus: [], invalidSkus: [] }
  }

  const docs = await fetchPublicProductsBySkus(normalized)
  const docBySku = new Map(docs.map((d) => [d.skuErp?.trim() ?? '', d]))
  const validSkus = normalized.filter((sku) => docBySku.has(sku))
  const invalidSkus = normalized.filter((sku) => !docBySku.has(sku))

  const pricingCustomerId = await getSessionPricingCustomerId()
  const quotesBySku = await resolvePriceQuotesBatch(validSkus, pricingCustomerId)

  const columns = validSkus
    .map((sku) => {
      const doc = docBySku.get(sku)
      if (!doc) return null
      return mapDocToCompareColumn(doc, quotesBySku[sku])
    })
    .filter((col): col is NonNullable<typeof col> => col != null)

  return {
    columns,
    requestedSkus: normalized,
    validSkus,
    invalidSkus,
  }
}
