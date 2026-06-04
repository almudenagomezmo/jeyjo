import type { ErpProductDto } from '@jeyjo/erp-ports'

import type { ERP_PRODUCT_FIELD_NAMES } from '@/erp/erpFieldNames'

type ErpProductPayloadFields = {
  [K in (typeof ERP_PRODUCT_FIELD_NAMES)[number]]?: unknown
}

/**
 * Maps normalized ERP DTO to Payload product ERP tab fields.
 * Keys align 1:1 with `collections/Products/erpFields.ts`.
 */
export function mapErpProductDtoToPayload(
  dto: ErpProductDto,
  syncAt?: string,
): ErpProductPayloadFields {
  return {
    skuErp: dto.skuErp,
    mainWholesaleRef: dto.mainWholesaleRef ?? undefined,
    oemRef: dto.oemRef ?? undefined,
    ean: dto.ean ?? undefined,
    shortDescription: dto.shortDescription ?? undefined,
    p1Price: dto.p1Price ?? undefined,
    p2Price: dto.p2Price ?? undefined,
    vatRate: dto.vatRate ?? undefined,
    packUnit: dto.packUnit ?? undefined,
    isWildcard: dto.isWildcard ?? false,
    allowOrderWithoutStock: dto.allowOrderWithoutStock ?? false,
    erpStock: dto.erpStock ?? undefined,
    syncErpAt: syncAt ?? dto.syncedAt ?? new Date().toISOString(),
  }
}
