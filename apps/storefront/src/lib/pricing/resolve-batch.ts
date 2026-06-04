import { resolvePrice, type PriceQuote } from '@jeyjo/pricing'

import { getProductPriceBase } from '@/lib/pricing/product-catalog'
import { getStorefrontPricingRepository } from '@/lib/pricing/repository'

const BATCH_CONCURRENCY = 8

export async function resolvePriceQuotesBatch(
  skus: string[],
  customerId?: string | null,
): Promise<Record<string, PriceQuote>> {
  const unique = [...new Set(skus.map((s) => s.trim()).filter(Boolean))]
  const out: Record<string, PriceQuote> = {}

  for (let i = 0; i < unique.length; i += BATCH_CONCURRENCY) {
    const chunk = unique.slice(i, i + BATCH_CONCURRENCY)
    await Promise.all(
      chunk.map(async (sku) => {
        const productBase = await getProductPriceBase(sku)
        if (!productBase) return

        try {
          const repo = getStorefrontPricingRepository()
          const quote = await resolvePrice({ sku, customerId: customerId ?? null }, repo)
          out[sku] = quote
        } catch {
          // omit SKU on resolution failure
        }
      }),
    )
  }

  return out
}
