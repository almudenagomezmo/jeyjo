import type { PayloadRequest } from 'payload'

import {
  ERP_PRODUCT_FIELD_NAMES,
  ERP_SUPPLIER_FIELD_NAMES,
  type ErpProductFieldName,
  type ErpSupplierFieldName,
} from '@/erp/erpFieldNames'
import { isWebNativeModeFromReq } from '@/lib/web-native-mode'

const WEB_NATIVE_PROTECTED_PRODUCT_FIELDS = ['syncErpAt'] as const

function isErpSync(req: PayloadRequest): boolean {
  return req.context?.erpSync === true
}

export function guardErpProductFields({
  data,
  originalDoc,
  req,
}: {
  data?: Record<string, unknown>
  originalDoc?: Record<string, unknown> | null
  req: PayloadRequest
}): Record<string, unknown> | undefined {
  if (!data || isErpSync(req)) {
    return data
  }

  if (isWebNativeModeFromReq(req)) {
    if (originalDoc) {
      for (const field of WEB_NATIVE_PROTECTED_PRODUCT_FIELDS) {
        if (field in data) {
          data[field] = originalDoc[field]
        }
      }
    } else {
      for (const field of WEB_NATIVE_PROTECTED_PRODUCT_FIELDS) {
        delete data[field]
      }
    }
    return data
  }

  if (originalDoc) {
    for (const field of ERP_PRODUCT_FIELD_NAMES) {
      if (field in data) {
        data[field] = originalDoc[field]
      }
    }
    return data
  }

  for (const field of ERP_PRODUCT_FIELD_NAMES) {
    delete data[field]
  }
  return data
}

export function guardErpSupplierFields({
  data,
  originalDoc,
  req,
}: {
  data?: Record<string, unknown>
  originalDoc?: Record<string, unknown> | null
  req: PayloadRequest
}): Record<string, unknown> | undefined {
  if (!data || isErpSync(req) || isWebNativeModeFromReq(req)) {
    return data
  }

  if (originalDoc) {
    for (const field of ERP_SUPPLIER_FIELD_NAMES) {
      if (field in data) {
        data[field] = originalDoc[field]
      }
    }
    return data
  }

  for (const field of ERP_SUPPLIER_FIELD_NAMES) {
    delete data[field]
  }
  return data
}

export function hasBlockedErpProductEdits(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown>,
): ErpProductFieldName[] {
  const changed: ErpProductFieldName[] = []
  for (const field of ERP_PRODUCT_FIELD_NAMES) {
    if (field in data && data[field] !== originalDoc[field]) {
      changed.push(field)
    }
  }
  return changed
}

export function hasBlockedErpSupplierEdits(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown>,
): ErpSupplierFieldName[] {
  const changed: ErpSupplierFieldName[] = []
  for (const field of ERP_SUPPLIER_FIELD_NAMES) {
    if (field in data && data[field] !== originalDoc[field]) {
      changed.push(field)
    }
  }
  return changed
}
