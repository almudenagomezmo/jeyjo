import { PRODUCTS } from '@/lib/data/products'
import type { PlpProductRow } from '@/lib/plp/types'
import type { StockIndicatorLevel } from '@jeyjo/stock-ports'

export function isPlpDemoFallback(): boolean {
  return process.env.PLP_DEMO_FALLBACK === 'true'
}

function stockLevel(stock: number): StockIndicatorLevel {
  if (stock === 0) return 'limited'
  if (stock <= 5) return 'low'
  return 'available'
}

function demoToRow(p: (typeof PRODUCTS)[number]): PlpProductRow {
  return {
    sku: p.id,
    slug: p.id,
    title: p.name,
    brand: p.brand,
    facetColor: p.tags.includes('azul') ? 'Azul' : p.tags.includes('rojo') ? 'Rojo' : null,
    facetMaterial: p.tags.includes('papel') ? 'Papel' : p.tags.includes('plastico') ? 'Plástico' : null,
    ecoLabel: p.eco === true,
    categorySlugs: [p.categoryId, p.subcategoryId].filter(Boolean),
    packUnit: p.packSize,
    vatRate: p.vat,
    stockIndicator: stockLevel(p.stock),
    allowOrderWithoutStock: false,
    rating: p.rating,
    reviews: p.reviews,
    hasOffer: p.offer != null,
    imageUrl: null,
  }
}

export function demoRowsForCategory(categorySlugs: string[]): PlpProductRow[] {
  if (categorySlugs.length === 0) return PRODUCTS.map(demoToRow)
  return PRODUCTS.filter(
    (p) =>
      categorySlugs.includes(p.categoryId) ||
      categorySlugs.includes(p.subcategoryId),
  ).map(demoToRow)
}

export function demoRowsForSearch(q: string): PlpProductRow[] {
  const needle = q.toLowerCase()
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(needle) ||
      p.id.toLowerCase().includes(needle) ||
      p.brand.toLowerCase().includes(needle) ||
      p.ref.toLowerCase().includes(needle),
  ).map(demoToRow)
}
