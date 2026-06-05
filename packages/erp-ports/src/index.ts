export { ErpIntegrationError, type ErpIntegrationErrorCode } from './errors.js'

export type {
  ErpProductDto,
  ErpSupplierDto,
  ErpSupplierType,
  ErpUpsertConfirmation,
} from './types/dtos.js'
export type { ErpSpecialPriceDto, ErpGroupOfferDto } from './types/pricing-dtos.js'
export type { ErpPageOptions, ErpPageResult } from './types/pagination.js'

export type { ErpCatalogReader } from './ports/catalog-reader.js'
export type { ErpCatalogWriter } from './ports/catalog-writer.js'
export type {
  ErpDocumentsReader,
  ErpInvoiceListItem,
  ErpDeliveryNoteListItem,
} from './ports/documents-reader.js'
export type { ErpPricingReader } from './ports/pricing-reader.js'
export type { ErpPurchaseHistoryReader } from './ports/purchase-history-reader.js'
export type {
  ErpPurchaseHistoryLineDto,
  ErpPurchaseHistoryListOptions,
} from './types/purchase-history-dtos.js'

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
  STUB_SPECIAL_PRICES,
  STUB_GROUP_OFFERS,
  createStubPricingReader,
  createStubPurchaseHistoryReader,
  STUB_PURCHASE_HISTORY,
  STUB_INVOICES_BY_CUSTOMER,
  type StubAdapterBundle,
} from './adapters/stub/index.js'
