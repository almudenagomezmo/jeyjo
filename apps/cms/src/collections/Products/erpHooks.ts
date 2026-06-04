import type { CollectionBeforeChangeHook } from 'payload'

import { guardErpProductFields } from '@/erp/guardErpFields'

export const erpProductBeforeChange: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  return guardErpProductFields({
    data: data as Record<string, unknown> | undefined,
    originalDoc: originalDoc as Record<string, unknown> | undefined,
    req,
  })
}
