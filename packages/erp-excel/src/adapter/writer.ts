import { ErpIntegrationError } from '@jeyjo/erp-ports'
import type { ErpCatalogWriter } from '@jeyjo/erp-ports'
import type { ErpProductDto, ErpSupplierDto, ErpUpsertConfirmation } from '@jeyjo/erp-ports'

import { serializeImportacionArticulos } from '../serialize.js'
import type { SerializeProductRow } from '../types.js'

export type ExcelCatalogWriter = ErpCatalogWriter & {
  flush(): Promise<Buffer>
  getProductCount(): number
}

export function createExcelCatalogWriter(): ExcelCatalogWriter {
  const products = new Map<string, SerializeProductRow>()
  const suppliers = new Map<string, ErpSupplierDto>()

  return {
    async upsertProduct(dto: ErpProductDto): Promise<ErpUpsertConfirmation> {
      const sku = dto.skuErp?.trim()
      if (!sku) {
        throw new ErpIntegrationError('ERP_VALIDATION', 'upsertProduct requires skuErp')
      }
      products.set(sku, { ...dto, skuErp: sku })
      return {
        naturalKey: sku,
        acknowledgedAt: new Date().toISOString(),
      }
    },

    async upsertSupplier(dto: ErpSupplierDto): Promise<ErpUpsertConfirmation> {
      const code = dto.erpCode?.trim()
      if (!code) {
        throw new ErpIntegrationError('ERP_VALIDATION', 'upsertSupplier requires erpCode')
      }
      if (!dto.name?.trim()) {
        throw new ErpIntegrationError('ERP_VALIDATION', 'upsertSupplier requires name')
      }
      suppliers.set(code, { ...dto, erpCode: code })
      return {
        naturalKey: code,
        acknowledgedAt: new Date().toISOString(),
      }
    },

    async flush(): Promise<Buffer> {
      return serializeImportacionArticulos([...products.values()])
    },

    getProductCount(): number {
      return products.size
    },
  }
}
