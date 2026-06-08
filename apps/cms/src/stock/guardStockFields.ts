import type { PayloadRequest } from 'payload'

import { isWebNativeModeFromReq } from '@/lib/web-native-mode'
import {
  STOCK_SYNC_FIELD_NAMES,
  type StockSyncFieldName,
} from '@/stock/stockFieldNames'

const WEB_NATIVE_STOCK_PROTECTED: StockSyncFieldName[] = [
  'distrisantiagoStock',
  'arnoiaStock',
  'stockIndicator',
  'syncDistrisantiagoAt',
  'syncArnoiaAt',
]

function isStockSync(req: PayloadRequest): boolean {
  return req.context?.stockSync === true
}

export function guardStockProductFields({
  data,
  originalDoc,
  req,
}: {
  data?: Record<string, unknown>
  originalDoc?: Record<string, unknown> | null
  req: PayloadRequest
}): Record<string, unknown> | undefined {
  if (!data || isStockSync(req)) {
    return data
  }

  const protectedFields = isWebNativeModeFromReq(req)
    ? WEB_NATIVE_STOCK_PROTECTED
    : [...STOCK_SYNC_FIELD_NAMES]

  if (originalDoc) {
    for (const field of protectedFields) {
      if (field in data) {
        data[field] = originalDoc[field]
      }
    }
    return data
  }

  for (const field of protectedFields) {
    delete data[field]
  }
  return data
}

export function hasBlockedStockEdits(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown>,
): StockSyncFieldName[] {
  const changed: StockSyncFieldName[] = []
  for (const field of STOCK_SYNC_FIELD_NAMES) {
    if (field in data && data[field] !== originalDoc[field]) {
      changed.push(field)
    }
  }
  return changed
}
