import type { ErpCatalogReader } from '../../ports/catalog-reader.js'
import type { ErpProductDto, ErpSupplierDto } from '../../types/dtos.js'
import type { ErpPageOptions, ErpPageResult } from '../../types/pagination.js'
import { STUB_SAMPLE_PRODUCTS, STUB_SAMPLE_SUPPLIERS } from './sample-data.js'
import {
  assertStubAvailable,
  paginate,
  resetStubStores,
  stubProductStore,
  stubSupplierStore,
} from './store.js'

let initialized = false

function ensureInitialized(): void {
  if (!initialized) {
    resetStubStores(STUB_SAMPLE_PRODUCTS, STUB_SAMPLE_SUPPLIERS)
    initialized = true
  }
}

export function createStubCatalogReader(): ErpCatalogReader {
  return {
    async listProducts(options?: ErpPageOptions): Promise<ErpPageResult<ErpProductDto>> {
      assertStubAvailable()
      ensureInitialized()
      const all = [...stubProductStore.values()]
      const page = paginate(all, options, (p) => p.skuErp)
      return page
    },

    async getProductBySku(skuErp: string): Promise<ErpProductDto | null> {
      assertStubAvailable()
      ensureInitialized()
      const product = stubProductStore.get(skuErp)
      return product ? { ...product } : null
    },

    async listSuppliers(options?: ErpPageOptions): Promise<ErpPageResult<ErpSupplierDto>> {
      assertStubAvailable()
      ensureInitialized()
      const all = [...stubSupplierStore.values()]
      return paginate(all, options, (s) => s.erpCode)
    },
  }
}

/** Reset stub stores to seed data (tests). */
export function resetStubAdapterState(): void {
  initialized = false
  resetStubStores(STUB_SAMPLE_PRODUCTS, STUB_SAMPLE_SUPPLIERS)
  initialized = true
}
