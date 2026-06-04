import type { CollectionBeforeChangeHook } from 'payload'

import { guardStockProductFields } from '@/stock/guardStockFields'

export const stockProductBeforeChange: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  return guardStockProductFields({
    data: data as Record<string, unknown> | undefined,
    originalDoc: originalDoc as Record<string, unknown> | undefined,
    req,
  })
}
