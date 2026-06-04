import type { StockSnapshotDto } from '../types/stock-dtos.js'
import type { StockPageOptions, StockPageResult } from '../types/pagination.js'
import type { StockSourceId } from '../types/stock-dtos.js'

export interface StockSourceReader {
  readonly sourceId: StockSourceId
  listStockSnapshots(options?: StockPageOptions): Promise<StockPageResult<StockSnapshotDto>>
  getStockByRef(wholesaleRef: string): Promise<StockSnapshotDto | null>
}
