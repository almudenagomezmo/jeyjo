import type { PriceQuote } from '@jeyjo/pricing'

export type SuggestProduct = {
  sku: string
  title: string
  slug: string
  href: string
  imageUrl?: string | null
  wholesaleRef?: string | null
  oemRef?: string | null
  ean?: string | null
  priceQuote?: PriceQuote
  glyph?: string
  brand?: string
}

export type SuggestCategory = {
  label: string
  href: string
  slug: string
}

export type SuggestResponse = {
  products: SuggestProduct[]
  categories: SuggestCategory[]
  latencyMs?: number
}

export type QdrantProductPayload = {
  skuErp?: string | null
  title?: string | null
  slug?: string | null
  ean?: string | null
  oemRef?: string | null
  mainWholesaleRef?: string | null
  thumbnailUrl?: string | null
  categorySlug?: string | null
}

export type QdrantCategoryPayload = {
  title?: string | null
  slug?: string | null
}
