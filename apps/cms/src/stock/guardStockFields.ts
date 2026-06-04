import type { PayloadRequest } from 'payload'

import {
  STOCK_SYNC_FIELD_NAMES,
  type StockSyncFieldName,
} from '@/stock/stockFieldNames'

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

  if (originalDoc) {
    for (const field of STOCK_SYNC_FIELD_NAMES) {
      if (field in data) {
        data[field] = originalDoc[field]
      }
    }
    return data
  }

  for (const field of STOCK_SYNC_FIELD_NAMES) {
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
