import { createStubCatalogReader } from './catalog-reader.js'
import { createStubCatalogWriter } from './catalog-writer.js'
import { createStubDocumentsReader } from './documents-reader.js'
import { createStubPricingReader } from './pricing-reader.js'
import { createStubPurchaseHistoryReader } from './purchase-history-reader.js'

export type StubAdapterBundle = {
  catalogReader: ReturnType<typeof createStubCatalogReader>
  catalogWriter: ReturnType<typeof createStubCatalogWriter>
  documentsReader: ReturnType<typeof createStubDocumentsReader>
  pricingReader: ReturnType<typeof createStubPricingReader>
  purchaseHistoryReader: ReturnType<typeof createStubPurchaseHistoryReader>
}

export function createStubAdapterBundle(): StubAdapterBundle {
  return {
    catalogReader: createStubCatalogReader(),
    catalogWriter: createStubCatalogWriter(),
    documentsReader: createStubDocumentsReader(),
    pricingReader: createStubPricingReader(),
    purchaseHistoryReader: createStubPurchaseHistoryReader(),
  }
}

export {
  createStubCatalogReader,
  resetStubAdapterState,
} from './catalog-reader.js'
export { createStubCatalogWriter } from './catalog-writer.js'
export { createStubDocumentsReader } from './documents-reader.js'
export { setStubSimulateUnavailable, getStubSimulateUnavailable } from './store.js'
export { STUB_SAMPLE_PRODUCTS, STUB_SAMPLE_SUPPLIERS } from './sample-data.js'
export { STUB_SPECIAL_PRICES, STUB_GROUP_OFFERS } from './pricing-data.js'
export { createStubPricingReader } from './pricing-reader.js'
export { createStubPurchaseHistoryReader } from './purchase-history-reader.js'
export { STUB_INVOICES_BY_CUSTOMER } from './invoice-data.js'
export { STUB_DUE_PAYMENTS_BY_CUSTOMER } from './due-payments-data.js'
export { STUB_DELIVERY_NOTES_BY_CUSTOMER } from './delivery-notes-data.js'
export { STUB_FORM347_BY_CUSTOMER } from './form347-data.js'
export { STUB_ERP_QUOTES_BY_CUSTOMER } from './erp-quotes-data.js'
export { STUB_PURCHASE_HISTORY } from './purchase-history-data.js'
