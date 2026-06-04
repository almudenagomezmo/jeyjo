import { PRODUCTS, getProduct, getRelatedProducts } from '@/lib/data/products'
import type { PlpProductRow } from '@/lib/plp/types'
import type { StockIndicatorLevel } from '@jeyjo/stock-ports'

import type { PdpProductView } from '@/lib/pdp/types'

export function isPdpDemoFallback(): boolean {
  return process.env.PDP_USE_DEMO_DATA === 'true'
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
    facetColor: null,
    facetMaterial: null,
    ecoLabel: p.eco === true,
    categorySlugs: [p.categoryId, p.subcategoryId].filter(Boolean),
    packUnit: p.packSize,
    vatRate: p.vat,
    stockIndicator: stockLevel(p.stock),
    allowOrderWithoutStock: false,
    rating: p.rating,
    reviews: p.reviews,
    hasOffer: p.offer != null,
  }
}

export function loadDemoPdpView(id: string): {
  product: PdpProductView
  relatedRows: PlpProductRow[]
  redirectToSlug: string | null
} | null {
  const p = getProduct(id)
  if (!p) return null

  const related = getRelatedProducts(p).map(demoToRow)

  return {
    redirectToSlug: null,
    relatedRows: related,
    product: {
      sku: p.id,
      slug: p.id,
      title: p.name,
      brand: p.brand,
      oem: p.oem ?? null,
      ean: p.ean,
      packUnit: p.packSize,
      vatRate: p.vat,
      ecoLabel: p.eco === true,
      categoryName: p.categoryId,
      categorySlugs: [p.categoryId, p.subcategoryId].filter(Boolean),
      imageUrl: null,
      longDescriptionHtml: `<p>${p.description}</p>`,
      metaDescription: p.description.slice(0, 160),
      specRows: [
        ['Marca', p.brand],
        ['Referencia Jeyjo', p.ref],
        ['Referencia fabricante (OEM)', p.oem ?? '—'],
        ['Código EAN', p.ean],
        ['Envase de venta', `${p.packSize} unidades`],
        ['IVA aplicable', `${p.vat}%`],
        ['Categoría', p.categoryId],
      ],
      attachments: [],
      glyph: p.glyph,
      rating: p.rating,
      reviews: p.reviews,
    },
  }
}
