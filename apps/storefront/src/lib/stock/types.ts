import type { StockIndicatorLevel } from '@jeyjo/stock-ports'

export type PublicStockIndicator = {
  level: StockIndicatorLevel
  label: string
  isStale: boolean
  allowOrderWithoutStock: boolean
}
