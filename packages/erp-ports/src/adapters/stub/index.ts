import { createStubCatalogReader } from './catalog-reader.js'
import { createStubCatalogWriter } from './catalog-writer.js'
import { createStubDocumentsReader } from './documents-reader.js'
import { createStubPricingReader } from './pricing-reader.js'

export type StubAdapterBundle = {
  catalogReader: ReturnType<typeof createStubCatalogReader>
  catalogWriter: ReturnType<typeof createStubCatalogWriter>
  documentsReader: ReturnType<typeof createStubDocumentsReader>
  pricingReader: ReturnType<typeof createStubPricingReader>
}

export function createStubAdapterBundle(): StubAdapterBundle {
  return {
    catalogReader: createStubCatalogReader(),
    catalogWriter: createStubCatalogWriter(),
    documentsReader: createStubDocumentsReader(),
    pricingReader: createStubPricingReader(),
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
