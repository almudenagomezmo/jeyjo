import { subDays } from 'date-fns'
import type { Payload } from 'payload'

import { parseOrderLineSnapshots } from '@/lib/orders/parse-line-snapshots'

export type TopSalesSku = {
  skuErp: string
  unitsSold: number
  productId?: string | number
  productTitle?: string
  availableStock: number
}

export function getTopSalesWindowDays(): number {
  const raw = Number(process.env.TOP_SALES_WINDOW_DAYS ?? 30)
  return Number.isFinite(raw) && raw > 0 ? raw : 30
}

export function getLowStockThreshold(): number {
  const raw = Number(process.env.DASHBOARD_LOW_STOCK_THRESHOLD ?? 5)
  return Number.isFinite(raw) && raw >= 0 ? raw : 5
}

export async function aggregateTopSalesSkus(
  payload: Payload,
  now = new Date(),
  topN = 10,
): Promise<TopSalesSku[]> {
  const windowDays = getTopSalesWindowDays()
  const fromIso = subDays(now, windowDays).toISOString()

  const found = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { createdAt: { greater_than_equal: fromIso } },
        { jeyjoStatus: { not_equals: 'cancelled' } },
        { paymentStatus: { not_equals: 'failed' } },
      ],
    },
    limit: 2000,
    depth: 0,
    overrideAccess: true,
  })

  const unitsBySku = new Map<string, number>()
  for (const order of found.docs) {
    for (const line of parseOrderLineSnapshots(order.orderLineSnapshots)) {
      unitsBySku.set(line.skuErp, (unitsBySku.get(line.skuErp) ?? 0) + line.qty)
    }
  }

  const ranked = [...unitsBySku.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)

  if (!ranked.length) return []

  const skus = ranked.map(([sku]) => sku)
  const products = await payload.find({
    collection: 'products',
    where: { skuErp: { in: skus } },
    limit: skus.length,
    depth: 0,
    overrideAccess: true,
  })

  const productBySku = new Map<string, (typeof products.docs)[number]>()
  for (const doc of products.docs) {
    const sku = doc.skuErp?.trim()
    if (sku) productBySku.set(sku, doc)
  }

  return ranked.map(([skuErp, unitsSold]) => {
    const product = productBySku.get(skuErp)
    const availableStock = typeof product?.erpStock === 'number' ? product.erpStock : 0
    return {
      skuErp,
      unitsSold,
      productId: product?.id,
      productTitle: product?.title ?? undefined,
      availableStock,
    }
  })
}
