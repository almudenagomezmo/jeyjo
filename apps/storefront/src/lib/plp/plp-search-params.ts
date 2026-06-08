import type { PlpActiveFilters, PlpSortKey } from '@/lib/plp/types'

const SORT_KEYS: PlpSortKey[] = ['relevance', 'price-asc', 'price-desc', 'rating', 'name']

function parseList(value: string | string[] | undefined): string[] {
  if (!value) return []
  const raw = Array.isArray(value) ? value.join(',') : value
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseBool(value: string | string[] | undefined): boolean {
  if (!value) return false
  const v = Array.isArray(value) ? value[0] : value
  return v === '1' || v === 'true'
}

function parseNumber(value: string | string[] | undefined): number | null {
  if (!value) return null
  const v = Array.isArray(value) ? value[0] : value
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function parsePlpSearchParams(
  params: Record<string, string | string[] | undefined>,
): {
  filters: PlpActiveFilters
  sort: PlpSortKey
  page: number
  q: string
} {
  const sortRaw = Array.isArray(params.sort) ? params.sort[0] : params.sort
  const sort = SORT_KEYS.includes(sortRaw as PlpSortKey) ? (sortRaw as PlpSortKey) : 'relevance'

  const pageRaw = parseNumber(params.page)
  const page = pageRaw != null && pageRaw >= 1 ? Math.floor(pageRaw) : 1

  const qRaw = Array.isArray(params.q) ? params.q[0] : params.q

  return {
    filters: {
      brands: parseList(params.brand),
      suppliers: parseList(params.supplier),
      colors: parseList(params.color),
      materials: parseList(params.material),
      priceMax: parseNumber(params.priceMax),
      inStockToday: parseBool(params.inStockToday),
      eco: parseBool(params.eco),
    },
    sort,
    page,
    q: (qRaw ?? '').trim(),
  }
}

export function serializePlpSearchParams(input: {
  filters: PlpActiveFilters
  sort: PlpSortKey
  page: number
  q?: string
}): URLSearchParams {
  const sp = new URLSearchParams()
  if (input.q) sp.set('q', input.q)
  for (const brand of input.filters.brands) sp.append('brand', brand)
  for (const supplier of input.filters.suppliers) sp.append('supplier', supplier)
  for (const color of input.filters.colors) sp.append('color', color)
  for (const material of input.filters.materials) sp.append('material', material)
  if (input.filters.priceMax != null) sp.set('priceMax', String(input.filters.priceMax))
  if (input.filters.inStockToday) sp.set('inStockToday', '1')
  if (input.filters.eco) sp.set('eco', '1')
  if (input.sort !== 'relevance') sp.set('sort', input.sort)
  if (input.page > 1) sp.set('page', String(input.page))
  return sp
}
