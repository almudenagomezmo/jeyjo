export type StockIndicatorLevel = 'available' | 'low' | 'limited'

export type StockIndicatorResult = {
  level: StockIndicatorLevel
  label: string
  isStale: boolean
}

export const STOCK_INDICATOR_LABELS: Record<StockIndicatorLevel, string> = {
  available: 'Disponible',
  low: 'Últimas unidades',
  limited: 'Disponibilidad limitada según fabricante',
}

export const DEFAULT_STOCK_LOW_THRESHOLD = 5

export type ResolveStockIndicatorInput = {
  erpStock?: number | null
  distrisantiagoStock?: number | null
  arnoiaStock?: number | null
  threshold?: number
  staleDistrisantiago?: boolean
  staleArnoia?: boolean
}

function hasExplicitQuantity(value: number | null | undefined): boolean {
  return value !== null && value !== undefined
}

export function resolveStockIndicator(input: ResolveStockIndicatorInput): StockIndicatorResult {
  const threshold = input.threshold ?? DEFAULT_STOCK_LOW_THRESHOLD
  const erp = input.erpStock
  const distri = input.distrisantiagoStock
  const arnoia = input.arnoiaStock

  const hasAnySource =
    hasExplicitQuantity(erp) || hasExplicitQuantity(distri) || hasExplicitQuantity(arnoia)

  const effectiveQty = Math.max(erp ?? 0, distri ?? 0, arnoia ?? 0)
  const isStale = Boolean(input.staleDistrisantiago || input.staleArnoia)

  let level: StockIndicatorLevel

  if (!hasAnySource) {
    level = 'limited'
  } else if (effectiveQty === 0) {
    level = 'limited'
  } else if (hasExplicitQuantity(erp) && erp! <= threshold) {
    level = 'low'
  } else {
    level = 'available'
  }

  return {
    level,
    label: STOCK_INDICATOR_LABELS[level],
    isStale,
  }
}

export function parseStockLowThreshold(envValue: string | undefined): number {
  if (!envValue?.trim()) return DEFAULT_STOCK_LOW_THRESHOLD
  const parsed = Number.parseInt(envValue, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_STOCK_LOW_THRESHOLD
}
