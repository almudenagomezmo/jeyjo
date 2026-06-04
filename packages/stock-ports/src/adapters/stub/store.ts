import { StockIntegrationError } from '../../errors.js'
import type { StockSnapshotDto, StockSourceId } from '../../types/stock-dtos.js'

const outageBySource = new Map<StockSourceId, boolean>()

export function setStubStockSimulateUnavailable(
  sourceId: StockSourceId,
  enabled: boolean,
): void {
  outageBySource.set(sourceId, enabled)
}

export function getStubStockSimulateUnavailable(sourceId: StockSourceId): boolean {
  return outageBySource.get(sourceId) === true
}

export function assertStubStockAvailable(sourceId: StockSourceId): void {
  if (outageBySource.get(sourceId)) {
    throw new StockIntegrationError(
      'STOCK_UNAVAILABLE',
      `Stub stock adapter for ${sourceId} is simulating unavailability`,
    )
  }
}

export function resetStubStockOutageState(): void {
  outageBySource.clear()
}

export function paginateStockSnapshots(
  items: StockSnapshotDto[],
  options?: { limit?: number; cursor?: string | null },
): { items: StockSnapshotDto[]; nextCursor: string | null; hasMore: boolean } {
  const limit = Math.max(1, options?.limit ?? 50)
  const sorted = [...items].sort((a, b) => a.wholesaleRef.localeCompare(b.wholesaleRef))
  let start = 0
  if (options?.cursor) {
    const idx = sorted.findIndex((item) => item.wholesaleRef > options.cursor!)
    start = idx === -1 ? sorted.length : idx
  }
  const page = sorted.slice(start, start + limit)
  const hasMore = start + limit < sorted.length
  const nextCursor =
    hasMore && page.length > 0 ? page[page.length - 1]!.wholesaleRef : null
  return { items: page, nextCursor, hasMore }
}
