import type { StockSourceReader } from '../../ports/stock-source-reader.js'
import type { StockSnapshotDto } from '../../types/stock-dtos.js'
import type { StockPageOptions, StockPageResult } from '../../types/pagination.js'
import { STUB_ARNOIA_SNAPSHOTS } from './stock-data.js'
import {
  assertStubStockAvailable,
  paginateStockSnapshots,
} from './store.js'

const store = new Map<string, StockSnapshotDto>()

function ensureStore(): void {
  if (store.size === 0) {
    for (const row of STUB_ARNOIA_SNAPSHOTS) {
      store.set(row.wholesaleRef, { ...row })
    }
  }
}

export function resetStubArnoiaStore(): void {
  store.clear()
  ensureStore()
}

export function createStubArnoiaReader(): StockSourceReader {
  return {
    sourceId: 'arnoia',

    async listStockSnapshots(
      options?: StockPageOptions,
    ): Promise<StockPageResult<StockSnapshotDto>> {
      assertStubStockAvailable('arnoia')
      ensureStore()
      const all = [...store.values()]
      return paginateStockSnapshots(all, options)
    },

    async getStockByRef(wholesaleRef: string): Promise<StockSnapshotDto | null> {
      assertStubStockAvailable('arnoia')
      ensureStore()
      const row = store.get(wholesaleRef)
      return row ? { ...row } : null
    },
  }
}
