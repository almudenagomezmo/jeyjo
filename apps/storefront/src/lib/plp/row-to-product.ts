import type { PriceQuote } from '@jeyjo/pricing'

import type { PlpProductRow } from '@/lib/plp/types'
import type { GlyphKind, Product } from '@/lib/types'

const DEFAULT_GLYPH: GlyphKind = 'box'

export function plpRowToProduct(row: PlpProductRow, quote?: PriceQuote): Product {
  const net = quote?.netUnit ?? 0
  const vat = quote?.vatRate ?? row.vatRate
  const hasOffer =
    row.hasOffer ||
    (quote?.listUnit != null && quote.listUnit > quote.netUnit)

  return {
    id: row.slug,
    ref: row.sku,
    ean: '',
    name: row.title,
    brand: row.brand ?? '',
    categoryId: row.categorySlugs[0] ?? '',
    subcategoryId: row.categorySlugs[1] ?? row.categorySlugs[0] ?? '',
    priceNoVat: net,
    vat,
    packSize: row.packUnit,
    stock: row.stockIndicator === 'available' ? 100 : row.stockIndicator === 'low' ? 3 : 0,
    rating: row.rating,
    reviews: row.reviews,
    glyph: DEFAULT_GLYPH,
    colors: ['#94a3b8', '#64748b'] as const,
    description: row.title,
    tags: [],
    eco: row.ecoLabel,
    offer:
      hasOffer && quote?.listUnit != null
        ? { originalNoVat: quote.listUnit }
        : undefined,
  }
}
