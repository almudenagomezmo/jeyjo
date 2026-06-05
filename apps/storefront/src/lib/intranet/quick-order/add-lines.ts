import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'

import { buildQuickOrderPreview } from './build-preview'
import type { QuickOrderAddition, QuickOrderLinePreview } from './types'

export type QuickOrderAddInput = { reference: string; qty: number }

export async function buildQuickOrderAdditions(
  items: QuickOrderAddInput[],
  customerId: string | null,
): Promise<{
  additions: QuickOrderAddition[]
  previews: QuickOrderLinePreview[]
  missing: string[]
}> {
  const additions: QuickOrderAddition[] = []
  const previews: QuickOrderLinePreview[] = []
  const missing: string[] = []

  const resolved: Array<{ preview: QuickOrderLinePreview; slug: string }> = []

  for (const item of items) {
    const preview = await buildQuickOrderPreview(item.reference, item.qty, customerId)
    previews.push(preview)
    if (preview.status !== 'ok' || !preview.sku || !preview.productSlug || !preview.quote) {
      missing.push(item.reference.trim() || preview.inputReference)
      continue
    }
    resolved.push({ preview, slug: preview.productSlug })
  }

  const skus = resolved.map((r) => r.preview.sku!).filter(Boolean)
  const quotes = await resolvePriceQuotesBatch(skus, customerId)

  for (const { preview, slug } of resolved) {
    const sku = preview.sku!
    const quote = quotes[sku] ?? preview.quote
    if (!quote) {
      missing.push(preview.inputReference)
      continue
    }
    additions.push({
      productId: slug,
      sku,
      qty: preview.qty,
      quote: {
        netUnit: quote.netUnit,
        grossUnit: quote.grossUnit,
        appliedRule: quote.appliedRule,
        label: quote.label,
      },
    })
  }

  return { additions, previews, missing }
}
