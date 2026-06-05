import type { PriceQuote } from '@jeyjo/pricing'

import { computeCartSummary } from '@/lib/cart/compute-summary'
import type { CartProductSnapshot } from '@/lib/cart/types'
import type { CartLine, PriceMode } from '@/lib/types'

const round2 = (n: number): number => Math.round(n * 100) / 100

export type EligibleSubtotalResult = {
  eligibleSubtotal: number
  ineligibleOfferLines: string[]
}

export function computeEligibleSubtotal(
  lines: CartLine[],
  products: CartProductSnapshot[],
  quotes: Record<string, PriceQuote>,
  mode: PriceMode,
): EligibleSubtotalResult {
  const summary = computeCartSummary(lines, products, quotes, mode)
  const ineligibleOfferLines: string[] = []
  let eligibleSubtotal = 0

  for (const line of summary.lines) {
    if (line.unavailable || !line.snapshot) continue
    const sku = line.snapshot.skuErp
    const quote = quotes[sku]
    if (quote?.appliedRule === 'group_offer') {
      ineligibleOfferLines.push(line.lineId)
      continue
    }
    eligibleSubtotal += line.lineTotal
  }

  return {
    eligibleSubtotal: round2(eligibleSubtotal),
    ineligibleOfferLines,
  }
}
