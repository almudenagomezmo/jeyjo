import {
  StockIntegrationError,
  createStubArnoiaReader,
  createStubDistrisantiagoReader,
  type StockSourceReader,
} from '@jeyjo/stock-ports'

export type StockDistriAdapterKind = 'stub' | 'ftp'
export type StockArnoiaAdapterKind = 'stub' | 'web'

export type StockSourceReaders = {
  distrisantiago: StockSourceReader
  arnoia: StockSourceReader
}

const DISTRI_SUPPORTED: StockDistriAdapterKind[] = ['stub', 'ftp']
const ARNOIA_SUPPORTED: StockArnoiaAdapterKind[] = ['stub', 'web']

export function resolveStockDistriAdapterKind(): StockDistriAdapterKind {
  const raw = process.env.STOCK_DISTRI_ADAPTER?.trim().toLowerCase()
  if (!raw) {
    if (process.env.NODE_ENV === 'development') return 'stub'
    throw new Error(
      'STOCK_DISTRI_ADAPTER is required in non-development environments (supported: stub, ftp)',
    )
  }
  if (!DISTRI_SUPPORTED.includes(raw as StockDistriAdapterKind)) {
    throw new Error(
      `Unsupported STOCK_DISTRI_ADAPTER="${raw}" (supported: ${DISTRI_SUPPORTED.join(', ')})`,
    )
  }
  return raw as StockDistriAdapterKind
}

export function resolveStockArnoiaAdapterKind(): StockArnoiaAdapterKind {
  const raw = process.env.STOCK_ARNOIA_ADAPTER?.trim().toLowerCase()
  if (!raw) {
    if (process.env.NODE_ENV === 'development') return 'stub'
    throw new Error(
      'STOCK_ARNOIA_ADAPTER is required in non-development environments (supported: stub, web)',
    )
  }
  if (!ARNOIA_SUPPORTED.includes(raw as StockArnoiaAdapterKind)) {
    throw new Error(
      `Unsupported STOCK_ARNOIA_ADAPTER="${raw}" (supported: ${ARNOIA_SUPPORTED.join(', ')})`,
    )
  }
  return raw as StockArnoiaAdapterKind
}

let cached: StockSourceReaders | null = null

export function getStockSourceReaders(): StockSourceReaders {
  if (cached) return cached

  const distriKind = resolveStockDistriAdapterKind()
  const arnoiaKind = resolveStockArnoiaAdapterKind()

  let distrisantiago: StockSourceReader
  switch (distriKind) {
    case 'stub':
      distrisantiago = createStubDistrisantiagoReader()
      break
    case 'ftp':
      throw new StockIntegrationError(
        'STOCK_NOT_IMPLEMENTED',
        'STOCK_DISTRI_ADAPTER=ftp is not implemented yet',
      )
    default:
      throw new Error(`Unhandled STOCK_DISTRI_ADAPTER: ${distriKind satisfies never}`)
  }

  let arnoia: StockSourceReader
  switch (arnoiaKind) {
    case 'stub':
      arnoia = createStubArnoiaReader()
      break
    case 'web':
      throw new StockIntegrationError(
        'STOCK_NOT_IMPLEMENTED',
        'STOCK_ARNOIA_ADAPTER=web is not implemented yet',
      )
    default:
      throw new Error(`Unhandled STOCK_ARNOIA_ADAPTER: ${arnoiaKind satisfies never}`)
  }

  cached = { distrisantiago, arnoia }
  return cached
}

export function resetStockAdapterCache(): void {
  cached = null
}
