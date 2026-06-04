import type { StockSourceReader } from '../../ports/stock-source-reader.js'
import type { StockSnapshotDto } from '../../types/stock-dtos.js'
import type { StockPageOptions, StockPageResult } from '../../types/pagination.js'
import { STUB_DISTRISANTIAGO_SNAPSHOTS } from './stock-data.js'
import {
  assertStubStockAvailable,
  paginateStockSnapshots,
} from './store.js'

const store = new Map<string, StockSnapshotDto>()

function ensureStore(): void {
  if (store.size === 0) {
    for (const row of STUB_DISTRISANTIAGO_SNAPSHOTS) {
      store.set(row.wholesaleRef, { ...row })
    }
  }
}

export function resetStubDistrisantiagoStore(): void {
  store.clear()
  ensureStore()
}

export function createStubDistrisantiagoReader(): StockSourceReader {
  return {
    sourceId: 'distrisantiago',

    async listStockSnapshots(
      options?: StockPageOptions,
    ): Promise<StockPageResult<StockSnapshotDto>> {
      assertStubStockAvailable('distrisantiago')
      ensureStore()
      const all = [...store.values()]
      return paginateStockSnapshots(all, options)
    },

    async getStockByRef(wholesaleRef: string): Promise<StockSnapshotDto | null> {
      assertStubStockAvailable('distrisantiago')
      ensureStore()
      const row = store.get(wholesaleRef)
      return row ? { ...row } : null
    },
  }
}
