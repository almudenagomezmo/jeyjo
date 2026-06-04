import type { ErpProductDto, ErpSupplierDto } from '../types/dtos.js'
import type { ErpPageOptions, ErpPageResult } from '../types/pagination.js'

export interface ErpCatalogReader {
  listProducts(options?: ErpPageOptions): Promise<ErpPageResult<ErpProductDto>>
  getProductBySku(skuErp: string): Promise<ErpProductDto | null>
  listSuppliers(options?: ErpPageOptions): Promise<ErpPageResult<ErpSupplierDto>>
}
