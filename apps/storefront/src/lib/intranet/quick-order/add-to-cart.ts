import { fetchPublicProductsBySkus } from '@/lib/catalog/fetch-public-products-by-skus'
import { isPublicCatalogProduct } from '@/lib/catalog/public-product-filter'
import { isWildcardPurchaseSku } from '@/lib/intranet/purchase-history/wildcard'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'

export type QuickOrderCartItem = { sku?: string; qty?: number }

export type QuickOrderAddition = {
  productId: string
  sku: string
  qty: number
  quote: { netUnit: number; grossUnit: number; appliedRule: string; label?: string }
}

export async function buildQuickOrderAdditions(
  items: QuickOrderCartItem[],
  customerId: string,
): Promise<
  | { ok: true; additions: QuickOrderAddition[]; missing: string[] }
  | { ok: false; error: string; status: number }
> {
  const normalized = items
    .map((item) => ({
      sku: item.sku?.trim() ?? '',
      qty: Math.max(1, Math.floor(Number(item.qty ?? 1))),
    }))
    .filter((item) => item.sku)

  if (normalized.length === 0) {
    return { ok: false, error: 'No items', status: 400 }
  }

  for (const item of normalized) {
    if (isWildcardPurchaseSku(item.sku)) {
      return { ok: false, error: `SKU not allowed: ${item.sku}`, status: 400 }
    }
  }

  const skus = normalized.map((i) => i.sku)
  const products = await fetchPublicProductsBySkus(skus)
  const bySku = new Map(
    products.filter(isPublicCatalogProduct).map((p) => [p.skuErp?.trim() ?? '', p]),
  )

  const quotes = await resolvePriceQuotesBatch(skus, customerId)
  const additions: QuickOrderAddition[] = []
  const missing: string[] = []

  for (const item of normalized) {
    const product = bySku.get(item.sku)
    const slug = product?.slug?.trim()
    const quote = quotes[item.sku]
    if (!slug || !quote) {
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
    return { ok: false, error: 'No valid catalog items', status: 400 }
  }

  return { ok: true, additions, missing }
}
