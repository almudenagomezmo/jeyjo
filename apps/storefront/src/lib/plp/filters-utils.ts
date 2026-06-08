import type { PlpActiveFilters } from '@/lib/plp/types'

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((value, index) => value === sortedB[index])
}

export function normalizePriceMax(priceMax: number | null, priceCeiling: number): number | null {
  if (priceMax == null || priceMax >= priceCeiling) return null
  return priceMax
}

export function normalizePlpFilters(
  filters: PlpActiveFilters,
  priceCeiling: number,
): PlpActiveFilters {
  return {
    ...filters,
    priceMax: normalizePriceMax(filters.priceMax, priceCeiling),
  }
}

export function arePlpFiltersEqual(
  a: PlpActiveFilters,
  b: PlpActiveFilters,
  priceCeiling: number,
): boolean {
  if (a.inStockToday !== b.inStockToday) return false
  if (a.eco !== b.eco) return false
  if (
    normalizePriceMax(a.priceMax, priceCeiling) !== normalizePriceMax(b.priceMax, priceCeiling)
  ) {
    return false
  }
  return (
    arraysEqual(a.brands, b.brands) &&
    arraysEqual(a.suppliers, b.suppliers) &&
    arraysEqual(a.colors, b.colors) &&
    arraysEqual(a.materials, b.materials)
  )
}

export function countActivePlpFilters(filters: PlpActiveFilters, priceCeiling: number): number {
  return (
    filters.brands.length +
    filters.suppliers.length +
    filters.colors.length +
    filters.materials.length +
    (filters.inStockToday ? 1 : 0) +
    (filters.eco ? 1 : 0) +
    (normalizePriceMax(filters.priceMax, priceCeiling) != null ? 1 : 0)
  )
}
