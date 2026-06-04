import { STOCK_INDICATOR_LABELS } from '@jeyjo/stock-ports'

import type { PlpProductRow } from '@/lib/plp/types'
import type { PublicStockIndicator } from '@/lib/stock/types'

export function stockIndicatorsFromRows(rows: PlpProductRow[]): Record<string, PublicStockIndicator> {
  const out: Record<string, PublicStockIndicator> = {}
  for (const row of rows) {
    const level = row.stockIndicator
    out[row.sku] = {
      level,
      label: STOCK_INDICATOR_LABELS[level],
      isStale: false,
      allowOrderWithoutStock: row.allowOrderWithoutStock,
    }
  }
  return out
}
