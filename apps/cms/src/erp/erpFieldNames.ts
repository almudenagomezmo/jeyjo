/** Payload product fields sourced from ERP — keep in sync with `erpFields.ts` and `ErpProductDto`. */
export const ERP_PRODUCT_FIELD_NAMES = [
  'skuErp',
  'mainWholesaleRef',
  'oemRef',
  'ean',
  'shortDescription',
  'p1Price',
  'p2Price',
  'vatRate',
  'packUnit',
  'isWildcard',
  'allowOrderWithoutStock',
  'erpStock',
  'syncErpAt',
] as const

export type ErpProductFieldName = (typeof ERP_PRODUCT_FIELD_NAMES)[number]

/** Supplier fields updated from ERP sync. */
export const ERP_SUPPLIER_FIELD_NAMES = ['erpCode', 'name', 'type', 'baseImageUrl'] as const

export type ErpSupplierFieldName = (typeof ERP_SUPPLIER_FIELD_NAMES)[number]
