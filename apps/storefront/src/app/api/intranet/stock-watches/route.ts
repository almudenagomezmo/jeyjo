import { NextResponse } from 'next/server'

import { fetchPublicProductsBySkus } from '@/lib/catalog/fetch-public-products-by-skus'
import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { getStockIndicator } from '@/lib/stock/get-stock-indicator'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const guard = await requireB2bApiSession()
  if ('error' in guard) return guard.error

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const { data, error } = await admin
    .from('stock_watches')
    .select('id, sku, product_title, last_indicator, last_notified_at, created_at')
    .eq('web_profile_id', guard.ctx.userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
          : { level: 'limited' as const, label: 'Disponibilidad limitada según fabricante', isStale: true },
        lastNotifiedAt: row.last_notified_at,
        createdAt: row.created_at,
        href: `/p/${slug}`,
      }
    }),
  )

  return NextResponse.json({ items })
}
