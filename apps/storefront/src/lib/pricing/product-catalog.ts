import type { ProductPriceBase } from '@jeyjo/pricing'

/** CA-PRECIOS + stub catalog bases until catalog-sync (#7). */
const CATALOG_BASES: ProductPriceBase[] = [
  { sku: 'REF-001', p1Price: 1, p2Price: 0.9, vatRate: 21 },
  { sku: 'REF-002', p1Price: 12, p2Price: 10, vatRate: 21 },
  { sku: 'REF-003', p1Price: 12, p2Price: 10, vatRate: 21 },
  { sku: 'REF-004', p1Price: 10, p2Price: 8, vatRate: 21 },
]

const bySku = new Map(CATALOG_BASES.map((p) => [p.sku, p]))

export async function getProductPriceBase(sku: string): Promise<ProductPriceBase | null> {
  return bySku.get(sku) ?? null
}
