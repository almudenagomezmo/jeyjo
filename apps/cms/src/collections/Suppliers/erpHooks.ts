import type { CollectionBeforeChangeHook } from 'payload'

import { guardErpSupplierFields } from '@/erp/guardErpFields'

export const erpSupplierBeforeChange: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  return guardErpSupplierFields({
    data: data as Record<string, unknown> | undefined,
    originalDoc: originalDoc as Record<string, unknown> | undefined,
    req,
  })
}
