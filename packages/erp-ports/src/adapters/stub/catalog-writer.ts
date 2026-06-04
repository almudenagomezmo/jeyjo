import { ErpIntegrationError } from '../../errors.js'
import type { ErpCatalogWriter } from '../../ports/catalog-writer.js'
import type { ErpProductDto, ErpSupplierDto, ErpUpsertConfirmation } from '../../types/dtos.js'
import { STUB_SAMPLE_PRODUCTS, STUB_SAMPLE_SUPPLIERS } from './sample-data.js'
import { assertStubAvailable, resetStubStores, stubProductStore, stubSupplierStore } from './store.js'

function ensureWriterInitialized(): void {
  if (stubProductStore.size === 0 && stubSupplierStore.size === 0) {
    resetStubStores(STUB_SAMPLE_PRODUCTS, STUB_SAMPLE_SUPPLIERS)
  }
}

export function createStubCatalogWriter(): ErpCatalogWriter {
  return {
    async upsertProduct(dto: ErpProductDto): Promise<ErpUpsertConfirmation> {
      assertStubAvailable()
      ensureWriterInitialized()
      const sku = dto.skuErp?.trim()
      if (!sku) {
        throw new ErpIntegrationError('ERP_VALIDATION', 'upsertProduct requires skuErp')
      }
      stubProductStore.set(sku, { ...dto, skuErp: sku })
      return {
        naturalKey: sku,
        acknowledgedAt: new Date().toISOString(),
      }
    },

    async upsertSupplier(dto: ErpSupplierDto): Promise<ErpUpsertConfirmation> {
      assertStubAvailable()
      ensureWriterInitialized()
      const code = dto.erpCode?.trim()
      if (!code) {
        throw new ErpIntegrationError('ERP_VALIDATION', 'upsertSupplier requires erpCode')
      }
      if (!dto.name?.trim()) {
        throw new ErpIntegrationError('ERP_VALIDATION', 'upsertSupplier requires name')
      }
      stubSupplierStore.set(code, { ...dto, erpCode: code })
      return {
        naturalKey: code,
        acknowledgedAt: new Date().toISOString(),
      }
    },
  }
}
