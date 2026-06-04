export { ErpIntegrationError, type ErpIntegrationErrorCode } from './errors.js'

export type {
  ErpProductDto,
  ErpSupplierDto,
  ErpSupplierType,
  ErpUpsertConfirmation,
} from './types/dtos.js'
export type { ErpPageOptions, ErpPageResult } from './types/pagination.js'

export type { ErpCatalogReader } from './ports/catalog-reader.js'
export type { ErpCatalogWriter } from './ports/catalog-writer.js'
export type {
  ErpDocumentsReader,
  ErpInvoiceListItem,
  ErpDeliveryNoteListItem,
} from './ports/documents-reader.js'

export {
  createStubAdapterBundle,
  createStubCatalogReader,
  createStubCatalogWriter,
  createStubDocumentsReader,
  resetStubAdapterState,
  setStubSimulateUnavailable,
  getStubSimulateUnavailable,
  STUB_SAMPLE_PRODUCTS,
  STUB_SAMPLE_SUPPLIERS,
  type StubAdapterBundle,
} from './adapters/stub/index.js'
