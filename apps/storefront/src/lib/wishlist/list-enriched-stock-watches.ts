import { fetchPublicProductsBySkus } from '@/lib/catalog/fetch-public-products-by-skus'
import { getStockIndicator } from '@/lib/stock/get-stock-indicator'
import type { PublicStockIndicator } from '@/lib/stock/types'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export type StockWatchListItem = {
  id: string
  sku: string
  productTitle: string
  stockIndicator: PublicStockIndicator
  lastNotifiedAt: string | null
  createdAt: string
  href: string
}

export async function listEnrichedStockWatches(
  webProfileId: string,
): Promise<{ items: StockWatchListItem[] } | { error: string }> {
  const admin = getSupabaseAdminClient()
  if (!admin) {
    return { error: 'Database unavailable' }
  }

  const { data, error } = await admin
    .from('stock_watches')
    .select('id, sku, product_title, last_indicator, last_notified_at, created_at')
    .eq('web_profile_id', webProfileId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  const rows = data ?? []
  const skus = rows.map((r) => r.sku)
  const products = await fetchPublicProductsBySkus(skus)
  const slugBySku = new Map(
    products.map((p) => [p.skuErp?.trim() ?? '', p.slug?.trim() || p.skuErp?.trim() || '']),
  )

  const items = await Promise.all(
    rows.map(async (row) => {
      const indicator = await getStockIndicator(row.sku)
      const slug = slugBySku.get(row.sku) || row.sku
      return {
        id: row.id,
        sku: row.sku,
        productTitle: row.product_title ?? row.sku,
        stockIndicator: indicator
          ? { level: indicator.level, label: indicator.label, isStale: indicator.isStale }
          : {
              level: 'limited' as const,
              label: 'Disponibilidad limitada según fabricante',
              isStale: true,
            },
        lastNotifiedAt: row.last_notified_at,
        createdAt: row.created_at,
        href: `/p/${slug}`,
      }
    }),
  )

  return { items }
}
