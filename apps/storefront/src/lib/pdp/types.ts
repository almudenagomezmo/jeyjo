import type { PriceQuote } from '@jeyjo/pricing'

import type { PlpProductRow } from '@/lib/plp/types'
import type { PublicStockIndicator } from '@/lib/stock/types'
import type { GlyphKind } from '@/lib/types'

export type PdpAttachment = {
  label: string
  url: string
}

export type PdpSpecRow = [label: string, value: string]

export type PdpProductView = {
  sku: string
  slug: string
  title: string
  brand: string
  oem: string | null
  ean: string | null
  packUnit: number
  vatRate: number
  ecoLabel: boolean
  categoryName: string
  categorySlugs: string[]
  imageUrl: string | null
  metaTitle: string | null
  seoImageUrl: string | null
  longDescriptionHtml: string | null
  metaDescription: string | null
  specRows: PdpSpecRow[]
  attachments: PdpAttachment[]
  glyph: GlyphKind
  rating: number | null
  reviews: number | null
}

export type PdpPagePayload = {
  product: PdpProductView
  quote: PriceQuote
  stock: PublicStockIndicator
  relatedRows: PlpProductRow[]
  quotesBySku: Record<string, PriceQuote>
  stockBySku: Record<string, PublicStockIndicator>
  /** When the request used SKU but a canonical slug exists. */
  redirectToSlug: string | null
}

export const PDP_RELATED_LIMIT = 8
