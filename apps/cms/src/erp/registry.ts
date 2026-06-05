import {
  createExcelAdapterBundle,
  createExcelCatalogReader,
  createExcelCatalogWriter,
  type ExcelCatalogReaderSource,
} from '@jeyjo/erp-excel'
import {
  ErpIntegrationError,
  createStubAdapterBundle,
  createStubDocumentsReader,
  createStubPricingReader,
  type ErpCatalogReader,
  type ErpCatalogWriter,
  type ErpDocumentsReader,
  type ErpPricingReader,
} from '@jeyjo/erp-ports'

export type ErpAdapterKind = 'stub' | 'excel' | 'api'

export type ErpAdapterBundle = {
  kind: ErpAdapterKind
  catalogReader: ErpCatalogReader
  catalogWriter: ErpCatalogWriter
  documentsReader: ErpDocumentsReader
  pricingReader: ErpPricingReader
}

const SUPPORTED: ErpAdapterKind[] = ['stub', 'excel', 'api']

export function resolveErpAdapterKind(): ErpAdapterKind {
  const raw = process.env.ERP_ADAPTER?.trim().toLowerCase()

  if (!raw) {
    if (process.env.NODE_ENV === 'development') {
      return 'stub'
    }
    throw new Error(
      'ERP_ADAPTER is required in non-development environments (supported: stub, excel, api)',
    )
  }

  if (!SUPPORTED.includes(raw as ErpAdapterKind)) {
    throw new Error(`Unsupported ERP_ADAPTER="${raw}" (supported: ${SUPPORTED.join(', ')})`)
  }

  return raw as ErpAdapterKind
}

let cached: ErpAdapterBundle | null = null

function createInMemoryExcelBundle(source: ExcelCatalogReaderSource): ErpAdapterBundle {
  return {
    kind: 'excel',
    catalogReader: createExcelCatalogReader(source),
    catalogWriter: createExcelCatalogWriter(),
    documentsReader: createStubDocumentsReader(),
    pricingReader: createStubPricingReader(),
  }
}

export async function preloadExcelAdapter(): Promise<void> {
  if (resolveErpAdapterKind() !== 'excel') return
  if (cached?.kind === 'excel') return

  const bundle = await createExcelAdapterBundle()
  cached = { kind: 'excel', ...bundle }
}

export function setInMemoryExcelCatalogForTests(source: ExcelCatalogReaderSource): void {
  cached = createInMemoryExcelBundle(source)
}

export function getErpAdapters(): ErpAdapterBundle {
  if (cached) {
    return cached
  }

  const kind = resolveErpAdapterKind()

  switch (kind) {
    case 'stub': {
      const bundle = createStubAdapterBundle()
      cached = { kind, ...bundle }
      return cached
    }
    case 'excel': {
      throw new ErpIntegrationError(
        'ERP_UNAVAILABLE',
        'ERP_ADAPTER=excel requires preloadExcelAdapter() at startup or an in-memory import via catalog-import apply',
      )
    }
    case 'api':
      throw new ErpIntegrationError(
        'ERP_NOT_IMPLEMENTED',
        'ERP_ADAPTER=api is not implemented yet (see OpenSpec change #36)',
      )
    default:
      throw new Error(`Unhandled ERP_ADAPTER kind: ${kind satisfies never}`)
  }
}

/** Clear cached bundle (tests). */
export function resetErpAdapterCache(): void {
  cached = null
}
