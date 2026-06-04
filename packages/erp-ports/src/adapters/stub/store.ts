import { ErpIntegrationError } from '../../errors.js'
import type { ErpProductDto, ErpSupplierDto } from '../../types/dtos.js'

/** In-memory catalog shared by stub reader and writer in the same process. */
export const stubProductStore = new Map<string, ErpProductDto>()
export const stubSupplierStore = new Map<string, ErpSupplierDto>()

/** Test-only: when true, read operations throw ERP_UNAVAILABLE. */
let simulateUnavailable = false

export function setStubSimulateUnavailable(enabled: boolean): void {
  simulateUnavailable = enabled
}

export function getStubSimulateUnavailable(): boolean {
  return simulateUnavailable
}

export function assertStubAvailable(): void {
  if (simulateUnavailable) {
    throw new ErpIntegrationError('ERP_UNAVAILABLE', 'Stub ERP adapter is simulating unavailability')
  }
}

export function resetStubStores(seedProducts: ErpProductDto[], seedSuppliers: ErpSupplierDto[]): void {
  stubProductStore.clear()
  stubSupplierStore.clear()
  simulateUnavailable = false
  for (const p of seedProducts) {
    stubProductStore.set(p.skuErp, { ...p })
  }
  for (const s of seedSuppliers) {
    stubSupplierStore.set(s.erpCode, { ...s })
  }
}

export function paginate<T extends { skuErp?: string; erpCode?: string }>(
  items: T[],
  options?: { limit?: number; cursor?: string | null },
  keyFn: (item: T) => string = (item) => (item.skuErp ?? item.erpCode ?? ''),
): { items: T[]; nextCursor: string | null; hasMore: boolean } {
  const limit = Math.max(1, options?.limit ?? 50)
  const sorted = [...items].sort((a, b) => keyFn(a).localeCompare(keyFn(b)))
  let start = 0
  if (options?.cursor) {
    const idx = sorted.findIndex((item) => keyFn(item) > options.cursor!)
    start = idx === -1 ? sorted.length : idx
  }
  const page = sorted.slice(start, start + limit)
  const hasMore = start + limit < sorted.length
  const nextCursor = hasMore && page.length > 0 ? keyFn(page[page.length - 1]!) : null
  return { items: page, nextCursor, hasMore }
}
