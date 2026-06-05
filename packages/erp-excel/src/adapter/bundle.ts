import {
  ErpIntegrationError,
  createStubDocumentsReader,
  createStubPricingReader,
} from '@jeyjo/erp-ports'

import { createExcelCatalogReaderFromFile } from './reader.js'
import { createExcelCatalogWriter } from './writer.js'
import type { ExcelCatalogReaderSource } from './reader.js'
import { createExcelCatalogReader } from './reader.js'

export type ExcelAdapterBundle = {
  catalogReader: ReturnType<typeof createExcelCatalogReader>
  catalogWriter: ReturnType<typeof createExcelCatalogWriter>
  documentsReader: ReturnType<typeof createStubDocumentsReader>
  pricingReader: ReturnType<typeof createStubPricingReader>
}

export async function createExcelAdapterBundle(options?: {
  filePath?: string
  inMemory?: ExcelCatalogReaderSource
}): Promise<ExcelAdapterBundle> {
  let catalogReader

  if (options?.inMemory) {
    catalogReader = createExcelCatalogReader(options.inMemory)
  } else {
    const filePath = options?.filePath ?? process.env.ERP_EXCEL_CATALOG_PATH?.trim()
    if (!filePath) {
      throw new ErpIntegrationError(
        'ERP_VALIDATION',
        'ERP_ADAPTER=excel requires ERP_EXCEL_CATALOG_PATH or an in-memory import source',
      )
    }
    catalogReader = await createExcelCatalogReaderFromFile(filePath)
  }

  return {
    catalogReader,
    catalogWriter: createExcelCatalogWriter(),
    documentsReader: createStubDocumentsReader(),
    pricingReader: createStubPricingReader(),
  }
}
