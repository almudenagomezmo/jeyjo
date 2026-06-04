import { createStubCatalogReader } from './catalog-reader.js'
import { createStubCatalogWriter } from './catalog-writer.js'
import { createStubDocumentsReader } from './documents-reader.js'

export type StubAdapterBundle = {
  catalogReader: ReturnType<typeof createStubCatalogReader>
  catalogWriter: ReturnType<typeof createStubCatalogWriter>
  documentsReader: ReturnType<typeof createStubDocumentsReader>
}

export function createStubAdapterBundle(): StubAdapterBundle {
  return {
    catalogReader: createStubCatalogReader(),
    catalogWriter: createStubCatalogWriter(),
    documentsReader: createStubDocumentsReader(),
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
