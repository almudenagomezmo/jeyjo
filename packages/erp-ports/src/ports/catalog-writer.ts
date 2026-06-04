import type { ErpProductDto, ErpSupplierDto, ErpUpsertConfirmation } from '../types/dtos.js'

export interface ErpCatalogWriter {
  upsertProduct(dto: ErpProductDto): Promise<ErpUpsertConfirmation>
  upsertSupplier(dto: ErpSupplierDto): Promise<ErpUpsertConfirmation>
}
