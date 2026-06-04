import type { GlyphKind, PriceMode } from '@/lib/types'

export type CartProductSnapshot = {
  slug: string
  skuErp: string
  name: string
  ref: string
  packUnit: number
  imageUrl: string | null
  vatRate: number
  brand: string
  glyph: GlyphKind
  eco?: boolean
}

export type CartDetailedLine = {
  /** Cart line identifier (canonical slug preferred). */
  lineId: string
  snapshot: CartProductSnapshot | null
  unavailable: boolean
  qty: number
  unitPrice: number
  lineTotal: number
}

export type CartSummary = {
  lines: CartDetailedLine[]
  itemCount: number
  subtotal: number
  shippingThreshold: number
  shippingCost: number
  amountToFreeShipping: number
  total: number
  mode: PriceMode
}
