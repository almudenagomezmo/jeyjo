import type { PurchaseHistoryFilters } from './types'

export function parsePurchaseHistoryFilters(url: URL): PurchaseHistoryFilters {
  const page = Number.parseInt(url.searchParams.get('page') ?? '1', 10)
  const pageSize = Number.parseInt(url.searchParams.get('pageSize') ?? '25', 10)

  return {
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    sku: url.searchParams.get('sku') ?? undefined,
    categoryId: url.searchParams.get('categoryId') ?? undefined,
    department: url.searchParams.get('department') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 25,
  }
}
