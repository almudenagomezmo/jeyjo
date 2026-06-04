/** Payload product fields written by stock sync — keep in sync with `stockFields.ts`. */
export const STOCK_SYNC_FIELD_NAMES = [
  'distrisantiagoStock',
  'arnoiaStock',
  'stockIndicator',
  'syncDistrisantiagoAt',
  'syncArnoiaAt',
] as const

export type StockSyncFieldName = (typeof STOCK_SYNC_FIELD_NAMES)[number]
