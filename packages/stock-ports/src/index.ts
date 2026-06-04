export { StockIntegrationError, type StockIntegrationErrorCode } from './errors.js'

export type { StockSnapshotDto, StockSourceId } from './types/stock-dtos.js'
export type { StockPageOptions, StockPageResult } from './types/pagination.js'

export type { StockSourceReader } from './ports/stock-source-reader.js'

export {
  resolveStockIndicator,
  parseStockLowThreshold,
  STOCK_INDICATOR_LABELS,
  DEFAULT_STOCK_LOW_THRESHOLD,
  type StockIndicatorLevel,
  type StockIndicatorResult,
  type ResolveStockIndicatorInput,
} from './semaphore/resolve-stock-indicator.js'

export {
  createStubDistrisantiagoReader,
  createStubArnoiaReader,
  resetStubDistrisantiagoStore,
  resetStubArnoiaStore,
  setStubStockSimulateUnavailable,
  getStubStockSimulateUnavailable,
  resetStubStockOutageState,
  STUB_DISTRISANTIAGO_SNAPSHOTS,
  STUB_ARNOIA_SNAPSHOTS,
} from './adapters/stub/index.js'
