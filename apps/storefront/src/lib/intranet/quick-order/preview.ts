import type { ResolvedProductByReference } from '@/lib/catalog/resolve-product-by-reference'
import type { PriceQuote } from '@jeyjo/pricing'

export type QuickOrderPreview = {
  sku: string
  slug: string
  name: string
  imageUrl: string | null
  packUnit: number
  matchedField: 'sku' | 'oem' | 'ean'
  quote: {
    netUnit: number
    grossUnit: number
    appliedRule: string
    label?: string
  }
}

export function mapQuickOrderPreview(
  resolved: ResolvedProductByReference,
  quote: PriceQuote,
): QuickOrderPreview | null {
  const slug = resolved.doc.slug?.trim()
  if (!slug) return null

  return {
    sku: resolved.sku,
    slug,
    name: resolved.doc.title?.trim() || resolved.sku,
    imageUrl: resolved.doc.thumbnailUrl ?? null,
    packUnit: Math.max(1, Math.floor(Number(resolved.doc.packUnit ?? 1))),
    matchedField: resolved.matchedField,
    quote: {
      netUnit: quote.netUnit,
      grossUnit: quote.grossUnit,
      appliedRule: quote.appliedRule,
      label: quote.label,
    },
  }
}
